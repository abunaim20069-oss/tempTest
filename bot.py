
#!/usr/bin/env python3
"""
Advanced Telegram Temporary Email Bot
Uses TempMail.plus API for custom domains and email addresses
"""

import asyncio
import logging
import re
import requests
import json
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# TempMail.plus API endpoints
TEMPMAIL_API = "https://tempmail.plus/api"

# User data storage
user_data = {}
# Track last checked emails to detect new ones
user_last_check = {}


def escape_markdown(text):
    """Escape special characters for Telegram MarkdownV2"""
    if not text:
        return ""
    
    # Characters that need to be escaped in MarkdownV2
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    
    text = str(text)
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    
    return text


async def check_new_emails(context: ContextTypes.DEFAULT_TYPE):
    """Background task to check for new emails and codes"""
    for user_id, data in list(user_data.items()):
        if 'email' not in data:
            continue
        
        email = data['email']
        
        try:
            inbox = api.get_inbox(email)
        except Exception as e:
            logger.error(f"Error getting inbox for {email}: {e}")
            continue
        
        if not inbox:
            continue
        
        # Get mail IDs we've already seen
        seen_ids = user_last_check.get(user_id, [])
        
        # Check for new emails
        for mail in inbox:
            mail_id = mail.get('mail_id')
            if mail_id in seen_ids:
                continue
            
            # New email found!
            subject = mail.get('subject', 'No Subject')
            from_addr = mail.get('from_mail', 'Unknown')
            
            # Check for codes
            try:
                full_mail = api.read_email(email, mail_id)
            except Exception as e:
                logger.error(f"Error reading email {mail_id}: {e}")
                full_mail = None
            
            if full_mail:
                body = full_mail.get('text', '') or full_mail.get('html', '')
                codes = extract_codes(f"{subject} {body}")
                
                # Send notification
                if codes:
                    # Create a single comprehensive message with codes
                    message = "🔔 NEW EMAIL WITH CODE!\n\n"
                    message += "🔑 Codes Found:\n\n"
                    
                    for idx, code in enumerate(codes[:5], 1):
                        message += f"{idx}. From: {from_addr}\n"
                        message += f"Subject: {subject[:30]}...\n"
                        message += f"Codes: <code>{code}</code>  \n\n"
                    
                    message += "📋 Tap any code to copy!"
                    
                    keyboard = [
                        [InlineKeyboardButton("📖 Read Full Email", callback_data=f'read_{mail_id}')],
                        [InlineKeyboardButton("📬 Check Inbox", callback_data='check_inbox')]
                    ]
                    reply_markup = InlineKeyboardMarkup(keyboard)
                    
                    try:
                        await context.bot.send_message(
                            chat_id=user_id,
                            text=message,
                            parse_mode='HTML',
                            reply_markup=reply_markup
                        )
                    except Exception as e:
                        logger.error(f"Failed to send notification: {e}")
                else:
                    # No codes - simple notification
                    message = (
                        f"📧 New Email Received\n\n"
                        f"📨 From: {from_addr}\n"
                        f"📝 Subject: {subject[:50]}"
                    )
                    
                    keyboard = [
                        [InlineKeyboardButton("📖 Read Email", callback_data=f'read_{mail_id}')],
                        [InlineKeyboardButton("📬 Check Inbox", callback_data='check_inbox')]
                    ]
                    reply_markup = InlineKeyboardMarkup(keyboard)
                    
                    try:
                        await context.bot.send_message(
                            chat_id=user_id,
                            text=message,
                            reply_markup=reply_markup
                        )
                    except Exception as e:
                        logger.error(f"Failed to send notification: {e}")
            
            # Mark as seen
            if user_id not in user_last_check:
                user_last_check[user_id] = []
            user_last_check[user_id].append(mail_id)


