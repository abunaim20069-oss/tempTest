"""Telegram bot that exposes a TempMail.Plus inbox via chat commands.

The bot lets users pick a temporary mailbox (random or custom username +
domain), view the inbox on demand, read individual messages, and receive
push notifications for newly arrived emails. It integrates with the public
TempMail.Plus HTTP API.
"""

from __future__ import annotations

import asyncio
import logging
import os
import random
import re
import string
from dataclasses import dataclass
from html import unescape
from html.parser import HTMLParser
from typing import Dict, List, Optional

import requests
from requests import RequestException, Session
from telegram import Update
from telegram.ext import (Application, ApplicationBuilder, CommandHandler,
                          ContextTypes)


LOGGER = logging.getLogger(__name__)

AVAILABLE_DOMAINS: List[str] = [
    "mailto.plus",
    "fexpost.com",
    "fexbox.org",
    "fexbox.ru",
    "mailbox.in.ua",
    "rover.info",
    "chitthi.in",
    "fextemp.com",
    "any.pink",
    "merepost.com",
]

DEFAULT_DOMAIN = "mailto.plus"
USERNAME_REGEX = re.compile(r"^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*$")
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "30"))
MAX_REPLY_LENGTH = 3500  # Telegram message hard limit is 4096


class TempmailAPIError(RuntimeError):
    """Custom exception raised when TempMail.Plus API calls fail."""


class _HTMLStripper(HTMLParser):
    """Utility html parser that extracts plain text."""

    def __init__(self) -> None:
        super().__init__()
        self._parts: List[str] = []

    def handle_data(self, data: str) -> None:  # type: ignore[override]
        if data:
            self._parts.append(data)

    def get_text(self) -> str:
        return "".join(self._parts)


def html_to_text(html: str) -> str:
    """Convert minimal HTML to a plaintext representation."""

    if not html:
        return ""

    normalized = re.sub(r"<\s*br\s*/?\s*>", "\n", html, flags=re.IGNORECASE)
    normalized = re.sub(r"</\s*p\s*>", "\n\n", normalized, flags=re.IGNORECASE)

    stripper = _HTMLStripper()
    stripper.feed(normalized)
    stripper.close()
    return unescape(stripper.get_text()).strip()


def random_username(length: int = 10) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


def validate_username(username: str) -> bool:
    return bool(USERNAME_REGEX.match(username))


def normalize_domain(domain: str) -> Optional[str]:
    candidate = domain.lower().strip()
    return candidate if candidate in AVAILABLE_DOMAINS else None


def format_mail_summary(mail: Dict) -> str:
    sender = mail.get("from_name") or mail.get("from_mail") or "(unknown sender)"
    subject = mail.get("subject") or "(no subject)"
    time_value = mail.get("time") or "(no timestamp)"
    mail_id = mail.get("mail_id")
    return (
        f"New email #{mail_id}\n"
        f"From: {sender}\n"
        f"Subject: {subject}\n"
        f"Time: {time_value}\n"
        f"Use /read {mail_id} to open the message."
    )


def truncate_text(text: str, limit: int = MAX_REPLY_LENGTH) -> str:
    if len(text) <= limit:
        return text
    return f"{text[:limit].rstrip()}\n... (truncated)"


@dataclass
class MailboxSession:
    email: str
    last_seen_id: int = 0
    notifications_enabled: bool = True


class TempmailPlusClient:
    """Thin wrapper around TempMail.Plus HTTP API."""

    BASE_URL = "https://tempmail.plus"

    def __init__(self) -> None:
        self._session: Session = requests.Session()
        self._session.headers.update(
            {
                "User-Agent": "TelegramTempMailBot/1.0",
                "Accept": "application/json",
            }
        )

    def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
    ) -> Dict:
        url = f"{self.BASE_URL}{path}"
        try:
            response = self._session.request(
                method,
                url,
                params=params,
                data=data,
                timeout=10,
            )
            response.raise_for_status()
        except RequestException as exc:  # pragma: no cover - network errors
            raise TempmailAPIError(f"Network error contacting TempMail.Plus: {exc}") from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise TempmailAPIError("TempMail.Plus returned an unexpected response.") from exc

        if isinstance(payload, dict):
            err = payload.get("err")
            if err:
                code = err.get("code") if isinstance(err, dict) else None
                message = err.get("message") if isinstance(err, dict) else str(err)
                raise TempmailAPIError(f"API error (code {code}): {message}")
        return payload

    async def mailbox_status(self, email: str) -> Dict:
        return await asyncio.to_thread(self._request, "GET", "/api/box", {"email": email})

    async def list_mails(
        self,
        email: str,
        limit: int = 10,
        page: int = 1,
    ) -> Dict:
        params = {"email": email, "limit": limit, "page": page}
        return await asyncio.to_thread(self._request, "GET", "/api/mails", params)

    async def get_mail(self, email: str, mail_id: int) -> Dict:
        params = {"email": email}
        return await asyncio.to_thread(self._request, "GET", f"/api/mails/{mail_id}", params)


