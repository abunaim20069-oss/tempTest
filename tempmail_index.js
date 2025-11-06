///////////////
//
// (c) 1@ex.ua
//
// 0.03

(function() {
	'use strict';

	function getLocationLanguage() {
		var l = location.pathname.match(/^\/(en|zh|hi|de|uk|ru|es|pt|ar|fr|ja|bn)\/$/);
		return l ? l[1] : null;
	}

	function getCookieLanguage() {
		var b = document.cookie.match('(^|[^;]+)\\s*lang\\s*=\\s*([^;]+)');
		var l = b ? decodeURIComponent(b.pop()) : '';
		if (l == "en" || l == "zh" || l == "hi" || l == "de" || l == "uk" || l == "ru" || l == "es" || l == "pt" || l == "ar" || l == "fr" || l == "ja" || l == "bn") return l;
		return null;
	}

	function getBrowserLanguage() {
		if (navigator.language) {
			var l = navigator.language.split('-')[0];
			if (/^(ru|be|ky|kk|ba|tt|uz|sr|mk|bg)$/.test(l)) return "ru";
			if (/^(hi)$/.test(l)) return "hi";
			if (/^(de)$/.test(l)) return "de";
			if (/^(uk)$/.test(l)) return "uk";
			if (/^(zh)$/.test(l)) return "zh";
			if (/^(es)$/.test(l)) return "es";
			if (/^(pt)$/.test(l)) return "pt";
			if (/^(ar)$/.test(l)) return "ar";
			if (/^(fr)$/.test(l)) return "fr";
			if (/^(ja)$/.test(l)) return "ja";
			if (/^(bn)$/.test(l)) return "bn";
		}
		return "en";
	}

	var fex = {

		ui: {},
		tf: {},
		cl: [],
		rq: [],

		ver: '0.11',
		sizeList: ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PT', 'EB', 'ZB', 'YB'],
		textHtml: {
			'&'	: '&amp;',
			'<'	: '&lt;',
			'>'	: '&gt;',
			'\r'	: '',
			'\n'	: '<br>'
		},

		email: null,
		pre: '...',
		ready: false,
		mail: {},
		epin: '',
		needCaptcha: false,

		lang: getLocationLanguage() || getCookieLanguage() || getBrowserLanguage(),
		trMap: {},
		meta: null,
		metaDefault: {
			en: ['Disposable Temporary Email', 'Keep spam out of your mail and be safe - just use a disposable temporary email address! Protect your personal email address from spam with TempMail.Plus. You can use our TOR .onion address for complete anonymity.', 'free, temporary, temp, tmp, email, disposable, mail, email address, TOR, onion'],
			zh: ['一次性临时电子邮件', '将垃圾邮件拒之门外，确保安全-只需使用一次性的临时电子邮件地址即可！ 使用TempMail.Plus保护您的个人电子邮件地址免受垃圾邮件的侵害。 您可以使用我们的TOR .onion地址来完全匿名。', '免费，临时，临时，tmp，电子邮件，一次性，邮件，电子邮件地址，TOR，onion'],
			hi: ['डिस्पोजेबल अस्थायी ईमेल', 'अपने मेल के बाहर स्पैम रखें और सुरक्षित रहें - बस एक डिस्पोजेबल अस्थायी ईमेल पते का उपयोग करें! TempMail.Plus के साथ स्पैम से अपने व्यक्तिगत ईमेल पते को सुरक्षित रखें। पूर्ण गुमनामी के लिए आप हमारे TOR .onion पते का उपयोग कर सकते हैं।', 'मुक्त, अस्थायी, अस्थायी, tmp, ईमेल, डिस्पोजेबल, मेल, ईमेल पता, TOR, प्याज'],
			de: ['Temporäre Einweg-E-Mail', 'Stoppen Sie Spam in Ihrer E-Mail und seien Sie sicher - verwenden Sie einfach eine einmalige temporäre E-Mail-Adresse! Schützen Sie Ihre persönliche E-Mail-Adresse mit TempMail.Plus vor Spam. Sie können unsere TOR .onion-Adresse für vollständige Anonymität verwenden.', 'kostenlos, vorübergehend, temporär, tmp, E-Mail, Einweg, Post, E-Mail, E-Mail-Adresse, TOR, onion'],
			ru: ['Временная почта без регистрации', 'Временная одноразовая почта для защиты E-mail (электронной почты) от нежелательных писем и спама.', 'бесплатный, временный, email, одноразовая, временная, почта, электронный адрес, TOR, onion'],
			uk: ['Тимчасова пошта без реєстрації', 'Тимчасова одноразова пошта для захисту E-mail (електронної пошти) від небажаних листів та спаму.', 'безкоштовний, тимчасовий, email, одноразова, тимчасова, пошта, електронна адреса, TOR, onion'],
			es: ['Correo electrónico temporal de una sola vez', 'Detenga el correo no deseado en su correo y manténgase seguro: ¡solo use una dirección de correo electrónico temporal desechable! Proteja su dirección de correo electrónico personal del spam con TempMail.Plus. Puede utilizar nuestra dirección TOR .onion para mantener el anonimato completo.', 'gratis, temporal, temp, tmp, email, disposable, mail, email, dirección de correo electrónico, TOR, onion'],
			pt: ['Email Temporário Descartável', 'Mantenha o spam fora do seu e-mail e esteja seguro - basta usar um endereço de e-mail temporário descartável! Proteja seu endereço de e-mail pessoal de spam com TempMail.Plus. Você pode usar nosso endereço TOR .onion para obter o anonimato completo.', 'grátis, temporário, temp, tmp, e-mail, descartável, correio, endereço de e-mail, TOR, onion'],
			ar: ['بريد إلكتروني مؤقت يمكن التخلص منه', 'حافظ على البريد العشوائي بعيدًا عن بريدك وكن آمنًا - ما عليك سوى استخدام عنوان بريد إلكتروني مؤقت يمكن التخلص منه! قم بحماية عنوان بريدك الإلكتروني الشخصي من البريد العشوائي باستخدام TempMail.Plus. يمكنك استخدام عنوان TOR .onion الخاص بنا لإخفاء هويتك بالكامل.', 'مجاني ، مؤقت ، مؤقت ، tmp ، بريد إلكتروني ، يمكن التخلص منه ، بريد ، عنوان بريد إلكتروني ، TOR ، onion'],
			fr: ['E-mail Temporaire Jetable', 'Évitez les spams dans votre courrier et soyez en sécurité - utilisez simplement une adresse e-mail temporaire jetable! Protégez votre adresse e-mail personnelle contre le spam avec TempMail.Plus. Vous pouvez utiliser notre adresse TOR .onion pour un anonymat complet.', 'gratuit, temporaire, temporaire, tmp, e-mail, jetable, courrier, adresse e-mail, TOR, onion'],
			ja: ['使い捨て一時メール', 'スパムをメールから遠ざけて安全を確保してください - 使い捨ての一時的なメールアドレスを使用してください! TempMail.Plus を使用して、個人のメール アドレスをスパムから保護します。 完全な匿名性のために、TOR .onion アドレスを使用できます。', '無料、一時、一時、tmp、メール、使い捨て、メール、メールアドレス、TOR、onion'],
			bn: ['নিষ্পত্তিযোগ্য অস্থায়ী ইমেল', 'আপনার মেল থেকে স্প্যাম দূরে রাখুন এবং নিরাপদ থাকুন - শুধুমাত্র একটি নিষ্পত্তিযোগ্য অস্থায়ী ইমেল ঠিকানা ব্যবহার করুন! TempMail.Plus দিয়ে স্প্যাম থেকে আপনার ব্যক্তিগত ইমেল ঠিকানা রক্ষা করুন। সম্পূর্ণ বেনামীর জন্য আপনি আমাদের TOR .onion ঠিকানা ব্যবহার করতে পারেন।', 'মুক্ত, অস্থায়ী, টেম্প, tmp, ইমেল, নিষ্পত্তিযোগ্য, মেইল, ইমেল ঠিকানা, TOR, onion']
		},

		cleanup: function(fn) {
			fex.cl.push(fn);
		},

		json: function(method, url, data) {
			data.epin = (data.epin ? data.epin : fex.epin);
			if (fex.needCaptcha) { data.recaptcha = ecaptcha; fex.needCaptcha = false; }

			var req = $.ajax({url: url, method: method, dataType: 'json', data: data});
			fex.rq.push(req);

			req.done(function(j) {
				if (!j.result && j.err && (j.err.code == 1021 || j.err.code == 1022)) {
					showVerifyModal(j);
					isProtected = true;
				} else if (url != '/api/box/hidden') {
					isProtected = false;
				}
			});

			req.always(function() {
				var i = fex.rq.indexOf(req);
				if (i != -1) fex.rq.splice(i, 1);
			});
			return req;
		},

		ajax: function(settings) {
			var req = $.ajax(settings);

			fex.rq.push(req);

			req.always(function() {
				var i = fex.rq.indexOf(req);
				if (i != -1) fex.rq.splice(i, 1);
			});
			return req;
		},

		render: function(data) {
			fex.$body.html(data);
			fex.trInline();

			if (!fex.rendering) {
				fex.rendering = true;
				fex.endRender();
			}
		},

		beginRender: function() {
			fex.rendering = true;
		},

		endRender: function() {
			if (fex.rendering) {
				delete fex.rendering;

				if (fex.loading) {
					clearTimeout(fex.loading);
					fex.loading = null;
				}

				fex.$preloader.hide();
				fex.$body.show();
				fex.$main.height('auto');

				$('body').animate({
					scrollTop: 0
				});
			}
		},

		hash: function(uri) {
			history.pushState ? history.pushState(null, null, '#!' + uri) : location.hash = '#!' + uri;
			fex.parseParams(uri);
			fex.drawMenu();
		},

		go: function(uri) {
			history.pushState ? history.pushState(null, null, '#!' + uri) : location.hash = '#!' + uri;
			fex.open(uri);
		},

		_open: function(name) {
			if (name == "privacy") {
				name = fex.lang + '/' + name;
			}
			if (fex.ui[name]) {
				fex.render(fex.ui[name]);
			} else {
				$.get('/ui/' + name + '.html?' + Math.random()).done(function(data) {
					fex.ui[name] = data;
					fex.render(data);
				}).fail(function(r) {
					if (r.status && r.status == 404) {
						if (name != "404") {
							fex._open("404");
						} else {
							fex.render("404 - Not found!");
						}
					} else {
						fex.render("5xx - Failed to load template!");
					}
				});
			}
		},

		open: function(uri) {
			delete fex.rendering;

			var headers = ['privacy', 'contacts', 'email'];
			var header = null;

			headers.forEach(function(id) {
				var h = $('#' + id);
				h.hide();

				if (!header && uri == id) {
					header = h;
					return;
				}
			});
			header ? header.show() : $('#email').show();

			uri == 'contacts' ? $('#container-body').hide() : $('#container-body').show();
			uri == 'contacts' || uri.includes('privacy') ? $('#ads-del2').hide() : $('#ads-del2').show();
			uri == 'contacts' || uri.includes('privacy') ? $('#ads-del4').hide() : $('#ads-del4').show();
			uri == 'contacts' || uri.includes('privacy') ? $('#ads-del5').hide() : $('#ads-del5').show();
		
	
		
			uri != '' && !uri.includes('mail') ? $('#inbox-head').hide() : $('#inbox-head').show();
			uri != '' && !uri.includes('mail') ? $('#email').addClass('fix') : $('#email').removeClass('fix');

			/*
			fex.$main.height(fex.$main.height());
			fex.$body.hide();
			fex.$body.html('');
			fex.setTitle(null);
			*/

			if (fex.loading) clearTimeout(fex.loading);

			fex.loading = setTimeout(function() {
				fex.loading = null;
				fex.$preloader.show();
			}, 1000);

			for (var i = 0; i < fex.cl.length; i++) {
				fex.cl[i]();
			}
			fex.cl = [];

			for (var i = 0; i < fex.rq.length; i++) {
				fex.rq[i].abort();
			}
			fex.rq = [];
			fex.meta = null;

			fex.parseParams(uri);
			fex.drawMenu();
			fex._open(fex.params[0] || 'index');
			$('link[rel=alternate]').each(function() {
				var node = this;
				node.href = 'https://tempmail.plus/' + node.hreflang.toLowerCase() + '/' + location.hash;
			});
			$('link[rel=canonical]').each(function() {
				var node = this;
				node.href = 'https://tempmail.plus/' + fex.lang + '/' + location.hash;
			});
			var m = document.querySelector('meta[property="og:url"]');
			if (m) {
				m.setAttribute("content", 'https://tempmail.plus/' + fex.lang + '/' + location.hash);
			}
			fex.counterHit();
		},

		parseParams: function(uri) {
			var p = String(uri).split('/');

			if (p[0].match(/^\d+$/)) {
				p.unshift('');
			}
			fex.params = p;
		},

		init: function() {
			$.ajaxSetup({
				cached: false
			});

			if (!fex.email) {
				fex.readEmail();
			}

			$(window).on('hashchange', fex.hashChange);
	
			var index = location.href.indexOf('?');

			if (index != -1 && location.host.toLowerCase() != "webcache.googleusercontent.com") {
				var href = location.href.substring(0, index);
				if (history.replaceState) {
					history.replaceState(null, null, href);
				} else {
					location.replace(href);
					if (href.indexOf('#') != -1) {
						location.reload();
					}
				}
			}

			fex.$main = $('.main');
			fex.$menu = $('.menu');
			fex.$login = $('.login');
			fex.$body = $('.body');
			fex.$preloader = $('.preloader');

			fex.hashChange();
			fex.initPre();
		},

		hashChange: function() {
			var index = location.hash.indexOf('?');

			if (index != -1) {
				var hash = location.hash.substring(0, index);
				location.hash = hash;
			}

			var action = location.hash.replace(/^#\!?/, '');
			fex.open(action);

			if (location.hash == '') history.replaceState ? history.replaceState(null, null, '#!') : location.hash = '#!';
		},

		paramCount: function() {
			return fex.params.length;
		},

		paramInt: function(pos) {
			return (fex.params.length > pos && fex.params[pos] && parseInt(fex.params[pos])) ? parseInt(fex.params[pos]) : 0;
		},

		paramStr: function(pos) {
			return (fex.params.length > pos && fex.params[pos] ? fex.params[pos] : null);
		},

		goBack: function() {
			history.back();
		},

		setTitle: function (title) {
			document.title = (title ? title + ' - ' : '') + 'TempMail.Plus';
			var m = document.querySelector('meta[property="og:title"]');
			if (m) {
				m.setAttribute("content", (title ? title + ' - ' : '') + 'TempMail.Plus');
			}
		},

		setDescription: function(description) {
			document.querySelector('meta[name="description"]').setAttribute("content", description);
			var m = document.querySelector('meta[property="og:description"]');
			if (m) {
				m.setAttribute("content", description);
			}
		},

		setKeywords: function(keywords) {
			document.querySelector('meta[name="keywords"]').setAttribute("content", keywords);
		},

		setMeta: function(meta) {
			fex.meta = meta;
			fex.updateMeta(true);
		},

		updateMeta: function(justMeta) {
			var m = (fex.meta ? fex.meta[fex.lang] : null) || fex.metaDefault[fex.lang];
			if (m) {
				fex.setTitle(m[0] || '');
				fex.setDescription(m[1] || '');
				fex.setKeywords(m[2] || '');
			}
			if (!justMeta && fex.params[0] == "privacy") {
				fex.open(fex.params[0]);
			}
		},
	
		template: function(name) {
			var id = (fex.params ? fex.params[0] + '-' : '') + name;

			if (!fex.tf[id]) fex.tf[id] = doT.template($('#' + name).text());
			return fex.tf[id];
		},
	
		drawMenu: function() {

		},

		goHome: function() {
			fex.go(fex.user ? 'home' : '');
		},

		checkAuth: function() {
			if (!fex.user) {
				fex.goHome();
				return false;
			}
			return true;
		},

		checkAuthPriv: function(priv) {
			if (!fex.user || (fex.user.priv & priv) != priv) {
				fex.goHome();
				return false;
			}
			return true;
		},

		checkPriv: function(priv) {
			return (fex.user && (fex.user.priv & priv) == priv);
		},

		showMsg: function(msg) {
			var $msg = $('#msg');

			if ($msg.length) {
				msg ? $msg.text(msg) : $msg.text('');
				$msg.toggle(!!msg);
			}
		},

		updateEmail: function(reload) {
			fex.email = fex.pre + fex.getDomain();
			fex.setCookie('email', fex.email, 3650);
			
			$('#pre_settings').prop('disabled', fex.pre.length < 5);

			try {
				canSound = true;
			} catch(e) { }

			if (reload) {
				fex.epin = '';
				fex.go('');
			}
		},

		initPre: function() {
			var $preButton = $('#pre_button');

			$('#pre_settings').prop('disabled', fex.pre.length < 5);

			$('#pre_form').submit(function() {
				var pre = $preButton.val();

				if (pre != fex.pre && pre.length <= 200 && pre.match("^[A-Za-z0-9]+([.\\-_][A-Za-z0-9]+)*$")) {
					fex.pre = pre;
					fex.updateEmail(true);
				} else if (pre.length < 1) {
					showAlert('name_empty', null, null, true);
				} else if (pre.length > 200) {
					showAlert('name_longer_200_characters', null, null, true);
				} else if (!pre.match("^[A-Za-z0-9]+([.\\-_][A-Za-z0-9]+)*$")) {
					showAlert('name_invalid', null, null, true);
				}

				$preButton.val(fex.pre);
				return false;
			});

			$('#pre_rand').click(function() {
				fex.pre = fex.getRandomPre();

				$preButton.val(fex.pre);
				fex.updateEmail(true);
			});

			$('#pre_copy').click(function() {
				fex.copyEmail();

				$('#pre_copy').text(fex.tr('copied') || 'Copied');

				setTimeout(function() {
					$('#pre_copy').text(fex.tr('copy') || 'Copy');
				}, 1000);
			});
		},

		setDomain: function(domain) {
			document.getElementById('domain').innerHTML = '@' + domain;
		},

		getDomain: function() {
			return document.getElementById('domain').innerHTML;
		},

		readEmail: function() {
			var email = fex.getCookie('email');
			var index = location.href.indexOf('?');
			if (index != -1) {
				var e = location.href.substring(index + 1);
				if (e.indexOf('@') > 0) {
					fex.setCookie('email', e, 3650);
					email = e;
				}
			}
			var r = email.split('@');
			if (r.length == 2) {
				fex.pre = r[0];
				fex.email = email;
				fex.setDomain(r[1]);

				if (fex.getDomain() != '@' + r[1]) {
					fex.pre = fex.getRandomPre();
					fex.updateEmail(false);
				}
			} else {
				fex.pre = fex.getRandomPre();
				fex.updateEmail(false);
			}
			document.getElementById("pre_button").value = fex.pre;
		},

		getCookie: function(a) {
			var b = document.cookie.match('(^|[^;]+)\\s*' + a + '\\s*=\\s*([^;]+)');
			return b ? decodeURIComponent(b.pop()) : '';
		},

		setCookie: function(name, value, days) {
			var d = new Date();
			d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
			var expires = "expires=" + d.toUTCString();
			document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
		},

		getRandomPre: function() {
			var l = 5 + Math.floor(Math.random() * 3);
			var w = '';
			var s = ['aeouy', 'bcdfghkmnpqstvwxz'];
			var t = Math.floor(Math.random() * 2);
			var x = t ? 5 : 7;

			for (var i = 0; i < l; i++) {
				w += s[t].charAt(Math.floor(Math.random() * s[t].length));

				if (Math.floor(Math.random() * x) > 1) {
					t = 1 - t;
					x = t ? 5 : 10;
				} else {
					x += 4;
				}
			}
			return w;
		},

		copyEmail: function() {
			var input = document.createElement("input");

			input.value = fex.email;
			input.type = 'text';
			input.id = 'clipboard';

			document.body.prepend(input);

			input.focus();
			input.select();

			try {
				document.execCommand('copy');
			} catch(e) { }

			document.body.removeChild(input);
		},

		getHtml: function(html, mailID) {
			var $html = $('<div>').html(html);

			$html.find('script,style,noscript,base,link,embed,noembed,object,applet,param').remove();
			$html.find('*').each(function() {
				var node = this;

				try {
					for (var i = 0; i < node.attributes.length; ) {
						var attr = node.attributes[i];
						var name = attr.name.toLowerCase();

						if (name.substring(0, 2) === "on" || name === 'id' || name === 'class') {
							node.removeAttribute(attr.name);
						} else {
							i++;
						}
					}
					var url = node.style.backgroundImage;
					if (url) {
						var newUrl = url.replace(/((?:^|,\s*)url\(["']?)http:\/\//ig, "$1/s/");
						if (newUrl != url) {
							node.style.backgroundImage = newUrl;
						}
					}
				} catch(e) {
					console.log(e.message);
				}

				if (node.src) {
					if (/^cid:/i.test(node.src)) {
						node.src = "/api/mails/" + mailID + "/attachments/0?email=" + encodeURIComponent(fex.email) + "&epin=" + encodeURIComponent(fex.epin) + "&content_id=" + encodeURIComponent(node.src.substring(4));
					} else if (/^http:\/\//i.test(node.src)) {
						node.src = "/s/" + node.src.substring(7);
					}
				} else if (node.nodeName === 'A') {
					if (node.href && /^((http|https|ftp):\/\/)/i.test(node.href)) {
						node.setAttribute('target', '_blank');
					}
				}
			});
			return $html.html();
		},

		getHtmlFromText: function(text) {
			return text.replace(/[&<>\r\n]/g, function(c) {
				return fex.textHtml[c];
			});
		},

		formatSize: function(bytes) {
			if (bytes < 2) return bytes + ' Byte';
			var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
			return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + fex.sizeList[i];
		},

		loadScript: function(url, callback) {
			var script = document.createElement("script");

			if (script.readyState) {
				script.onreadystatechange = function() {
					if (script.readyState == "loaded" || script.readyState == "complete") {
						script.onreadystatechange = null;
						callback(script);
					}
				};
			} else {
				script.onload = function() {
					callback(script);
				};
			}

			script.src = url;
			document.head.appendChild(script);
		},

		preload: function() {
			var srcList = ['/lib/core.min.js', '/lib/main.js', '/lib/compose.js'];
			var srcCount = srcList.length;

			for (var i = 0; i < srcList.length; i++) {
				fex.loadScript(srcList[i] + '?' + fex.ver, function() {
					srcCount--;

					if (!srcCount) {
						if (fex.ready) fex.init();
						fex.ready = true;
					}
				});
			}
		},

		counterHit: function() {
			if (!document.cookie) document.cookie = "b=b";

			fex.loadScript(
				'https://c.hit.ua/hit?i=110' +
				'&g=0&x=3&s=1' +
				'&t=' + (new Date()).getTimezoneOffset() +
				(document.cookie ? '&c=1' : '') +
				(self != top ? '&f=1' : '') +
				(navigator.javaEnabled() ? '&j=1' : '') +
				(typeof(screen) != 'undefined' ? '&w=' + screen.width + '&h=' + screen.height + '&d=' + (screen.colorDepth ? screen.colorDepth : screen.pixelDepth) : '') +
				'&r=' + escape(document.referrer) +
				'&u=' + escape(window.location.href) +
				'&' + Math.random(), function(script) {
					script.remove();
				}
			);
		},

		tr: function(key) {
			return fex.trMap[fex.lang] ? fex.trMap[fex.lang][key] : null;
		},

		trList: function($list) {
			$list.each(function() {
				var $e = $(this);
				var tr = $e.attr('data-tr');
				if (tr && tr != "") {
					tr = tr.split(':');
					var t = "";
					if (tr[0] == "date") {
						t = getModifiedDate($e.attr('data-date'));
					} else {
						t = fex.tr(tr[0]);
					}
					var pse = tr.length > 1 ? tr[1] : "";
					if (t != null) {
						if (pse != "") {
							$e.attr(pse, t);
						} else if ($e.prop('tagName') == "INPUT") {
							$e.val(t);
						} else {
							$e.text(t);
						}
					}
				}
			});
		},

		trBody: function() {
			$('html').attr('lang', fex.lang);
			$('html').attr('dir', fex.lang == "ar" ? "rtl" : "ltr");
			fex.trList($('[data-tr!=""]'));
		},

		trInline: function() {
			fex.trList(fex.$body.find('[data-tr!=""]'));
		},

		trHtml: function(html) {
			var $html = $('<div>').html(html);
			fex.trList($html.find('[data-tr!=""]'));
			return $html.html();
		}
	};

	window.fex = fex;

	fex.trMap = {
	en: {
		privacy: 'Privacy policy',
		privacy_short: 'Privacy',
		contacts: 'Contact us',
		your_tempmail_address_is_ready: 'Your tempmail address is ready',
		copy: 'Copy',
		copied: 'Copied',
		settings: 'Settings',
		new_random_name: 'New random name',
		new_random_name_comment: 'One-time mail from TempMail.Plus will save you from spam and promotional email newsletters. Disposable mail service for anonymous use is provided free of charge.',
		inbox: 'Inbox',
		compose: 'Compose',
		waiting_for_emails: 'Waiting for mails...',
		yes: 'Yes',
		no: 'No',
		tor_mirror: 'Our TOR mirror is',
		page_not_found: 'Page not found!',
		enter: 'Enter',
		pin_code: 'PIN-code',
		secret_address: 'Secret address',
		save: 'Save',
		set_pincode: 'Set PIN-code',
		choose_lifetime: 'Choose mailbox lifetime',
		min: 'min',
		day: 'days',
		address_copied: 'Address copied',

		// index
		sender: 'Sender',
		subject: 'Subject',
		time: 'Time',
		destroy_inbox: 'Destroy inbox',
		destroy_inbox_confirm: 'Do you really want to destroy inbox?',
		box_protected: 'Inbox is protected by a PIN-code',
		enter_pincode: 'Enter PIN-code.',
		wrong_pincode: 'Wrong PIN-code.',
		confirm_robot: 'Please confirm that you are not a robot.',

		// index-how
		how_it_works: 'How Our Temporary Mail Works',
		how_it_works_text: 'TempMail.Plus is a disposable mailbox that stores emails for a short time. Our service works as a temporary mail (or “10-minutes mail”). It generates an email address and stores your incoming mail for 10 minutes or more (you can change the exact mail lifetime in Settings).',
		with_anonymous_mail: 'TempMail.Plus service safeguards privacy when you access a variety of services online. With our anonymous mail, you can:',
		wam_1: 'Register on Wi-Fi points and third-party sites,',
		wam_2: 'Protect your email from unwanted letters and spam,',
		wam_3: 'Chat with strangers and remain anonymous,',
		wam_5: 'Sign up to games or social media.',
		service_is_free: 'You can protect your temporary mail by setting a PIN-code or using the generated secret address. These features are accessible in the settings.',
		enjoy_mail: 'Enjoy your one-time mail!',

		// mail
		back: 'Back',
		delete: 'Delete',
		delete_confirm: 'Do you really want to delete mail?',
		no_subject: '(No subject)',
		no_text: '(Empty)',

		// compose
		new_message: 'New message',
		to: 'To',
		local_recipients_only: '(local recipients only)',
		text: 'Text',
		attach_files: 'Attach files',
		send: 'Send',

		// contacts
		contact_us: 'Contact us',
		contact_us_comment: 'If you have questions, suggestions, or anything else feel free to contact us.',
		name: 'Name',
		email: 'Email',
		message: 'Message',

		// privacy
		privacy_policy: 'Privacy policy',

		//validator
		required_field: 'This field is required.',
		not_valid_email_address: 'Please enter a valid email address.',

		// messages
		error_sending_data: 'Error sending data.',
		message_successfully_sent: 'Message successfully sent.',
		error_loading_data: 'Error loading data.',
		failed_delete_all_mails: 'Failed to delete all mails.',
		failed_delete_mail: 'Failed to delete mail.',
		unable_send_message: 'Unable to send the message. Try again.',
		attachments_too_large: 'Attachments is too large. Limit is 50 MBytes.',
		name_empty: 'The name must not be empty.',
		name_longer_200_characters: 'Name cannot be longer than 200 characters.',
		name_invalid: 'Name can only contain alphanumeric characters and symbols ".-_".',
		tip_lifetime: 'Messages are automatically deleted after the specified time.',
		tip_pin: 'Configuration settings and all messages will be deleted after 7 days of inactivity of the account with the PIN-code set.',
		tip_secret: 'Secret address allows you to conceal your main address from other sites. All emails will appear in your main mailbox, but no one will ever know your real address.'
	},
	ru: {
		privacy: 'Политика конфиденциальности',
		privacy_short: 'Конфиденциальность',
		contacts: 'Контакты',
		your_tempmail_address_is_ready: 'Ваш новый временный адрес',
		copy: 'Копировать',
		copied: 'Скопировано',
		settings: 'Настройки',
		new_random_name: 'Случайное имя',
		new_random_name_comment: 'Одноразовая почта от TempMail.Plus избавит Вас от спама и рекламных рассылок. Сервис временной почты анонимный и предоставляется бесплатно.',
		inbox: 'Входящие',
		compose: 'Написать',
		waiting_for_emails: 'В ожидании новых писем...',
		yes: 'Да',
		no: 'Нет',
		tor_mirror: 'Наше TOR зеркало',
		page_not_found: 'Страница не найдена!',
		enter: 'Войти',
		pin_code: 'ПИН-код',
		secret_address: 'Секретный адрес',
		save: 'Сохранить',
		set_pincode: 'Установить ПИН-код',
		choose_lifetime: 'Выберите срок жизни почтового ящика',
		min: 'мин',
		day: 'дн',
		address_copied: 'Адрес скопирован',

		// index
		sender: 'Отправитель',
		subject: 'Тема',
		time: 'Время',
		destroy_inbox: 'Удалить все',
		destroy_inbox_confirm: 'Удалить все входящие сообщения?',
		box_protected: 'Данный ящик защищен ПИН-кодом',
		enter_pincode: 'Введите ПИН-код.',
		wrong_pincode: 'Неверный ПИН-код.',
		confirm_robot: 'Пожалуйста, подтвердите, что вы не робот.',

		// index-how
		how_it_works: 'Как работает наша временная почта',
		how_it_works_text: 'TempMail.Plus — это одноразовый почтовый ящик, который хранит письма на короткий срок. Сервис работает по принципу временной почты (или почты на 10 минут). Мы создаем почтовый ящик, который принимает и сохраняет Ваши входящие письма на 10 минут и более (точное время хранения можно поменять в Настройках).',
		with_anonymous_mail: 'TempMail.Plus обеспечивает Вашу анонимность на различных онлайн-сервисах. С нашей анонимной почтой, Вы можете:',
		wam_1: 'Безопасно регистрироваться на Wi-Fi точках и сторонних сайтах,',
		wam_2: 'Очистить email от нежелательных писем и спама,',
		wam_3: 'Вести переписки с незнакомыми людьми, оставаясь анонимным,',
		wam_5: 'Регистрироваться в играх и социальных сетях.',
		service_is_free: 'Вы можете защитить свою временную почту, установив на нее PIN-код и используя созданный тайный адрес. Эти функции доступны в настройках.',
		enjoy_mail: 'Пользуйтесь одноразовой почтой TempMail.Plus в удовольствие!',

		// mail
		back: 'Назад',
		delete: 'Удалить',
		delete_confirm: 'Удалить сообщение?',
		no_subject: '(Нет темы)',
		no_text: '(Пусто)',

		// compose
		new_message: 'Новое сообщение',
		to: 'Кому',
		local_recipients_only: '(только локальные получатели)',
		text: 'Текст',
		attach_files: 'Приложить файлы',
		send: 'Отправить',

		// contacts
		contact_us: 'Напишите нам',
		contact_us_comment: 'Есть вопросы, предложения или что-то еще - пишите нам.',
		name: 'Имя',
		email: 'Адрес вашей электронной почты',
		message: 'Сообщение',

		// privacy
		privacy_policy: 'Политика конфиденциальности',

		//validator
		required_field: 'Обязательное поле.',
		not_valid_email_address: 'Неверный адрес электронной почты.',

		// messages
		error_sending_data: 'Ошибка отправки данных.',
		message_successfully_sent: 'Сообщение отправлено.',
		error_loading_data: 'Ошибка загрузки данных.',
		failed_delete_all_mails: 'Ошибка удаления писем.',
		failed_delete_mail: 'Ошибка удаления.',
		unable_send_message: 'Ошибка отправки сообщения. Повторите.',
		attachments_too_large: 'Приложенные файлы слишком большие. Лимит 50 МБайт.',
		name_empty: 'Имя не должно быть пустым.',
		name_longer_200_characters: 'Имя не должно быть длиннее 200 символов.',
		name_invalid: 'Имя может содержать только буквенно-цифровые символы и символы ".-_".',
		tip_lifetime: 'Сообщения автоматически удаляются спустя указанное время.',
		tip_pin: 'Конфигурационные настройки и все сообщения будут удалены через 7 дней бездействия учетной записи с установленным ПИН-кодом.',
		tip_secret: 'Секретный адрес позволяет скрыть ваш основной адрес от других сайтов. Все электронные письма будут появляться в вашем основном почтовом ящике, но никто никогда не узнает ваш реальный адрес.'
	},
	uk: {
		privacy: 'Політика конфіденційності',
		privacy_short: 'Конфіденційність',
		contacts: 'Контакти',
		your_tempmail_address_is_ready: 'Ваша нова тимчасова адреса',
		copy: 'Копіювати',
		copied: 'Скопійовано',
		settings: 'Налаштування',
		new_random_name: 'Випадкове ім\'я',
		new_random_name_comment: 'Одноразова пошта від TempMail.Plus позбавить Вас від спаму та рекламних розсилок. Сервіс тимчасової пошти анонімний та надається безкоштовно.',
		inbox: 'Вхідні',
		compose: 'Написати',
		waiting_for_emails: 'В очікуванні нових листів...',
		yes: 'Так',
		no: 'Ні',
		tor_mirror: 'Наше TOR дзеркало',
		page_not_found: 'Сторінку не знайдено!',
		enter: 'Увійти',
		pin_code: 'ПІН-код',
		secret_address: 'Секретна адреса',
		save: 'Зберегти',
		set_pincode: 'Встановити ПІН-код',
		choose_lifetime: 'Виберіть термін життя поштової скриньки',
		min: 'мін',
		day: 'дн',
		address_copied: 'Адреса скопійована',

		// index
		sender: 'Відправник',
		subject: 'Тема',
		time: 'Час',
		destroy_inbox: 'Видалити все',
		destroy_inbox_confirm: 'Видалити всі вхідні повідомлення?',
		box_protected: 'Ця скринька захищена ПІН-кодом',
		enter_pincode: 'Введіть ПІН-код.',
		wrong_pincode: 'Неправильний ПІН-код.',
		confirm_robot: 'Будь ласка, підтвердіть, що ви не робот.',

		// index-how
		how_it_works: 'Як працює наша тимчасова пошта',
		how_it_works_text: 'TempMail.Plus — це одноразова поштова скринька, яка зберігає листи на короткий термін. Сервіс працює за принципом тимчасової пошти (або на 10 хвилин). Ми створюємо поштову скриньку, яка приймає та зберігає Ваші вхідні листи на 10 хвилин і більше (точний час зберігання можна змінити в Налаштуваннях).',
		with_anonymous_mail: 'TempMail.Plus забезпечує Вашу анонімність на різних онлайн-сервісах. З нашою анонімною поштою, Ви можете:',
		wam_1: 'Безпечно реєструватися на Wi-Fi точках та сторонніх сайтах,',
		wam_2: 'Очистити email від небажаних листів та спаму,',
		wam_3: 'Вести листування з незнайомими людьми, залишаючись анонімним,',
		wam_5: 'Реєструватися в іграх та соціальних мережах.',
		service_is_free: 'Ви можете захистити свою тимчасову пошту, встановивши на неї PIN-код та використовуючи створену таємну адресу. Ці функції доступні у налаштуваннях.',
		enjoy_mail: 'Користуйтесь одноразовою поштою TempMail.Plus для задоволення!',

		// mail
		back: 'Назад',
		delete: 'Видалити',
		delete_confirm: 'Видалити повідомлення?',
		no_subject: '(Немає теми)',
		no_text: '(Пусто)',

		// compose
		new_message: 'Нове повідомлення',
		to: 'Кому',
		local_recipients_only: '(тільки локальні одержувачі)',
		text: 'Текст',
		attach_files: 'Додати файли',
		send: 'Надіслати',

		// contacts
		contact_us: 'Напишіть нам',
		contact_us_comment: 'Є питання, пропозиції або ще щось - пишіть нам.',
		name: 'Ім\'я',
		email: 'Адреса вашої електронної пошти',
		message: 'Повідомлення',

		// privacy
		privacy_policy: 'Політика конфіденційності',

		//validator
		required_field: 'Обов\'язкове поле.',
		not_valid_email_address: 'Неправильна адреса електронної пошти.',

		// messages
		error_sending_data: 'Помилка надсилання даних.',
		message_successfully_sent: 'Повідомлення надіслано.',
		error_loading_data: 'Помилка завантаження даних.',
		failed_delete_all_mails: 'Помилка видалення листів.',
		failed_delete_mail: 'Помилка видалення.',
		unable_send_message: 'Помилка надсилання повідомлення. Повторіть.',
		attachments_too_large: 'Додаткові файли занадто великі. Ліміт 50 МБайт.',
		name_empty: 'Ім\'я не повинно бути порожнім.',
		name_longer_200_characters: 'Ім\'я не повинно бути довшим за 200 символів.',
		name_invalid: 'Ім\'я може містити лише буквено-цифрові символи та символи ".-_".',
		tip_lifetime: 'Повідомлення автоматично видаляються через вказаний час.',
		tip_pin: 'Конфігураційні установки та всі повідомлення будуть видалені через 7 днів бездіяльності облікового запису з встановленим ПІН-кодом.',
		tip_secret: 'Секретна адреса дозволяє приховати вашу основну адресу від інших сайтів. Всі електронні листи будуть з\'являтися у вашій головній поштовій скриньці, але ніхто ніколи не дізнається вашу реальну адресу.'
	},
	zh: {
		privacy: '隐私政策',
		privacy_short: '隐私政策',
		contacts: '联系我们',
		your_tempmail_address_is_ready: '您的临时邮箱地址已准备就绪',
		copy: '复制',
		copied: '已复制',
		settings: '设置',
		new_random_name: '随机生成新的名称',
		new_random_name_comment: 'TempMail.Plus 提供您随用即丢的临时邮箱，让您免于接收垃圾邮件和广告性质的商业信息。此一次性的匿名邮箱服务是免费的。',
		inbox: '收件夹',
		compose: '撰写邮件',
		waiting_for_emails: '正在等候电子邮件…',
		yes: '是',
		no: '没有',
		tor_mirror: '我们的 TOR 镜像为',
		page_not_found: '网页未找到！',
		enter: '输入',
		pin_code: 'PIN码',
		secret_address: '私密地址',
		save: '保存',
		set_pincode: '设置 PIN 码',
		choose_lifetime: '选择邮箱的时效',
		min: '分钟',
		day: '天',
		address_copied: '地址已复制',

		// index
		sender: '发件人',
		subject: '邮件标题',
		time: '时间',
		destroy_inbox: '销毁收件箱',
		destroy_inbox_confirm: '您真的要销毁收件箱吗？',
		box_protected: '收件箱受PIN碼保護',
		enter_pincode: '输入PIN码。',
		wrong_pincode: 'PIN码错误。',
		confirm_robot: '请确认您不是机器人。',

		// index-how
		how_it_works: '我们的临时邮箱是如何运作的',
		how_it_works_text: 'TempMail.Plus 是一次性的电子邮箱，可供短时间内保留电子邮件。本服务会为您提供临时的邮箱（或称“10 分钟邮箱”）。系统会生成电子邮件地址，并且在收到您的邮件后保留 10 分钟或更久的时间，您可以在“设置”中变更确切的邮箱时效。',
		with_anonymous_mail: '当您在线访问各种服务时，TempMail.Plus 的服务可以帮助保护您的隐私。利用我们的匿名邮箱，您可以：',
		wam_1: '在 Wi-Fi 热点和第三方网站上注册；',
		wam_2: '保护您的电子邮箱免受不必要的信件和垃圾邮件的干扰；',
		wam_3: '和陌生人交谈，同时保持匿名；',
		wam_5: ' 匿名注册游戏或社交媒体。',
		service_is_free: '您可以通过设置 PIN 码或使用系统生成的秘密地址来保护您的临时邮箱，这些功能都在“设置”之中。',
		enjoy_mail: '马上享受您的一次性邮箱！',

		// mail
		back: '背部',
		delete: '删除',
		delete_confirm: '您真的要删除邮件吗？',
		no_subject: '（无主题）',
		no_text: '（空）',

		// compose
		new_message: '新邮件',
		to: '至',
		local_recipients_only: '发送到（限本地收件人）',
		text: '内容',
		attach_files: '附加档案',
		send: '发送',

		// contacts
		contact_us: '联系我们',
		contact_us_comment: '如果您有任何疑问，建议或其他，请随时与我们联系。',
		name: '名称',
		email: '电邮',
		message: '信息',

		// privacy
		privacy_policy: '隐私政策',

		//validator
		required_field: '这是必填栏。',
		not_valid_email_address: '请输入有效的电子邮件地址。',

		// messages
		error_sending_data: '发送数据时出错。',
		message_successfully_sent: '消息发送成功。',
		error_loading_data: '加载数据时出错。',
		failed_delete_all_mails: '删除所有邮件失败。',
		failed_delete_mail: '删除邮件失败。',
		unable_send_message: '无法发送消息。 再试一次。',
		attachments_too_large: '附件太大。 限制为50 MB。',
		name_empty: '名称不能为空。',
		name_longer_200_characters: '名称不能超过200个字符。.',
		name_invalid: '名称只能包含字母数字字符和符号“ .-_”。',
		tip_lifetime: '在您指定的时效过后，所有邮件将被自动删除。',
		tip_pin: '在设置 PIN 码后，如果帐号在连续 7 天处于无活动状态，所有配置和电邮都将被删除。',
		tip_secret: '秘密地址可让您免于将个人主要邮箱透露给其他网站。所有电子邮件都会出现在您的主要邮箱，但不会有人知道您的真实邮箱地址。'
	},
	hi: {
		privacy: 'गोपनीयता नीति',
		privacy_short: 'एकांत',
		contacts: 'संपर्क करें',
		your_tempmail_address_is_ready: 'आपका नया पता',
		copy: 'नक़ल',
		copied: 'कॉपी किया गया',
		settings: 'अनुकूलन',
		new_random_name: 'यादृच्छिक नाम',
		new_random_name_comment: 'एक समय से मेल TempMail.इसके अलावा आप स्पैम और विज्ञापन डाक से बचाना होगा. अस्थायी मेल सेवा अनाम और नि: शुल्क है ।',
		inbox: 'इनबॉक्स',
		compose: 'लिखने के लिए',
		waiting_for_emails: 'नए ईमेल के लिए प्रतीक्षा कर रहा है ...',
		yes: 'हाँ',
		no: 'नहीं',
		tor_mirror: 'हमारा TOR दर्पण है',
		page_not_found: 'पृष्ठ नहीं मिला!',
		enter: 'दर्ज',
		pin_code: 'पिन कोड',
		secret_address: 'गुप्त पता',
		save: 'सहेजें',
		set_pincode: 'पिन-कोड सेट करें',
		choose_lifetime: 'मेलबॉक्स जीवनकाल चुनें',
		min: 'मिनट',
		day: 'दिन',
		address_copied: 'पता कॉपी किया गया',

		// index
		sender: 'प्रेषक',
		subject: 'विषय',
		time: 'समय',
		destroy_inbox: 'इनबॉक्स को नष्ट करें',
		destroy_inbox_confirm: 'क्या आप वास्तव में इनबॉक्स को नष्ट करना चाहते हैं?',
		box_protected: 'इनबॉक्स पिन-कोड द्वारा सुरक्षित है',
		enter_pincode: 'पिन-कोड डालें।',
		wrong_pincode: 'गलत पिन-कोड।',
		confirm_robot: 'कृपया पुष्टि करें कि आप रोबोट नहीं हैं।',

		// index-how
		how_it_works: 'हमारे अस्थायी मेल कैसे काम करता है',
		how_it_works_text: 'TempMail.प्लस एक बार मेलबॉक्स कि समय की एक छोटी अवधि के लिए ईमेल संग्रहीत करता है ।  सेवा अस्थायी मेल (या 10 मिनट के लिए मेल) के सिद्धांत पर चल रही है. हम स्वीकार करता है और 10 मिनट या उससे अधिक के लिए अपनी आने वाली ईमेल बचाता है कि एक मेलबॉक्स बनाने (आप सेटिंग में सटीक भंडारण समय बदल सकते हैं) ।',
		with_anonymous_mail: 'TempMail.इसके अलावा विभिन्न ऑनलाइन सेवाओं पर अपने नाम न छापने सुनिश्चित करता है ।  हमारे गुमनाम मेल के साथ, आप कर सकते हैं:',
		wam_1: 'वाई-फाई अंक और तीसरे पक्ष साइटों पर सुरक्षित रूप से रजिस्टर,',
		wam_2: 'अवांछित ईमेल और स्पैम से ईमेल साफ़ करें,',
		wam_3: 'गुमनाम जबकि शेष अजनबियों के साथ संवाद,',
		wam_5: 'गुमनाम खेल और सामाजिक नेटवर्क में रजिस्टर।',
		service_is_free: 'आप उस पर एक पिन कोड की स्थापना और आपके द्वारा बनाए गए गुप्त पते का उपयोग करके अपने अस्थायी ईमेल की रक्षा कर सकते हैं. इन कार्यों सेटिंग्स में उपलब्ध हैं.',
		enjoy_mail: 'एक बार अस्थायी मेल का प्रयोग करें.इसके अलावा मनोरंजन के लिए!',

		// mail
		back: 'वापस',
		delete: 'हटाएं',
		delete_confirm: 'क्या आप वास्तव में मेल हटाना चाहते हैं?',
		no_subject: '(कोई विषय नहीं)',
		no_text: '(खाली)',

		// compose
		new_message: 'नया संदेश',
		to: 'लिए',
		local_recipients_only: '(केवल स्थानीय प्राप्तकर्ता)',
		text: 'टेक्स्ट',
		attach_files: 'फ़ाइल संलग्न करें',
		send: 'संदेश',

		// contacts
		contact_us: 'संपर्क करें',
		contact_us_comment: 'यदि आपके पास प्रश्न, सुझाव, या कुछ भी है तो हमसे संपर्क करने में संकोच न करें।',
		name: 'नाम',
		email: 'ईमेल',
		message: 'संदेश',

		// privacy
		privacy_policy: 'गोपनीयता नीति',

		//validator
		required_field: 'यह फ़ील्ड आवश्यक है।',
		not_valid_email_address: 'कृपया एक वैध ई - मेल एड्रेस डालें।',

		// messages
		error_sending_data: 'डेटा भेजने में त्रुटि।',
		message_successfully_sent: 'संदेश सफलतापूर्वक भेज दिया गया है।',
		error_loading_data: 'डेटा लोड करने में त्रुटि।',
		failed_delete_all_mails: 'सभी मेल हटाने में विफल।',
		failed_delete_mail: 'मेल हटाने में विफल।',
		unable_send_message: 'संदेश भेजने में असमर्थ। पुनः प्रयास करें।',
		attachments_too_large: 'अनुलग्नक बहुत बड़ा है। सीमा 50 एमबीटी है।',
		name_empty: 'नाम खाली नहीं होना चाहिए।',
		name_longer_200_characters: 'नाम 200 वर्णों से अधिक लंबा नहीं हो सकता।',
		name_invalid: 'नाम में केवल अल्फ़ान्यूमेरिक वर्ण और चिन्ह "।-_" हो सकते हैं।',
		tip_lifetime: 'निर्दिष्ट समय के बाद संदेश स्वचालित रूप से हटा दिए जाते हैं।',
		tip_pin: 'पिन-कोड सेट के साथ खाते की निष्क्रियता के 7 दिनों के बाद कॉन्फ़िगरेशन सेटिंग्स और सभी संदेश हटा दिए जाएंगे।',
		tip_secret: 'गुप्त पता आपको अन्य साइटों से अपना मुख्य पता छिपाने की अनुमति देता है। सभी ईमेल आपके मुख्य मेलबॉक्स में दिखाई देंगे, लेकिन कोई भी कभी भी आपका वास्तविक पता नहीं बताएगा।'
	},
	de: {
		privacy: 'Datenschutzrichtlinien',
		privacy_short: 'Vertraulichkeit',
		contacts: 'Kontakte',
		your_tempmail_address_is_ready: 'Ihre neue Adresse',
		copy: 'Kopieren',
		copied: 'Kopiert',
		settings: 'Interface-Optionen',
		new_random_name: 'Zufälliger Name',
		new_random_name_comment: 'Die einmalige Mailbox TempMail.Plus schützt euch vom E-Müll und Werbe-E-Mails. Der Service der momentan Mail ist anonym und voll kostenlos.',
		inbox: 'Posteingang',
		compose: 'Schreiben',
		waiting_for_emails: 'Auf neue Nachrichten warten...',
		yes: 'Ja',
		no: 'Nein',
		tor_mirror: 'Unser TOR Web-Spiegel-Server',
		page_not_found: 'Seite nicht gefunden!',
		enter: 'Betreten',
		pin_code: 'PIN-Nummer',
		secret_address: 'Geheimadresse',
		save: 'Speichern',
		set_pincode: 'Die PIN-Nummer bestimmen',
		choose_lifetime: 'Wählen Sie die Speicherdauer dieser Mailbox',
		min: 'min',
		day: 'tage',
		address_copied: 'Adresse kopiert',

		// index
		sender: 'Absender',
		subject: 'Betreff',
		time: 'Zeit',
		destroy_inbox: 'Alles löschen',
		destroy_inbox_confirm: 'Alle eingehenden Nachrichten löschen?',
		box_protected: 'Diese Box ist durch einen PIN-Nummer geschützt',
		enter_pincode: 'PIN-Nummer eingeben.',
		wrong_pincode: 'Ungültiger PIN-Nummer.',
		confirm_robot: 'Bitte bestätigen Sie, dass Sie kein Roboter sind.',

		// index-how
		how_it_works: 'Wie funktioniert unsere momentan Mail?',
		how_it_works_text: 'TempMail.Plus ist die einmalige Mailbox, die die Briefe auf eine kurze Frist speichert. Der Service funktioniert als die momentan Mail (die Mailbox für 10 Minuten). Wir schaffen eine Mailbox, die Ihren einlaufendes Schreiben für 10 Minuten oder mehr abnimmt und speichert. Diese Speicherdauer kann im Menü der Interface-Optionen verändert werden.',
		with_anonymous_mail: 'TempMail.Plus Ihre Anonymität auf verschiedene Online-Services bietet. Unsere anonyme E-Mail lässt:',
		wam_1: 'Ungefährliche Anmeldung durch Wi-Fi und auf die dritte Seite machen,',
		wam_2: 'E-Mail von unerwünschten Briefe und E-Müll befreit machen,',
		wam_3: 'Mit den Fremde anonym korrespondieren,',
		wam_5: 'Auf Social Media und in den Computerspielen registrieren,',
		service_is_free: 'Ihre momentan Mail kann geschützt sein, wenn Sie eines PIN-Nummer oder einer Geheimadresse benützen. Diese Option kann im Menü der Interface-Optionen verändert werden.',
		enjoy_mail: 'Entdecken Sie unsere TempMail.Plus Service mit Freude!',

		// mail
		back: 'Zurück',
		delete: 'Löschen',
		delete_confirm: 'Nachricht löschen?',
		no_subject: '(Kein Thema)',
		no_text: '(Ist leer)',

		// compose
		new_message: 'Neue Nachricht',
		to: 'Wem',
		local_recipients_only: '(nur lokale Empfänger)',
		text: 'Text',
		attach_files: 'Dateien anzuhängen',
		send: 'Absenden',

		// contacts
		contact_us: 'Schreiben Sie uns',
		contact_us_comment: 'Haben Sie Fragen oder Angebote - schreiben Sie uns! ',
		name: 'Name',
		email: 'E-mail',
		message: 'Nachricht',

		// privacy
		privacy_policy: 'Datenschutzrichtlinien',

		//validator
		required_field: 'Dieses Feld ist pflichtmäßig.',
		not_valid_email_address: 'Falsche E-Mail Adresse.',

		// messages
		error_sending_data: 'Fehler beim Senden der Daten.',
		message_successfully_sent: 'Nachricht gesendet.',
		error_loading_data: 'Fehler beim Laden der Daten.',
		failed_delete_all_mails: 'Fehler beim Löschen der Buchstaben.',
		failed_delete_mail: 'Fehler löschen.',
		unable_send_message: 'Fehler beim Senden der Nachricht. Wiederholen.',
		attachments_too_large: 'Angehängte Dateien sind zu groß. Das Limit beträgt 50 MB.',
		name_empty: 'Der Name darf nicht leer sein.',
		name_longer_200_characters: 'Der Name darf nicht länger als 200 Zeichen sein.',
		name_invalid: 'Der Name darf nur alphanumerische Zeichen und die Zeichen ".-_" Enthalten.',
		tip_lifetime: 'Nachrichten werden automatisch nach dem definierten Zeitpunkt gelöscht.',
		tip_pin: 'Konfigurationen und alle Nachrichten werden automatisch nach 7 Tage von der Inaktivität des Account mit der PIN-Nummer gelöscht.',
		tip_secret: 'Die Geheimadresse lässt Ihre eigene Mail geheimhalten. Alle Nachrichten werden in Ihre eigene Mailbox erstehen. Aber niemand wird Ihre aktuelle E-Mail erkennen'
	},
	es: {
		privacy: 'Política de privacidad',
		privacy_short: 'Privacidad',
		contacts: 'Contactos',
		your_tempmail_address_is_ready: 'Su nueva dirección',
		copy: 'Copiar',
		copied: 'Copiado',
		settings: 'Ajustes',
		new_random_name: 'Nombre aleatorio',
		new_random_name_comment: 'Correo desechable de TempMail.Plus le ahorrará spam y correos electrónicos promocionales. Servicio temporal electrónico anónimo y gratuito.',
		inbox: 'Entrante',
		compose: 'Escribir',
		waiting_for_emails: 'Esperando nuevos correos electrónicos...',
		yes: 'Si',
		no: 'No',
		tor_mirror: 'Nuestro espejo TOR',
		page_not_found: '¡Página no encontrada!',
		enter: 'Entrar',
		pin_code: 'PIN',
		secret_address: 'Dirección secreta',
		save: 'Salvar',
		set_pincode: 'Establecer código PIN',
		choose_lifetime: 'Seleccione la vida útil del buzón',
		min: 'min',
		day: 'dia',
		address_copied: 'Dirección copiada',
	
		// index
		sender: 'Remitente',
		subject: 'Tema',
		time: 'Hora',
		destroy_inbox: 'Elimina todo',
		destroy_inbox_confirm: '¿Eliminar todos los mensajes entrantes?',
		box_protected: 'Esta casilla está protegida por un PIN',
		enter_pincode: 'Introduce tu PIN.',
		wrong_pincode: 'PIN no válido.',
		confirm_robot: 'Confirma que no eres un robot.',
	
		// index-how
		how_it_works: 'Cómo funciona nuestro correo temporal',
		how_it_works_text: 'TempMail.Plus es un buzón desechable que almacena correos electrónicos a corto plazo. El Servicio funciona según el principio de correo temporal (o correo durante 10 minutos). Creamos una bandeja de entrada que acepta Y guarda sus correos electrónicos entrantes durante 10 minutos o más (el tiempo de almacenamiento exacto se puede cambiar en la Configuración).',
		with_anonymous_mail: 'TempMail.Plus proporciona su anonimato en varios servicios en línea. Con nuestro correo anónimo, usted puede:',
		wam_1: 'Registrarse de forma segura en puntos Wi-Fi y sitios de terceros,',
		wam_2: 'Borrar correo electrónico de correos electrónicos no deseados y spam,',
		wam_3: 'Mantener correspondencia con extraños mientras permanece en el anonimato,',
		wam_5: 'Registrarse en juegos y redes sociales de forma.',
		service_is_free: 'Puede proteger su correo temporal configurando un PIN en él y utilizando la dirección secreta creada. Estas funciones están disponibles en la configuración.',
		enjoy_mail: 'Utilice Temp Mail desechable.Plus en la diversión!',
	
		// mail
		back: 'De regreso',
		delete: 'Eliminar',
		delete_confirm: '¿Borrar mensaje?',
		no_subject: '(Sin tema)',
		no_text: '(Vacío)',
	
		// compose
		new_message: 'Un nuevo mensaje',
		to: 'Para',
		local_recipients_only: '(solo destinatarios locales)',
		text: 'Texto',
		attach_files: 'Adjuntar archivos',
		send: 'Enviar',
	
		// contacts
		contact_us: 'Envíenos un correo electrónico',
		contact_us_comment: 'Tiene preguntas, sugerencias o cualquier otra cosa escriban.',
		name: 'Nombre',
		email: 'Su dirección de correo electrónico',
		message: 'Mensaje',
	
		// privacy
		privacy_policy: 'Política de privacidad',
	
		//validator
		required_field: 'Campo requerido.',
		not_valid_email_address: 'Dirección de E-Mail incorrecta.',
	
		// messages
		error_sending_data: 'Error de envío de datos.',
		message_successfully_sent: 'Mensaje enviado.',
		error_loading_data: 'Error de carga de datos.',
		failed_delete_all_mails: 'Error al eliminar letras.',
		failed_delete_mail: 'Eliminar error.',
		unable_send_message: 'Error al enviar el mensaje. Repetir.',
		attachments_too_large: 'Los archivos adjuntos son demasiado grandes. El límite es de 50 MB.',
		name_empty: 'El nombre no debe estar vacío.',
		name_longer_200_characters: 'El nombre no debe tener más de 200 caracteres.',
		name_invalid: 'El nombre solo puede contener caracteres alfanuméricos y los caracteres ".-_".',
		tip_lifetime: 'Los mensajes se eliminan automáticamente después del tiempo especificado.',
		tip_pin: 'Los ajustes de configuración y todos los mensajes se eliminarán después de 7 días de inactividad de la cuenta con el PIN establecido.',
		tip_secret: 'La dirección secreta le permite ocultar su dirección principal de otros sitios. Todos los correos electrónicos aparecerán en su bandeja de entrada principal, pero nadie sabrá su dirección real.'
	},
	pt: {
		privacy: 'Política de privacidade',
		privacy_short: 'Privacidade',
		contacts: 'Comunicação',
		your_tempmail_address_is_ready: 'Seu novo endereço',
		copy: 'Copiar',
		copied: 'Copiado',
		settings: 'Sintonização',
		new_random_name: 'Um nome aleatório',
		new_random_name_comment: 'Um email de TempMail.Plus livrá-Lo de spam e e-mails de marketing. Serviço temporário mail anônimo e gratuito.',
		inbox: 'Entrada',
		compose: 'Escrever',
		waiting_for_emails: 'À espera de novos e-mails...',
		yes: 'Sim',
		no: 'Não',
		tor_mirror: 'Nosso espelho TOR',
		page_not_found: 'Página não encontrada!',
		enter: 'Entrar',
		pin_code: 'PIN',
		secret_address: 'Secreta endereço',
		save: 'Guardar',
		set_pincode: 'Definir um código PIN',
		choose_lifetime: 'Seleccione o tempo de vida de uma caixa de correio',
		min: 'min',
		day: 'dia',
		address_copied: 'Endereço copiado',
	
		// index
		sender: 'Remetente',
		subject: 'Tema',
		time: 'Tempo',
		destroy_inbox: 'Deletar tudo',
		destroy_inbox_confirm: 'Excluir todas as mensagens recebidas?',
		box_protected: 'Esta caixa é protegida por um PIN',
		enter_pincode: 'Insira seu PIN.',
		wrong_pincode: 'PIN inválido.',
		confirm_robot: 'Confirme que você não é um robô.',
	
		// index-how
		how_it_works: 'Como funciona o nosso temporária mail',
		how_it_works_text: 'TempMail.Plus é a única caixa de correio, que armazena e-mails em um curto prazo. O serviço funciona segundo o princípio temporária email (ou email em 10 minutos). Nós criamos uma caixa de correio que leva e mantém Suas mensagens recebidas por 10 minutos ou mais (o tempo exato de armazenamento pode ser alterado nas Configurações).',
		with_anonymous_mail: 'TempMail.Plus garante Seu anonimato em diferentes on-line serviços. Com a nossa anônima mail, Você pode:',
		wam_1: 'Seguro registrado no Wi-Fi e pontos de sites de terceiros,',
		wam_2: 'Limpar o e-mail de spams,',
		wam_3: 'Conduzir o e-mail com estranhos, mantendo-se anônimo,',
		wam_5: 'Registrado em jogos e redes.',
		service_is_free: 'Você pode proteger a sua temporária mail, com ela, o código PIN e usando o criado secreto endereço. Esses recursos estão disponíveis em configurações.',
		enjoy_mail: 'Utilize um único email Temp Mail.Plus divertido!',
	
		// mail
		back: 'De volta a',
		delete: 'Excluir',
		delete_confirm: 'Apagar mensagem?',
		no_subject: '(Sem tópico)',
		no_text: '(Vazio)',
	
		// compose
		new_message: 'Uma nova mensagem',
		to: 'Quem',
		local_recipients_only: '(apenas para os destinatários no local)',
		text: 'Texto',
		attach_files: 'Anexar arquivos',
		send: 'Enviar',
	
		// contacts
		contact_us: 'Escreva para nós',
		contact_us_comment: 'Tem dúvidas, sugestões ou qualquer outra coisa - em contactar-nos.',
		name: 'Nome',
		email: 'O seu endereço de e-mail',
		message: 'Comunicação',
	
		// privacy
		privacy_policy: 'Política de privacidade',
	
		//validator
		required_field: 'Campo obrigatório.',
		not_valid_email_address: 'Endereço de e-mail incorreto.',
	
		// messages
		error_sending_data: 'Erro no envio de dados.',
		message_successfully_sent: 'Mensagem enviada.',
		error_loading_data: 'Erro ao carregar dados.',
		failed_delete_all_mails: 'Erro ao excluir letras.',
		failed_delete_mail: 'Excluir erro.',
		unable_send_message: 'Erro ao enviar mensagem. Repetir.',
		attachments_too_large: 'Os arquivos anexados são muito grandes. O limite é 50 MB.',
		name_empty: 'O nome não deve estar vazio.',
		name_longer_200_characters: 'O nome não deve ter mais de 200 caracteres.',
		name_invalid: 'O nome pode conter apenas caracteres alfanuméricos e os caracteres ".-_".',
		tip_lifetime: 'As mensagens são excluídas automaticamente após o tempo especificado.',
		tip_pin: 'As definições de configuração e todas as mensagens serão excluídas após 7 dias de inatividade da conta com o PIN definido.',
		tip_secret: 'O endereço secreto permite que você oculte seu endereço principal de outros sites. Todos os e-mails aparecerão em sua caixa de entrada principal, mas ninguém jamais saberá seu endereço real.'
	},
	ar: {
		privacy: 'سياسة الخصوصية',
		privacy_short: 'خصوصية',
		contacts: 'اتصل بنا',
		your_tempmail_address_is_ready: 'عنوان tempmail الخاص بك جاهز',
		copy: 'ينسخ',
		copied: 'نسخ',
		settings: 'إعدادات',
		new_random_name: 'اسم عشوائي جديد',
		new_random_name_comment: 'سيوفر لك البريد لمرة واحدة من TempMail.Plus من البريد العشوائي والرسائل الإخبارية الترويجية عبر البريد الإلكتروني. يتم توفير خدمة البريد المتاح للاستخدام المجهول مجانًا.',
		inbox: 'صندوق الوارد',
		compose: 'مؤلف موسيقى',
		waiting_for_emails: 'في انتظار البريد ...',
		yes: 'نعم',
		no: 'لا',
		tor_mirror: 'مرآة TOR الخاصة بنا هي',
		page_not_found: 'الصفحة غير موجودة!',
		enter: 'يدخل',
		pin_code: 'رمز PIN',
		secret_address: 'العنوان السري',
		save: 'يحفظ',
		set_pincode: 'تعيين رمز PIN',
		choose_lifetime: 'اختر عمر صندوق البريد',
		min: 'دقيقة',
		day: 'أيام',
		address_copied: 'تم نسخ العنوان',

		// index
		sender: 'مرسل',
		subject: 'موضوع',
		time: 'وقت',
		destroy_inbox: 'تدمير البريد الوارد',
		destroy_inbox_confirm: 'هل تريد حقًا تدمير البريد الوارد؟',
		box_protected: 'صندوق الوارد محمي برمز PIN',
		enter_pincode: 'أدخل رمز PIN.',
		wrong_pincode: 'رمز PIN خاطئ.',
		confirm_robot: 'يرجى تأكيد أنك لست روبوتًا.',

		// index-how
		how_it_works: 'كيف يعمل بريدنا المؤقت',
		how_it_works_text: 'TempMail.Plus هو صندوق بريد يمكن التخلص منه يخزن رسائل البريد الإلكتروني لفترة قصيرة. تعمل خدمتنا كبريد مؤقت (أو "بريد مدته 10 دقائق"). ينشئ عنوان بريد إلكتروني ويخزن بريدك الوارد لمدة 10 دقائق أو أكثر (يمكنك تغيير عمر البريد بالضبط في الإعدادات).',
		with_anonymous_mail: 'تحمي خدمة TempMail.Plus الخصوصية عند الوصول إلى مجموعة متنوعة من الخدمات عبر الإنترنت. باستخدام بريدنا المجهول ، يمكنك:',
		wam_1: 'التسجيل في نقاط Wi-Fi ومواقع الطرف الثالث ،',
		wam_2: 'حماية بريدك الإلكتروني من الرسائل غير المرغوب فيها والبريد العشوائي ،',
		wam_3: 'الدردشة مع الغرباء والبقاء مجهول الهوية ،',
		wam_5: 'اشترك في الألعاب أو وسائل التواصل الاجتماعي.',
		service_is_free: 'يمكنك حماية بريدك المؤقت عن طريق تعيين رمز PIN أو استخدام العنوان السري الذي تم إنشاؤه. هذه الميزات يمكن الوصول إليها في الإعدادات.',
		enjoy_mail: 'استمتع ببريدك لمرة واحدة!',

		// mail
		back: 'خلف',
		delete: 'يمسح',
		delete_confirm: 'هل تريد حقًا حذف البريد؟',
		no_subject: '(لا يوجد عنوان)',
		no_text: '(فارغ)',

		// compose
		new_message: 'رسالة جديدة',
		to: 'ل',
		local_recipients_only: '(المستلمون المحليون فقط)',
		text: 'نص',
		attach_files: 'إرفاق ملفات',
		send: 'يرسل',

		// contacts
		contact_us: 'اتصل بنا',
		contact_us_comment: 'إذا كانت لديك أسئلة أو اقتراحات أو أي شيء آخر ، فلا تتردد في الاتصال بنا.',
		name: 'اسم',
		email: 'بريد إلكتروني',
		message: 'رسالة',

		// privacy
		privacy_policy: 'سياسة الخصوصية',

		//validator
		required_field: 'هذه الخانة مطلوبه.',
		not_valid_email_address: 'يرجى إدخال عنوان بريد إلكتروني صالح.',

		// messages
		error_sending_data: 'خطأ في إرسال البيانات.',
		message_successfully_sent: 'تم ارسال الرسالة بنجاح.',
		error_loading_data: 'خطأ في تحميل البيانات.',
		failed_delete_all_mails: 'فشل في حذف كافة رسائل البريد.',
		failed_delete_mail: 'فشل حذف البريد.',
		unable_send_message: 'غير قادر على إرسال الرسالة. حاول ثانية.',
		attachments_too_large: 'المرفقات كبيرة جدًا. الحد الأقصى 50 ميغا بايت.',
		name_empty: 'يجب ألا يكون الاسم فارغًا.',
		name_longer_200_characters: 'لا يمكن أن يكون الاسم أطول من 200 حرف.',
		name_invalid: 'لا يمكن أن يحتوي الاسم إلا على أحرف أبجدية رقمية ورموز ".-_".',
		tip_lifetime: 'يتم حذف الرسائل تلقائيًا بعد الوقت المحدد.',
		tip_pin: 'سيتم حذف إعدادات التكوين وجميع الرسائل بعد 7 أيام من عدم نشاط الحساب مع تعيين رمز PIN.',
		tip_secret: 'يسمح لك العنوان السري بإخفاء عنوانك الرئيسي من المواقع الأخرى. ستظهر جميع رسائل البريد الإلكتروني في صندوق البريد الرئيسي الخاص بك ، ولكن لن يعرف أحد عنوانك الحقيقي.'
	},
	fr: {
		privacy: 'Politique de confidentialité',
		privacy_short: 'Confidentialité',
		contacts: 'Contactez-nous',
		your_tempmail_address_is_ready: 'Votre adresse tempmail est prête',
		copy: 'Copie',
		copied: 'Copié',
		settings: 'Paramètres',
		new_random_name: 'Nouveau nom aléatoire',
		new_random_name_comment: 'Le courrier unique de TempMail.Plus vous évitera les spams et les newsletters promotionnelles. Le service de courrier jetable à usage anonyme est fourni gratuitement.',
		inbox: 'Boîte de réception',
		compose: 'Composer',
		waiting_for_emails: 'En attente de courriers...',
		yes: 'Oui',
		no: 'Non',
		tor_mirror: 'Notre miroir TOR est',
		page_not_found: 'Page non trouvée!',
		enter: 'Entrer',
		pin_code: 'Code PIN',
		secret_address: 'Adresse secrète',
		save: 'Sauvegarder',
		set_pincode: 'Définir le code PIN',
		choose_lifetime: 'Choisir la durée de vie de la boîte aux lettres',
		min: 'min',
		day: 'jours',
		address_copied: 'Adresse copiée',

		// index
		sender: 'Expéditeur',
		subject: 'Sujet',
		time: 'Temps',
		destroy_inbox: 'Détruire la boîte de réception',
		destroy_inbox_confirm: 'Voulez-vous vraiment détruire la boîte de réception ?',
		box_protected: 'La boîte de réception est protégée par un code PIN',
		enter_pincode: 'Entrez le code PIN.',
		wrong_pincode: 'Code PIN erroné.',
		confirm_robot: 'Veuillez confirmer que vous n\'êtes pas un robot.',

		// index-how
		how_it_works: 'Comment fonctionne notre courrier temporaire',
		how_it_works_text: 'TempMail.Plus est une boîte aux lettres jetable qui stocke les e-mails pendant une courte période. Notre service fonctionne comme un courrier temporaire (ou "courrier 10 minutes"). Il génère une adresse e-mail et stocke votre courrier entrant pendant 10 minutes ou plus (vous pouvez modifier la durée de vie exacte du courrier dans les paramètres).',
		with_anonymous_mail: 'Le service TempMail.Plus protège la confidentialité lorsque vous accédez à une variété de services en ligne. Avec notre courrier anonyme, vous pouvez :',
		wam_1: 'Enregistrez-vous sur des points Wi-Fi et des sites tiers,',
		wam_2: 'Protégez votre messagerie des courriers indésirables et des spams,',
		wam_3: 'Discutez avec des inconnus et restez anonyme,',
		wam_5: 'Inscrivez-vous à des jeux ou à des réseaux sociaux.',
		service_is_free: 'Vous pouvez protéger votre courrier temporaire en définissant un code PIN ou en utilisant l\'adresse secrète générée. Ces fonctionnalités sont accessibles dans les paramètres.',
		enjoy_mail: 'Profitez de votre courrier unique !',

		// mail
		back: 'Dos',
		delete: 'Supprimer',
		delete_confirm: 'Voulez-vous vraiment supprimer le courrier ?',
		no_subject: '(Pas de sujet)',
		no_text: '(Vide)',

		// compose
		new_message: 'Nouveau message',
		to: 'Pour',
		local_recipients_only: '(destinataires locaux uniquement)',
		text: 'Texte',
		attach_files: 'Joindre des fichiers',
		send: 'Envoyer',

		// contacts
		contact_us: 'Contactez-nous',
		contact_us_comment: 'Si vous avez des questions, des suggestions ou toute autre chose, n\'hésitez pas à nous contacter.',
		name: 'Nom',
		email: 'E-mail',
		message: 'Message',

		// privacy
		privacy_policy: 'Politique de confidentialité',

		//validator
		required_field: 'Ce champ est obligatoire.',
		not_valid_email_address: 'S\'il vous plaît, mettez une adresse email valide.',

		// messages
		error_sending_data: 'Erreur lors de l\'envoi des données.',
		message_successfully_sent: 'Message envoyé avec succès.',
		error_loading_data: 'Erreur lors du chargement des données.',
		failed_delete_all_mails: 'Échec de la suppression de tous les e-mails.',
		failed_delete_mail: 'Échec de la suppression du courrier.',
		unable_send_message: 'Impossible d\'envoyer le message. Essayer à nouveau.',
		attachments_too_large: 'Les pièces jointes sont trop volumineuses. La limite est de 50 Mo.',
		name_empty: 'Le nom ne doit pas être vide.',
		name_longer_200_characters: 'Le nom ne peut pas dépasser 200 caractères.',
		name_invalid: 'Le nom ne peut contenir que des caractères alphanumériques et des symboles ".-_".',
		tip_lifetime: 'Les messages sont automatiquement supprimés après le délai spécifié.',
		tip_pin: 'Les paramètres de configuration et tous les messages seront supprimés après 7 jours d\'inactivité du compte avec le code PIN défini.',
		tip_secret: 'L\'adresse secrète vous permet de dissimuler votre adresse principale aux autres sites. Tous les e-mails apparaîtront dans votre boîte aux lettres principale, mais personne ne connaîtra jamais votre véritable adresse.'
	},
	ja:	{
		privacy: 'プライバシーポリシー',
		privacy_short: 'プライバシー',
		contacts: 'お問い合わせ',
		your_tempmail_address_is_ready: 'あなたの一時メールアドレスは準備ができています',
		copy: 'コピー',
		copied: 'コピーしました',
		settings: '設定',
		new_random_name: '新しいランダムな名前',
		new_random_name_comment: 'TempMail.Plus からの 1 回限りのメールは、スパムやプロモーション メール ニュースレターからあなたを救います。 匿名の使い捨てメールサービスを無料で提供しています。',
		inbox: '受信トレイ',
		compose: '作成する',
		waiting_for_emails: 'メールを待っています...',
		yes: 'はい',
		no: 'いいえ',
		tor_mirror: '私たちのTORミラーは',
		page_not_found: 'ページが見つかりません！',
		enter: '入力',
		pin_code: 'ピンコード',
		secret_address: '秘密のアドレス',
		save: '保存',
		set_pincode: 'PIN コードの設定',
		choose_lifetime: 'メールボックスの有効期間を選択する',
		min: '分',
		day: '日々',
		address_copied: 'アドレスをコピーしました',

		// index
		sender: '送信者',
		subject: '主題',
		time: '時間',
		destroy_inbox: '受信トレイを破棄する',
		destroy_inbox_confirm: '本当に受信トレイを破棄しますか?',
		box_protected: '受信トレイは PIN コードで保護されています',
		enter_pincode: 'PIN コードを入力します。',
		wrong_pincode: '間違った PIN コード。',
		confirm_robot: 'ロボットではないことを確認してください。',

		// index-how
		how_it_works: '一時的なメールの仕組み',
		how_it_works_text: 'TempMail.Plus は、メールを一時的に保存する使い捨てメールボックスです。 当社のサービスは、一時的なメール (または「10 分メール」) として機能します。 電子メール アドレスを生成し、受信メールを 10 分以上保存します (正確なメールの有効期間は [設定] で変更できます)。',
		with_anonymous_mail: 'TempMail.Plus サービスは、オンラインでさまざまなサービスにアクセスする際のプライバシーを保護します。 私たちの匿名メールを使用すると、次のことができます。',
		wam_1: 'Wi-Fi ポイントやサードパーティのサイトに登録し、',
		wam_2: '不要な手紙やスパムからメールを保護し、',
		wam_3: '見知らぬ人とチャットし、匿名のまま、',
		wam_5: 'ゲームやソーシャル メディアにサインアップします。',
		service_is_free: 'PIN コードを設定するか、生成された秘密のアドレスを使用して、一時的なメールを保護できます。 これらの機能は、設定でアクセスできます。',
		enjoy_mail: 'ワンタイムメールを楽しもう！',

		// mail
		back: '戻る',
		delete: '消去',
		delete_confirm: '本当にメールを削除しますか?',
		no_subject: '（件名なし）',
		no_text: '（空）',

		// compose
		new_message: '新しいメッセージ',
		to: 'に',
		local_recipients_only: '(ローカル受信者のみ)',
		text: '文章',
		attach_files: 'ファイルを添付',
		send: '送信',

		// contacts
		contact_us: 'お問い合わせ',
		contact_us_comment: 'ご質問、ご提案、その他何かございましたら、お気軽にお問い合わせください。',
		name: '名前',
		email: 'Eメール',
		message: 'メッセージ',

		// privacy
		privacy_policy: 'プライバシーポリシー',

		//validator
		required_field: 'この項目は必須です。',
		not_valid_email_address: '有効なメールアドレスを入力してください。',

		// messages
		error_sending_data: 'データ送信エラー。',
		message_successfully_sent: 'メッセージが送信されました。',
		error_loading_data: 'データのロード中にエラーが発生しました。',
		failed_delete_all_mails: 'すべてのメールを削除できませんでした。',
		failed_delete_mail: 'メールの削除に失敗しました。',
		unable_send_message: 'メッセージを送信できません。 再試行する。',
		attachments_too_large: '添付ファイルが大きすぎます。 制限は 50 MB です。',
		name_empty: '名前を空にすることはできません。',
		name_longer_200_characters: '名前は 200 文字以内にする必要があります。',
		name_invalid: '名前には、英数字と記号「.-_」のみを使用できます。',
		tip_lifetime: '指定した時間が経過すると、メッセージは自動的に削除されます。',
		tip_pin: '構成設定とすべてのメッセージは、PIN コードが設定されたアカウントを 7 日間使用しないと削除されます。',
		tip_secret: '秘密のアドレスを使用すると、メインのアドレスを他のサイトから隠すことができます。 すべてのメールはメインのメールボックスに表示されますが、実際のアドレスは誰も知りません。'
	},
	bn: 	{
		privacy: 'গোপনীয়তা নীতি',
		privacy_short: 'গোপনীয়তা',
		contacts: 'যোগাযোগ করুন',
		your_tempmail_address_is_ready: 'আপনার টেম্পমেইল ঠিকানা প্রস্তুত',
		copy: 'কপি',
		copied: 'কপি করা হয়েছে',
		settings: 'সেটিংস',
		new_random_name: 'নতুন এলোমেলো নাম',
		new_random_name_comment: 'TempMail.Plus থেকে এককালীন মেইল আপনাকে স্প্যাম এবং প্রচারমূলক ইমেল নিউজলেটার থেকে রক্ষা করবে। বেনামী ব্যবহারের জন্য নিষ্পত্তিযোগ্য মেল পরিষেবা বিনামূল্যে প্রদান করা হয়.',
		inbox: 'ইনবক্স',
		compose: 'রচনা করা',
		waiting_for_emails: 'মেইলের জন্য অপেক্ষা করা হচ্ছে...',
		yes: 'হ্যাঁ',
		no: 'না',
		tor_mirror: 'আমাদের TOR আয়না হয়',
		page_not_found: 'পৃষ্ঠা খুঁজে পাওয়া যায়নি!',
		enter: 'প্রবেশ করুন',
		pin_code: 'পিনকোড',
		secret_address: 'গোপন ঠিকানা',
		save: 'সংরক্ষণ',
		set_pincode: 'পিন কোড সেট করুন',
		choose_lifetime: 'মেলবক্স জীবনকাল চয়ন করুন',
		min: 'মিনিট',
		day: 'দিন',
		address_copied: 'ঠিকানা কপি করা হয়েছে',

		// index
		sender: 'প্রেরক',
		subject: 'বিষয়',
		time: 'সময়',
		destroy_inbox: 'ইনবক্স ধ্বংস',
		destroy_inbox_confirm: 'আপনি কি সত্যিই ইনবক্স ধ্বংস করতে চান?',
		box_protected: 'ইনবক্স একটি পিন কোড দ্বারা সুরক্ষিত',
		enter_pincode: 'পিন কোড লিখুন।',
		wrong_pincode: 'ভুল পিন কোড।',
		confirm_robot: 'অনুগ্রহ করে নিশ্চিত করুন যে আপনি রোবট নন।',

		// index-how
		how_it_works: 'কিভাবে আমাদের অস্থায়ী মেল কাজ করে',
		how_it_works_text: 'TempMail.Plus হল একটি নিষ্পত্তিযোগ্য মেলবক্স যা অল্প সময়ের জন্য ইমেল সংরক্ষণ করে। আমাদের পরিষেবা একটি অস্থায়ী মেল (বা "10-মিনিটের মেল") হিসাবে কাজ করে৷ এটি একটি ইমেল ঠিকানা তৈরি করে এবং 10 মিনিট বা তার বেশি সময়ের জন্য আপনার আগত মেল সংরক্ষণ করে (আপনি সেটিংসে সঠিক মেল জীবনকাল পরিবর্তন করতে পারেন)।',
		with_anonymous_mail: 'আপনি যখন অনলাইনে বিভিন্ন পরিষেবা অ্যাক্সেস করেন তখন TempMail.Plus পরিষেবা গোপনীয়তা রক্ষা করে৷ আমাদের বেনামী মেল দিয়ে, আপনি করতে পারেন:',
		wam_1: 'Wi-Fi পয়েন্ট এবং তৃতীয় পক্ষের সাইটগুলিতে নিবন্ধন করুন,',
		wam_2: 'অবাঞ্ছিত চিঠি এবং স্প্যাম থেকে আপনার ইমেল রক্ষা করুন,',
		wam_3: 'অপরিচিতদের সাথে চ্যাট করুন এবং বেনামে থাকুন,',
		wam_5: 'গেম বা সামাজিক মিডিয়া সাইন আপ করুন.',
		service_is_free: 'আপনি একটি PIN-কোড সেট করে বা জেনারেট করা গোপন ঠিকানা ব্যবহার করে আপনার অস্থায়ী মেল রক্ষা করতে পারেন। এই বৈশিষ্ট্যগুলি সেটিংসে অ্যাক্সেসযোগ্য।',
		enjoy_mail: 'আপনার এক সময়ের মেল উপভোগ করুন!',

		// mail
		back: 'পেছনে',
		delete: 'মুছে ফেলা',
		delete_confirm: 'আপনি কি সত্যিই মেল মুছে ফেলতে চান?',
		no_subject: '(কোন বিষয় নেই)',
		no_text: '(খালি)',

		// compose
		new_message: 'নতুন বার্তা',
		to: 'প্রতি',
		local_recipients_only: '(শুধুমাত্র স্থানীয় প্রাপক)',
		text: 'পাঠ্য',
		attach_files: 'সংযুক্ত নথি',
		send: 'পাঠান',

		// contacts
		contact_us: 'যোগাযোগ করুন',
		contact_us_comment: 'আপনার যদি প্রশ্ন, পরামর্শ বা অন্য কিছু থাকে তবে নির্দ্বিধায় আমাদের সাথে যোগাযোগ করুন।',
		name: 'নাম',
		email: 'ইমেইল',
		message: 'বার্তা',

		// privacy
		privacy_policy: 'গোপনীয়তা নীতি',

		//validator
		required_field: 'ঘরটি অবশ্যই পূরণ করতে হবে.',
		not_valid_email_address: 'একটি বৈধ ইমেইল ঠিকানা লিখুন।',

		// messages
		error_sending_data: 'ডেটা প্রেরণে ত্রুটি৷',
		message_successfully_sent: 'বার্তা সফলভাবে প্রেরিত.',
		error_loading_data: 'ডেটা লোড করার সময় ত্রুটি৷',
		failed_delete_all_mails: 'সব মেল মুছে ফেলতে ব্যর্থ.',
		failed_delete_mail: 'মেল মুছে ফেলতে ব্যর্থ হয়েছে৷',
		unable_send_message: 'বার্তা পাঠাতে অক্ষম. আবার চেষ্টা কর.',
		attachments_too_large: 'সংযুক্তিগুলি খুব বড়৷ সীমা 50 MBytes.',
		name_empty: 'নাম খালি হওয়া উচিত নয়।',
		name_longer_200_characters: 'নাম 200 অক্ষরের বেশি হতে পারে না।',
		name_invalid: 'নামের শুধুমাত্র বর্ণসংখ্যার অক্ষর এবং চিহ্ন থাকতে পারে ".-_"।',
		tip_lifetime: 'নির্দিষ্ট সময়ের পরে বার্তাগুলি স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়।',
		tip_pin: 'কনফিগারেশন সেটিংস এবং সমস্ত বার্তা পিন-কোড সেট সহ অ্যাকাউন্টের নিষ্ক্রিয়তার 7 দিন পরে মুছে ফেলা হবে।',
		tip_secret: 'গোপন ঠিকানা আপনাকে অন্যান্য সাইট থেকে আপনার প্রধান ঠিকানা গোপন করতে দেয়। সমস্ত ইমেল আপনার প্রধান মেলবক্সে প্রদর্শিত হবে, কিন্তু কেউ কখনও আপনার আসল ঠিকানা জানতে পারবে না।'
	}
	};

	fex.preload();
}());