class TempMailPlusAPI:
    """API wrapper for TempMail.plus"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        })
    
    def get_domains(self):
        """Get available domains"""
        try:
            # Two main domains
            return ['any.pink', 'mailto.plus']
        except Exception as e:
            logger.error(f"Error getting domains: {e}")
            return ['any.pink', 'mailto.plus']
    
    def create_email(self, username, domain):
        """Create a new email address"""
        try:
            email = f"{username}@{domain}"
            # Initialize mailbox
            url = f"https://tempmail.plus/api/mails?email={email}&limit=10&epin="
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                return email
            return None
        except Exception as e:
            logger.error(f"Error creating email: {e}")
            return None
    
    def get_inbox(self, email):
        """Get inbox for an email"""
        try:
            url = f"https://tempmail.plus/api/mails?email={email}&limit=20&epin="
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('mail_list', [])
            return []
        except Exception as e:
            logger.error(f"Error getting inbox: {e}")
            return []
    
    def read_email(self, email, mail_id):
        """Read a specific email"""
        try:
            url = f"https://tempmail.plus/api/mails/{mail_id}?email={email}&epin="
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"Error reading email: {e}")
            return None


# Initialize API
api = TempMailPlusAPI()


def extract_codes(text):
    """Extract OTP/verification codes from text"""
    if not text:
        return []
    
    codes = []
    
    # Pattern for 4-8 digit codes
    digit_codes = re.findall(r'\b\d{4,8}\b', text)
    codes.extend(digit_codes)
    
    # Pattern for alphanumeric codes (like ABC123)
    alpha_codes = re.findall(r'\b[A-Z0-9]{6,10}\b', text)
    codes.extend(alpha_codes)
    
    # Pattern for codes with dashes (like 123-456)
    dash_codes = re.findall(r'\b\d{3}-\d{3,4}\b', text)
    codes.extend(dash_codes)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_codes = []
    for code in codes:
        if code not in seen:
            seen.add(code)
            unique_codes.append(code)
    
    return unique_codes[:5]  # Return max 5 codes


def generate_cool_username():
    """Generate a cool, readable username"""
    import random
    
    # Cool prefixes
    prefixes = [
        'sunxe', 'cyber', 'pixel', 'ninja', 'alpha', 'mega', 'super', 'hyper',
        'turbo', 'crypto', 'neon', 'laser', 'galaxy', 'cosmic', 'stellar',
        'quantum', 'phantom', 'shadow', 'thunder', 'blaze', 'storm', 'frost',
        'sonic', 'ultra', 'prime', 'nexus', 'vertex', 'zenith', 'apex'
    ]
    
    # Cool suffixes
    suffixes = [
        'pro', 'dev', 'tech', 'hub', 'lab', 'zone', 'net', 'web', 'app',
        'code', 'byte', 'bit', 'core', 'wave', 'edge', 'link', 'node',
        'user', 'gen', 'max', 'one', 'zero', 'x', 'z', 'star', 'king'
    ]
    
    # Generate username
    prefix = random.choice(prefixes)
    suffix = random.choice(suffixes)
    number = random.randint(10, 99)
    
    # Random format
    formats = [
        f"{prefix}{number}",
        f"{prefix}{suffix}",
        f"{prefix}{suffix}{number}",
        f"{prefix}_{suffix}",
        f"{prefix}.{suffix}"
    ]
    
    return random.choice(formats)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command"""
    user_id = update.effective_user.id
    
    welcome_message = (
        "🎉 Welcome to Temp Mail Bot!\n\n"
        "✨ Create temporary email instantly\n"
        "📧 Domains: @any.pink, @mailto.plus\n"
        "🔑 Auto-detect verification codes\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "📬 MAIN MENU\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "Choose an option below:"
    )
    
    keyboard = [
        [InlineKeyboardButton("⚡ Auto Generate Email", callback_data='auto_generate')],
        [InlineKeyboardButton("🎨 Create Custom Email", callback_data='create_email')],
        [InlineKeyboardButton("🔑 Get Codes", callback_data='extract_codes')],
        [InlineKeyboardButton("📧 Show My Email", callback_data='show_email')],
        [InlineKeyboardButton("❓ Help & Info", callback_data='show_help')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(welcome_message, reply_markup=reply_markup)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Help command"""
    help_text = (
        "*📧 Temp Mail Bot - Help*\n\n"
        "*Commands:*\n"
        "/start - Start the bot\n"
        "/create - Create custom email address\n"
        "/random - Generate random email\n"
        "/inbox - Check your inbox\n"
        "/email - Show current email\n"
        "/codes - Show all codes from emails\n"
        "/domains - Show available domains\n"
        "/help - Show this help\n\n"
        "*How to use:*\n"
        "1️⃣ Use /create to make custom email\n"
        "2️⃣ Or use /random for quick email\n"
        "3️⃣ Use the email anywhere\n"
        "4️⃣ Check /inbox for emails\n"
        "5️⃣ Use /codes to extract OTP/codes\n\n"
        "*Features:*\n"
        "✅ Custom usernames\n"
        "✅ Multiple domains\n"
        "✅ Auto code detection\n"
        "✅ Real-time updates\n\n"
        "⚡ Powered by TempMail.plus"
    )
    
    await update.message.reply_text(help_text, parse_mode='Markdown')


async def show_domains(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show available domains"""
    domains = api.get_domains()
    
    message = "*📋 Available Domains:*\n\n"
    for idx, domain in enumerate(domains, 1):
        message += f"{idx}. `{domain}`\n"
    
    message += "\n💡 Use /create to make your custom email!"
    
    await update.message.reply_text(message, parse_mode='Markdown')


async def create_custom_email(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start custom email creation"""
    user_id = update.effective_user.id
    
    # Show domain selection
    domains = api.get_domains()
    keyboard = []
    
    for domain in domains:
        keyboard.append([InlineKeyboardButton(f"@{domain}", callback_data=f"domain_{domain}")])
    
    keyboard.append([InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')])
    
    message = (
        "🎨 Create Custom Email\n\n"
        "Step 1: Choose domain\n"
        "Step 2: Send your username\n\n"
        "Select domain:"
    )
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(message, reply_markup=reply_markup)


async def generate_random_email(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Generate random email"""
    user_id = update.effective_user.id
    
    import random
    import string
    
    # Generate random username
    username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    domain = 'any.pink'
    
    status_msg = await update.message.reply_text("⏳ Creating email...")
    
    email = api.create_email(username, domain)
    
    if email:
        user_data[user_id] = {'email': email, 'domain': domain}
        
        keyboard = [
            [InlineKeyboardButton("📬 Check Inbox", callback_data='check_inbox')],
            [InlineKeyboardButton("🔄 New Random Email", callback_data='random_email')],
            [InlineKeyboardButton("🔑 Extract Codes", callback_data='extract_codes')],
            [InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = (
            f"✅ Email Created Successfully!\n\n"
            f"📧 Your Email:\n<code>{email}</code>\n\n"
            f"📋 Tap email to copy\n\n"
            f"🔔 AUTO-NOTIFICATION ACTIVE!\n"
            f"💡 When code arrives:\n"
            f"   • Bot will send you directly\n"
            f"   • No need to click anything\n"
            f"   • Just tap code to copy\n\n"
            f"⏱️ Checking every 15 seconds..."
        )
        
        # Start monitoring inbox for this user
        user_last_check[user_id] = []
        
        await status_msg.edit_text(message, parse_mode='HTML', reply_markup=reply_markup)
    else:
        await status_msg.edit_text("❌ Failed to create email. Try again!")


async def show_current_email(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show current email"""
    user_id = update.effective_user.id
    
    if user_id not in user_data or 'email' not in user_data[user_id]:
        await update.message.reply_text(
            "❌ No email found!\n"
            "Use /create or /random to get one."
        )
        return
    
    email = user_data[user_id]['email']
    
    keyboard = [
        [InlineKeyboardButton("📬 Check Inbox", callback_data='check_inbox')],
        [InlineKeyboardButton("🔑 Extract Codes", callback_data='extract_codes')],
        [InlineKeyboardButton("🔄 New Email", callback_data='create_email')],
        [InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    message = (
        f"📧 Your Current Email:\n\n"
        f"<code>{email}</code>\n\n"
        f"📋 Tap to copy\n"
        f"✅ Active and ready to receive"
    )
    
    await update.message.reply_text(message, parse_mode='HTML', reply_markup=reply_markup)


async def check_inbox(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Check inbox"""
    user_id = update.effective_user.id
    
    if user_id not in user_data or 'email' not in user_data[user_id]:
        await update.message.reply_text(
            "❌ No email found!\n"
            "Use /create or /random first."
        )
        return
    
    email = user_data[user_id]['email']
    status_msg = await update.message.reply_text("🔍 Checking inbox...")
    
    inbox = api.get_inbox(email)
    
    if not inbox:
        keyboard = [[InlineKeyboardButton("🔄 Refresh", callback_data='check_inbox')]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await status_msg.edit_text(
            f"📭 Inbox Empty\n\n"
            f"Email: {email}\n\n"
            f"Waiting for emails...",
            reply_markup=reply_markup
        )
        return
    
    # Show inbox
    keyboard = []
    message = f"📬 Inbox: {email}\n\n"
    message += f"📨 {len(inbox)} email(s) received\n\n"
    
    for idx, mail in enumerate(inbox[:10], 1):
        from_addr = mail.get('from_mail', 'Unknown')
        subject = mail.get('subject', 'No Subject')[:40]
        mail_id = mail.get('mail_id')
        
        # Extract code if present in subject
        codes = extract_codes(subject)
        code_indicator = " 🔑" if codes else ""
        
        message += f"{idx}. From: {from_addr}\n"
        message += f"   Subject: {subject}{code_indicator}\n\n"
        
        keyboard.append([
            InlineKeyboardButton(
                f"📖 Read #{idx}",
                callback_data=f'read_{mail_id}'
            )
        ])
    
    keyboard.append([
        InlineKeyboardButton("🔄 Refresh", callback_data='check_inbox'),
        InlineKeyboardButton("🔑 Get Codes", callback_data='extract_codes')
    ])
    keyboard.append([InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await status_msg.edit_text(message, reply_markup=reply_markup)


async def extract_all_codes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Extract all codes from inbox"""
    user_id = update.effective_user.id
    
    if user_id not in user_data or 'email' not in user_data[user_id]:
        await update.message.reply_text("❌ No email found!")
        return
    
    email = user_data[user_id]['email']
    status_msg = await update.message.reply_text("🔍 Extracting codes...")
    
    inbox = api.get_inbox(email)
    
    if not inbox:
        await status_msg.edit_text("📭 No emails found!")
        return
    
    all_codes = []
    
    for mail in inbox:
        subject = mail.get('subject', '')
        mail_id = mail.get('mail_id')
        
        # Get full email content
        full_mail = api.read_email(email, mail_id)
        if full_mail:
            body = full_mail.get('text', '') or full_mail.get('html', '')
            text = f"{subject} {body}"
            codes = extract_codes(text)
            
            if codes:
                from_addr = mail.get('from_mail', 'Unknown')
                all_codes.append({
                    'from': from_addr,
                    'subject': subject[:30],
                    'codes': codes
                })
    
    if not all_codes:
        await status_msg.edit_text(
            "❌ No codes found in emails!\n\n"
            "Codes will appear here when detected."
        )
        return
    
    message = "🔑 Verification Codes Found:\n\n"
    
    for idx, item in enumerate(all_codes, 1):
        message += f"{idx}. From: {item['from']}\n"
        message += f"Subject: {item['subject']}...\n"
        message += "Codes: "
        for code in item['codes']:
            message += f"<code>{code}</code>  "
        message += "\n\n"
    
    message += "📋 Tap any code to copy!"
    
    keyboard = [
        [InlineKeyboardButton("🔄 Refresh Codes", callback_data='extract_codes')],
        [InlineKeyboardButton("📬 Back to Inbox", callback_data='check_inbox')],
        [InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await status_msg.edit_text(message, parse_mode='HTML', reply_markup=reply_markup)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle custom username input"""
    user_id = update.effective_user.id
    text = update.message.text.strip()
    
    # Check if user is in domain selection mode
    if user_id in user_data and 'pending_domain' in user_data[user_id]:
        domain = user_data[user_id]['pending_domain']
        
        # Validate username
        if not re.match(r'^[a-zA-Z0-9._-]{3,20}$', text):
            await update.message.reply_text(
                "❌ Invalid username!\n\n"
                "Rules:\n"
                "• 3-20 characters\n"
                "• Letters, numbers, dots, underscores, hyphens only\n"
                "• No spaces\n\n"
                "Try again:"
            )
            return
        
        username = text.lower()
        status_msg = await update.message.reply_text("⏳ Creating email...")
        
        email = api.create_email(username, domain)
        
        if email:
            user_data[user_id] = {'email': email, 'domain': domain}
            
            keyboard = [
                [InlineKeyboardButton("📬 Check Inbox", callback_data='check_inbox')],
                [InlineKeyboardButton("🔑 Extract Codes", callback_data='extract_codes')],
                [InlineKeyboardButton("🔄 New Email", callback_data='random_email')],
                [InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            message = (
                f"✅ Custom Email Created!\n\n"
                f"📧 Your Email:\n<code>{email}</code>\n\n"
                f"📋 Tap email to copy\n\n"
                f"🔔 AUTO-NOTIFICATION ACTIVE!\n"
                f"💡 When code arrives:\n"
                f"   • Bot will send you directly\n"
                f"   • No need to click anything\n"
                f"   • Just tap code to copy\n\n"
                f"⏱️ Checking every 15 seconds..."
            )
            
            # Start monitoring inbox for this user
            user_last_check[user_id] = []
            
            await status_msg.edit_text(message, parse_mode='HTML', reply_markup=reply_markup)
        else:
            await status_msg.edit_text("❌ Failed to create email. Try different username!")


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    data = query.data
    
    if data == 'auto_generate':
        # Auto generate cool email with domain selection
        domains = api.get_domains()
        keyboard = []
        
        for domain in domains:
            keyboard.append([InlineKeyboardButton(f"⚡ Generate @{domain}", callback_data=f"gen_{domain}")])
        
        keyboard.append([InlineKeyboardButton("◀️ Back to Menu", callback_data='back_to_menu')])
        
        message = (
            "⚡ Auto Generate Email\n\n"
            "Select domain for auto-generated email:\n\n"
            "💡 Examples:\n"
            "• sunxe@any.pink\n"
            "• cyber45@mailto.plus\n"
            "• ninja_pro@any.pink\n\n"
            "Cool username will be generated automatically!"
        )
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup)
    
    elif data.startswith('gen_'):
        # Generate email with selected domain
        domain = data.replace('gen_', '')
        username = generate_cool_username()
        
        await query.edit_message_text("⏳ Generating cool email...")
        
        email = api.create_email(username, domain)
        
        if email:
            user_data[user_id] = {'email': email, 'domain': domain}
            
            keyboard = [
                [InlineKeyboardButton("📬 Check Inbox", callback_data='check_inbox')],
                [InlineKeyboardButton("🔄 Generate Another", callback_data='auto_generate')],
                [InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            message = (
                f"⚡ Auto-Generated Email!\n\n"
                f"📧 <code>{email}</code>\n\n"
                f"📋 Tap to copy\n\n"
                f"🔔 AUTO-NOTIFICATION: ON\n"
                f"⏱️ Checking every 15 seconds\n"
                f"💡 Codes will be sent directly!"
            )
            
            # Start monitoring inbox for this user
            user_last_check[user_id] = []
            
            await query.edit_message_text(message, parse_mode='HTML', reply_markup=reply_markup)
        else:
            await query.edit_message_text("❌ Failed! Try again.")
    
    elif data == 'create_email':
        # Show domain selection for custom email
        domains = api.get_domains()
        keyboard = []
        
        for domain in domains:
            keyboard.append([InlineKeyboardButton(f"@{domain}", callback_data=f"domain_{domain}")])
        
        keyboard.append([InlineKeyboardButton("◀️ Back to Menu", callback_data='back_to_menu')])
        
        message = (
            "🎨 Create Custom Email\n\n"
            "Step 1: Choose domain\n"
            "Step 2: Send your username\n\n"
            "Select domain:"
        )
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup)
    
    elif data == 'show_email':
        # Show current email
        if user_id not in user_data or 'email' not in user_data[user_id]:
            keyboard = [
                [InlineKeyboardButton("🎨 Create Email", callback_data='create_email')],
                [InlineKeyboardButton("🎲 Random Email", callback_data='random_email')],
                [InlineKeyboardButton("◀️ Back to Menu", callback_data='back_to_menu')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text(
                "❌ No email found!\n\nCreate one using the buttons below:",
                reply_markup=reply_markup
            )
            return
        
        email = user_data[user_id]['email']
        
        keyboard = [
            [InlineKeyboardButton("📬 Check Inbox", callback_data='check_inbox')],
            [InlineKeyboardButton("🔑 Extract Codes", callback_data='extract_codes')],
            [InlineKeyboardButton("🔄 New Email", callback_data='create_email')],
            [InlineKeyboardButton("◀️ Back to Menu", callback_data='back_to_menu')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"📧 Your Current Email:\n\n<code>{email}</code>\n\n📋 Tap to copy\n✅ Active and ready to receive"
        await query.edit_message_text(message, parse_mode='HTML', reply_markup=reply_markup)
    
    elif data == 'show_domains':
        # Show available domains
        domains = api.get_domains()
        
        message = "*📋 Available Domains:*\n\n"
        for idx, domain in enumerate(domains, 1):
            message += f"{idx}. `{domain}`\n"
        
        message += "\n💡 Use 'Create Custom Email' to make your email!"
        
        keyboard = [
            [InlineKeyboardButton("🎨 Create Email", callback_data='create_email')],
            [InlineKeyboardButton("◀️ Back to Menu", callback_data='back_to_menu')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(message, parse_mode='Markdown', reply_markup=reply_markup)
    
    elif data == 'show_help':
        # Show help message
        help_text = (
            "*📧 Temp Mail Bot - Help*\n\n"
            "*Features:*\n"
            "✅ Custom usernames\n"
            "✅ Multiple domains\n"
            "✅ Auto code detection\n"
            "✅ Real-time updates\n\n"
            "*How to use:*\n"
            "1️⃣ Click 'Create Custom Email'\n"
            "2️⃣ Select a domain\n"
            "3️⃣ Send your username\n"
            "4️⃣ Use the email anywhere\n"
            "5️⃣ Check inbox for emails\n"
            "6️⃣ Codes auto-detected\n\n"
            "⚡ Powered by TempMail.plus"
        )
        
        keyboard = [[InlineKeyboardButton("◀️ Back to Menu", callback_data='back_to_menu')]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(help_text, parse_mode='Markdown', reply_markup=reply_markup)
    
    elif data == 'back_to_menu':
        # Back to main menu
        welcome_message = (
            "🎉 Welcome to Temp Mail Bot!\n\n"
            "✨ Create temporary email instantly\n"
            "📧 Domains: @any.pink, @mailto.plus\n"
            "🔑 Auto-detect verification codes\n\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            "📬 MAIN MENU\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n\n"
            "Choose an option below:"
        )
        
        keyboard = [
            [InlineKeyboardButton("⚡ Auto Generate Email", callback_data='auto_generate')],
            [InlineKeyboardButton("🎨 Create Custom Email", callback_data='create_email')],
            [InlineKeyboardButton("🔑 Get Codes", callback_data='extract_codes')],
            [InlineKeyboardButton("📧 Show My Email", callback_data='show_email')],
            [InlineKeyboardButton("❓ Help & Info", callback_data='show_help')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(welcome_message, reply_markup=reply_markup)
    
    elif data.startswith('domain_'):
        domain = data.replace('domain_', '')
        user_data[user_id] = {'pending_domain': domain}
        
        message = (
            f"✅ Domain selected: @{domain}\n\n"
            f"Now send your desired username:\n\n"
            f"📝 Rules:\n"
            f"• 3-20 characters\n"
            f"• Letters, numbers allowed\n"
            f"• Can use: . _ -\n"
            f"• No spaces\n\n"
            f"💡 Example: myemail123\n"
            f"Result: myemail123@{domain}"
        )
        
        keyboard = [[InlineKeyboardButton("◀️ Back", callback_data='create_email')]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(message, reply_markup=reply_markup)
    
    elif data == 'check_inbox':
        if user_id not in user_data or 'email' not in user_data[user_id]:
            await query.edit_message_text("❌ No email found!")
            return
        
        email = user_data[user_id]['email']
        await query.edit_message_text("🔍 Checking inbox...")
        
        inbox = api.get_inbox(email)
        
        if not inbox:
            keyboard = [[InlineKeyboardButton("🔄 Refresh", callback_data='check_inbox')]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(
                f"📭 Inbox Empty\n\n"
                f"Email: {email}\n\n"
                f"Waiting for emails...",
                reply_markup=reply_markup
            )
            return
        
        # Show inbox
        keyboard = []
        message = f"📬 Inbox: {email}\n\n"
        message += f"📨 {len(inbox)} email(s) received\n\n"
        
        for idx, mail in enumerate(inbox[:10], 1):
            from_addr = mail.get('from_mail', 'Unknown')
            subject = mail.get('subject', 'No Subject')[:40]
            mail_id = mail.get('mail_id')
            
            codes = extract_codes(subject)
            code_indicator = " 🔑" if codes else ""
            
            message += f"{idx}. From: {from_addr}\n"
            message += f"   Subject: {subject}{code_indicator}\n\n"
            
            keyboard.append([
                InlineKeyboardButton(f"📖 Read #{idx}", callback_data=f'read_{mail_id}')
            ])
        
        keyboard.append([
            InlineKeyboardButton("🔄 Refresh", callback_data='check_inbox'),
            InlineKeyboardButton("🔑 Get Codes", callback_data='extract_codes')
        ])
        keyboard.append([InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup)
    
    elif data == 'random_email':
        import random
        import string
        
        username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        domain = 'any.pink'
        
        await query.edit_message_text("⏳ Creating new email...")
        
        email = api.create_email(username, domain)
        
        if email:
            user_data[user_id] = {'email': email, 'domain': domain}
            
            keyboard = [
                [InlineKeyboardButton("📬 Check Inbox", callback_data='check_inbox')],
                [InlineKeyboardButton("🔄 New Random", callback_data='random_email')],
                [InlineKeyboardButton("🔑 Extract Codes", callback_data='extract_codes')],
                [InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            message = (
                f"✅ New Email Created!\n\n"
                f"📧 <code>{email}</code>\n\n"
                f"📋 Tap to copy\n\n"
                f"🔔 AUTO-NOTIFICATION: ON\n"
                f"⏱️ Checking every 15 seconds\n"
                f"💡 Codes will be sent directly!"
            )
            
            # Start monitoring inbox for this user
            user_last_check[user_id] = []
            
            await query.edit_message_text(message, parse_mode='HTML', reply_markup=reply_markup)
        else:
            await query.edit_message_text("❌ Failed! Try again.")
    
    elif data == 'extract_codes':
        if user_id not in user_data or 'email' not in user_data[user_id]:
            await query.edit_message_text("❌ No email found!")
            return
        
        email = user_data[user_id]['email']
        await query.edit_message_text("🔍 Extracting codes...")
        
        inbox = api.get_inbox(email)
        
        if not inbox:
            await query.edit_message_text("📭 No emails to extract codes from!")
            return
        
        all_codes = []
        
        for mail in inbox:
            subject = mail.get('subject', '')
            mail_id = mail.get('mail_id')
            
            full_mail = api.read_email(email, mail_id)
            if full_mail:
                body = full_mail.get('text', '') or full_mail.get('html', '')
                text = f"{subject} {body}"
                codes = extract_codes(text)
                
                if codes:
                    from_addr = mail.get('from_mail', 'Unknown')
                    all_codes.append({
                        'from': from_addr,
                        'subject': subject[:30],
                        'codes': codes
                    })
        
        if not all_codes:
            keyboard = [[InlineKeyboardButton("◀️ Back", callback_data='check_inbox')]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(
                "❌ No codes found!\n\n"
                "Codes will be detected automatically.",
                reply_markup=reply_markup
            )
            return
        
        message = "🔑 Codes Found:\n\n"
        
        for idx, item in enumerate(all_codes, 1):
            message += f"{idx}. From: {item['from']}\n"
            message += f"Subject: {item['subject']}...\n"
            message += "Codes: "
            for code in item['codes']:
                message += f"<code>{code}</code>  "
            message += "\n\n"
        
        message += "📋 Tap any code to copy!"
        
        keyboard = [
            [InlineKeyboardButton("🔄 Refresh", callback_data='extract_codes')],
            [InlineKeyboardButton("📬 Back to Inbox", callback_data='check_inbox')],
            [InlineKeyboardButton("◀️ Main Menu", callback_data='back_to_menu')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(message, parse_mode='HTML', reply_markup=reply_markup)
    
    elif data.startswith('read_'):
        mail_id = data.replace('read_', '')
        
        if user_id not in user_data or 'email' not in user_data[user_id]:
            await query.edit_message_text("❌ No email found!")
            return
        
        email = user_data[user_id]['email']
        await query.edit_message_text("📖 Loading email...")
        
        mail_data = api.read_email(email, mail_id)
        
        if not mail_data:
            await query.edit_message_text("❌ Failed to load email!")
            return
        
        from_addr = mail_data.get('from_mail', 'Unknown')
        subject = mail_data.get('subject', 'No Subject')
        date = mail_data.get('date', '')
        text_body = mail_data.get('text', '')
        html_body = mail_data.get('html', '')
        
        body = text_body or html_body or 'No content'
        
        # Extract codes
        codes = extract_codes(f"{subject} {body}")
        
        # Truncate if too long
        if len(body) > 2000:
            body = body[:2000] + "\n\n... [Truncated]"
        
        message = (
            f"📧 Email Details\n\n"
            f"From: {from_addr}\n"
            f"Subject: {subject}\n"
            f"Date: {date}\n"
        )
        
        if codes:
            message += f"\n🔑 Codes Detected:\n"
            for code in codes:
                message += f"<code>{code}</code>  "
            message += f"\n📋 Tap to copy\n"
        
        message += f"\n━━━━━━━━━━━━━\n\n{body}"
        
        keyboard = [
            [InlineKeyboardButton("◀️ Back to Inbox", callback_data='check_inbox')],
            [InlineKeyboardButton("🏠 Main Menu", callback_data='back_to_menu')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(message, parse_mode='HTML', reply_markup=reply_markup)


def main():
    """Start the bot"""
    print("=" * 60)
    print("  TELEGRAM TEMP MAIL BOT - POWERED BY TEMPMAIL.PLUS")
    print("=" * 60)
    print("\n🔧 Setup Instructions:")
    print("1. Get bot token from @BotFather on Telegram")
    print("2. Send /newbot to @BotFather")
    print("3. Follow instructions and copy the token")
    print("=" * 60)
    
    token = input("\n🔑 Enter your bot token: ").strip()
    
    if not token:
        print("❌ No token provided!")
        return
    
    print("\n🚀 Starting bot...")
    print("✅ Bot is running! Press Ctrl+C to stop.")
    print("🔔 Auto-notification: ENABLED")
    print("⏱️  Checking emails every 15 seconds")
    print("💡 Codes will be sent directly to users!")
    print("=" * 60)
    
    # Create application with job queue enabled
    application = (
        Application.builder()
        .token(token)
        .build()
    )
    
    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("create", create_custom_email))
    application.add_handler(CommandHandler("random", generate_random_email))
    application.add_handler(CommandHandler("email", show_current_email))
    application.add_handler(CommandHandler("inbox", check_inbox))
    application.add_handler(CommandHandler("codes", extract_all_codes))
    application.add_handler(CommandHandler("domains", show_domains))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Start background email monitoring (check every 15 seconds for faster detection)
    if application.job_queue:
        application.job_queue.run_repeating(check_new_emails, interval=15, first=5)
        print("🔔 Auto-notification: Checking emails every 15 seconds")
    else:
        print("⚠️ Job queue not available - auto-notification disabled")
    
    # Run bot
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