def get_sessions(context: ContextTypes.DEFAULT_TYPE) -> Dict[int, MailboxSession]:
    return context.application.bot_data.setdefault("mail_sessions", {})


def get_client(context: ContextTypes.DEFAULT_TYPE) -> TempmailPlusClient:
    client = context.application.bot_data.get("mail_client")
    if client is None:
        client = TempmailPlusClient()
        context.application.bot_data["mail_client"] = client
    return client


def cancel_mail_job(application: Application, user_id: int) -> None:
    job_name = f"mailwatch_{user_id}"
    for job in application.job_queue.get_jobs_by_name(job_name):
        job.schedule_removal()


def schedule_mail_job(context: ContextTypes.DEFAULT_TYPE, user_id: int, chat_id: int) -> None:
    job_name = f"mailwatch_{user_id}"
    cancel_mail_job(context.application, user_id)
    context.application.job_queue.run_repeating(
        poll_mailbox,
        interval=POLL_INTERVAL_SECONDS,
        first=POLL_INTERVAL_SECONDS,
        chat_id=chat_id,
        name=job_name,
        user_id=user_id,
        data=user_id,
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = (
        "Hi! I can create and manage TempMail.Plus inboxes for you.\n\n"
        "Commands:\n"
        "/domains - list supported domains\n"
        "/new [name] [domain] - set mailbox (random if omitted)\n"
        "/current - show the active mailbox\n"
        "/inbox - list recent emails\n"
        "/read <mail_id> - read a message\n"
        "/notify <on|off> - toggle push notifications\n"
        "/stop - forget the current mailbox"
    )
    if update.message:
        await update.message.reply_text(message)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await start(update, context)


async def domains_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    lines = "\n".join(f"- {domain}" for domain in AVAILABLE_DOMAINS)
    text = f"Available domains:\n{lines}"
    if update.message:
        await update.message.reply_text(text)


async def current_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return

    sessions = get_sessions(context)
    session = sessions.get(update.effective_user.id)
    if not session:
        await update.message.reply_text("No mailbox is configured yet. Use /new to set one.")
        return

    status = "enabled" if session.notifications_enabled else "disabled"
    await update.message.reply_text(
        f"Current mailbox: {session.email}\nNotifications: {status}"
    )


async def new_mail_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return

    args = context.args
    username: Optional[str] = None
    domain: str = DEFAULT_DOMAIN

    if args:
        candidate = args[0]
        if "@" in candidate:
            parts = candidate.split("@", 1)
            username = parts[0]
            candidate_domain = normalize_domain(parts[1]) if len(parts) > 1 else None
            if candidate_domain:
                domain = candidate_domain
        else:
            username = candidate
            if len(args) > 1:
                normalized = normalize_domain(args[1])
                if normalized:
                    domain = normalized
    else:
        username = None

    if username:
        username = username.lower()
        if not validate_username(username):
            await update.message.reply_text(
                "Invalid username. Use letters, digits, dots, hyphens, or underscores."
            )
            return
    else:
        username = random_username()

    normalized_domain = normalize_domain(domain)
    if not normalized_domain:
        await update.message.reply_text("Unknown domain. Use /domains to see the valid list.")
        return
    domain = normalized_domain

    email_address = f"{username}@{domain}"
    client = get_client(context)

    try:
        await client.mailbox_status(email_address)
        mail_listing = await client.list_mails(email_address)
    except TempmailAPIError as exc:
        LOGGER.exception("Failed to configure mailbox")
        await update.message.reply_text(f"Could not access mailbox: {exc}")
        return

    last_seen_id = 0
    mail_list = mail_listing.get("mail_list") or []
    if mail_list:
        last_seen_id = max(mail.get("mail_id", 0) for mail in mail_list)

    sessions = get_sessions(context)
    sessions[update.effective_user.id] = MailboxSession(
        email=email_address,
        last_seen_id=last_seen_id,
        notifications_enabled=True,
    )

    schedule_mail_job(context, update.effective_user.id, update.effective_chat.id)

    await update.message.reply_text(
        f"Mailbox set to {email_address}. I will check for new emails every "
        f"{POLL_INTERVAL_SECONDS} seconds."
    )


async def inbox_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return

    sessions = get_sessions(context)
    session = sessions.get(update.effective_user.id)
    if not session:
        await update.message.reply_text("No mailbox configured. Use /new first.")
        return

    client = get_client(context)
    try:
        listing = await client.list_mails(session.email, limit=10)
    except TempmailAPIError as exc:
        LOGGER.exception("Failed to fetch inbox")
        await update.message.reply_text(f"Failed to load inbox: {exc}")
        return

    mail_list = listing.get("mail_list") or []
    if not mail_list:
        await update.message.reply_text("Inbox is empty.")
        return

    lines = []
    for item in mail_list:
        mail_id = item.get("mail_id")
        sender = item.get("from_name") or item.get("from_mail") or "(unknown)"
        subject = item.get("subject") or "(no subject)"
        time_value = item.get("time") or "(no time)"
        lines.append(f"#{mail_id} — {sender} — {subject} — {time_value}")

    await update.message.reply_text("\n".join(lines))


async def read_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return

    if not context.args:
        await update.message.reply_text("Usage: /read <mail_id>")
        return

    try:
        mail_id = int(context.args[0])
    except ValueError:
        await update.message.reply_text("Mail ID must be a number.")
        return

    sessions = get_sessions(context)
    session = sessions.get(update.effective_user.id)
    if not session:
        await update.message.reply_text("No mailbox configured. Use /new first.")
        return

    client = get_client(context)
    try:
        mail = await client.get_mail(session.email, mail_id)
    except TempmailAPIError as exc:
        LOGGER.exception("Failed to read mail")
        await update.message.reply_text(f"Could not load mail: {exc}")
        return

    sender = mail.get("from") or mail.get("from_name") or mail.get("from_mail")
    subject = mail.get("subject") or "(no subject)"
    date_value = mail.get("date") or mail.get("time") or "(no date)"
    attachments = mail.get("attachments") or []

    body = mail.get("text")
    if not body:
        html_body = mail.get("html")
        body = html_to_text(html_body or "") or "(message body is empty)"

    attachment_line = ""
    if attachments:
        names = [att.get("name") for att in attachments if att.get("name")]
        if names:
            attachment_line = "\nAttachments: " + ", ".join(names)

    message = truncate_text(
        (
            f"Mail #{mail_id}\nFrom: {sender}\nSubject: {subject}\nDate: {date_value}"
            f"{attachment_line}\n\n{body.strip()}"
        )
    )
    await update.message.reply_text(message)


async def notify_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return

    sessions = get_sessions(context)
    session = sessions.get(update.effective_user.id)
    if not session:
        await update.message.reply_text("No mailbox configured. Use /new first.")
        return

    if not context.args:
        state = "on" if session.notifications_enabled else "off"
        await update.message.reply_text(f"Notifications are currently {state}.")
        return

    choice = context.args[0].lower()
    if choice not in {"on", "off"}:
        await update.message.reply_text("Usage: /notify <on|off>")
        return

    session.notifications_enabled = choice == "on"
    await update.message.reply_text(f"Notifications turned {choice}.")


async def stop_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return

    sessions = get_sessions(context)
    removed = sessions.pop(update.effective_user.id, None)
    cancel_mail_job(context.application, update.effective_user.id)

    if removed:
        await update.message.reply_text("Mailbox cleared and notifications stopped.")
    else:
        await update.message.reply_text("No mailbox was configured.")


async def poll_mailbox(context: ContextTypes.DEFAULT_TYPE) -> None:
    job = context.job
    if not job:
        return

    user_id = job.data if isinstance(job.data, int) else job.user_id
    sessions = get_sessions(context)
    session = sessions.get(user_id)
    if not session:
        cancel_mail_job(context.application, user_id)
        return

    client = get_client(context)
    try:
        listing = await client.list_mails(session.email, limit=10)
    except TempmailAPIError as exc:
        LOGGER.warning("Polling failed for %s: %s", session.email, exc)
        return

    mail_list = listing.get("mail_list") or []
    if not mail_list:
        return

    new_items = [
        mail for mail in reversed(mail_list) if mail.get("mail_id", 0) > session.last_seen_id
    ]

    if not new_items:
        # Update last_seen to avoid it falling behind if messages were deleted.
        session.last_seen_id = max(session.last_seen_id, mail_list[0].get("mail_id", 0))
        return

    session.last_seen_id = max(session.last_seen_id, new_items[-1].get("mail_id", 0))

    if not session.notifications_enabled:
        return

    for mail in new_items:
        text = format_mail_summary(mail)
        try:
            await context.bot.send_message(job.chat_id, text)
        except Exception as exc:  # pragma: no cover - Telegram errors
            LOGGER.warning("Failed to push mail notification: %s", exc)


def build_application(token: str) -> Application:
    application = ApplicationBuilder().token(token).build()

    application.bot_data["mail_client"] = TempmailPlusClient()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("domains", domains_command))
    application.add_handler(CommandHandler(["new", "setmail", "random"], new_mail_command))
    application.add_handler(CommandHandler("current", current_command))
    application.add_handler(CommandHandler("inbox", inbox_command))
    application.add_handler(CommandHandler("read", read_command))
    application.add_handler(CommandHandler("notify", notify_command))
    application.add_handler(CommandHandler(["stop", "stopmail"], stop_command))

    return application


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN environment variable must be set")

    application = build_application(token)
    LOGGER.info("Starting bot with polling interval %s seconds", POLL_INTERVAL_SECONDS)
    application.run_polling()


if __name__ == "__main__":
    main()
