$('#pre_button').blur(function() {
	$('#pre_form').submit();
});

$('#text').focus(function() {
	if (!$(this).text().length) {
		$(this).append('<br>');
	}
});

$('#text').blur(function() {
	if ($(this).html() == '<br>') {
		$(this).empty();
	}
});

$('.email .dropdown-menu .dropdown-item').click(function() {
	let domain = $('#domain');
	let newValue = '@' + $(this).text();

	if (domain.text() != newValue) {
		domain.text(newValue);
		fex.updateEmail(true);
	}
});

$('.link').click(function() {
	scrollToTop();
});

var captchaWidget;
var captchaNewWidget;

var needNewCaptcha;

function initCaptcha() {
	captchaWidget = grecaptcha.render('captcha', {
		'sitekey' : '6LeeyKgUAAAAAKSlugFleu1vNMVItM3UHSTbXoTD'
	});

	captchaNewWidget = grecaptcha.render('newCaptcha', {
		'sitekey' : '6LeeyKgUAAAAAKSlugFleu1vNMVItM3UHSTbXoTD'
	});
}

var isProtected = false;
var canSound = true;
var ecaptcha;

$(function() {
	$.getScript(`https://www.google.com/recaptcha/api.js?onload=initCaptcha&hl=${fex.lang}`);

	$('.main .container-fluid-main').children().first().after(`
		<div class="ad-banners">
			<a href="https://www.digitalassets4u.com/invest-in-mining" target="_blank">
				<video autoplay muted loop playsinline>
					<source src="/ads/banner.mp4" type="video/mp4">
				</video>
			</a>
			<a href="https://www.digitalassets4u.com/invest-in-mining" target="_blank">
				<video autoplay muted loop playsinline>
					<source src="/ads/banner.mp4" type="video/mp4">
				</video>
			</a>
		</div>
	`);
});

$('[data-toggle="tooltip"]').on('show.bs.tooltip', function() {
	$(this).attr('data-original-title', fex.tr($(this).data('trt')));
});

$('#modal-settings').on('show.bs.modal', function(e) {
	initSettings();

	$('#new-pin').prop('type', 'password');
	$('.btn.eye').removeClass('active');
	$('#newCaptcha').hide();

	fex.json('GET', '/api/box', { email: fex.email }).done(function(j) {
		if (j.result) {
			$(`[data-mins="${j.ttl_minutes}"]`).button('toggle');
			$('#new-pin').val(fex.epin);
		}
		if (j.err) {
			$(`[data-mins="2880"]`).button('toggle');
			$('#new-pin').val('');
		}
	});

	fex.json('GET', '/api/box/hidden', { email: fex.email }).done(function(j) {
		if (j.result) {
			$('#secret-address').text(j.email);
		}
	});
});

function initSettings() {
	$('[data-toggle="tooltip"]').tooltip({
		placement: function() { return isMobile() ? 'bottom' : 'right' }
	});

	$('.btn.eye').off().click(function() {
		$('#new-pin').prop('type', $('#new-pin').prop('type') == 'text' ? 'password' : 'text');
	});

	$('#copy-secret').off().click(function() {
		showAlert('address_copied', $('#alert-sttings'), true);

		var input = document.createElement("input");

		input.value = $('#secret-address').text();
		input.type = 'text';
		input.id = 'clipboard';

		$('#modal-settings').prepend(input);

		input.focus();
		input.select();

		try {
			document.execCommand('copy');
		} catch(e) { }

		$('#clipboard').remove();
	});

	$('#modal-settings form').off().submit(function() {
		var data = { 
			email: fex.email, 
			ttl_minutes: $('.btn-group .btn.active').data('mins'), 
			pin: $('#new-pin').val()
		};

		if (needNewCaptcha) {		
			data.recaptcha = grecaptcha.getResponse(captchaNewWidget);
		}

		fex.json('POST', '/api/box', data).done(function(j) {
			if (j.result) {
				fex.epin = $('#new-pin').val();
				needNewCaptcha = false;
				$('#modal-settings').modal('hide');
			}
			if (j.with_captcha) {
				needNewCaptcha = true;
				grecaptcha.reset(captchaNewWidget, { 'hl': fex.lang });
				$('#newCaptcha').show();
			}
		}).fail(function() {
			$('#modal-settings').modal('hide');
		});
		
		return false;
	});
}

$('#modal-verify').on('show.bs.modal', function(e) {
	$('#pin').val('');
	$('#pin').removeClass('border-danger');
	$('#pin-error').hide();

	$('#captcha').hide();
	$('#captcha-error').hide();
	
	try {
		grecaptcha.reset(captchaWidget, { 'hl': fex.lang });
	} catch(e) { }
});

function showVerifyModal(j) {
	if ($('body').hasClass('modal-open')) { return; }

	$('#modal-verify').modal('show');

	$('#pre_settings, #compose').click(function() {
		if (isProtected) {
			$('#modal-verify').modal('show');
			return false;
		}
	});
	
	fex.needCaptcha = j.with_captcha || j.err.code == 1022;

	if (fex.needCaptcha) {
		$('#captcha').show();
	}

	canSound = false;

	$('#verify').off().click(function() {
		if ($('#pin').val().length == 0) {
			$('#pin').addClass('border-danger');
			$('#pin-error').text(fex.tr('enter_pincode')).show();
			return;
		} else {
			$('#pin').removeClass('border-danger');
			$('#pin-error').hide();
			fex.epin = $('#pin').val();
		}

		var data = { email: fex.email, epin: fex.epin };

		if (fex.needCaptcha && !grecaptcha.getResponse(captchaWidget)) {
			$('#captcha-error').show();
			$('#captcha').show();
			return;
		} else {
			$('#captcha-error').hide();
			$('#captcha').hide();
			ecaptcha = grecaptcha.getResponse(captchaWidget);
			data.recaptcha = ecaptcha;
		}

		fex.json('GET', '/api/box', data).done(function(j) {
			if (j.result) {
				try {
					fex.setTimer(500);
				} catch(e) { }

				$('#modal-verify').modal('hide');
			} else {
				if (!j.err) { return; }

				if (j.err.code == 1021) {
					$('#pin-error').text(fex.tr('wrong_pincode')).show();
					$('#pin').addClass('border-danger');
				}
				if (j.err.code == 1022) {
					grecaptcha.reset(captchaWidget, { 'hl': fex.lang });
					fex.needCaptcha = true;
					$('#captcha-error').show();
					$('#captcha').show();
				}
			}
		});
	});
}

function checkBox() {
	fex.json('GET', '/api/box', { email: fex.email });
}

function isMobile() {
	return $(window).width() < 768;
} 

function scrollToTop() {
	$('html, body').animate({scrollTop: 0}, 5);
}

function showAlert(trID, alert, success, pass) {
	if (isProtected && !pass) { return; }

	if (trID) {
		if (!alert) {
			alert = $('#alert-main');
		}

		success ? alert.addClass('bg-success') : alert.removeClass('bg-success');

		alert.text(fex.tr(trID) || trID);

		if (alert.is(':visible')) { return; }

		alert.slideDown(400);

		setTimeout(function() {
			alert.slideUp(500);
		}, 4000);
	}
}

function changeLanguage(lng, init) {
	lng = lng.toLowerCase();
	var langList = ['en', 'zh', 'hi', 'de', 'uk', 'ru', 'es', 'pt', 'ar', 'fr', 'ja', 'bn'];

	let $dropdown = $('.dropdown.lng').find('button');
	$dropdown.first().text(lng.toUpperCase());
	var dropOff = 0;
	for (var i = 0; i < langList.length; i++) {
		let l = langList[i];
		let $btn = $('#btn-' + l);

		$dropdown.removeClass(l);
		
		if (l == lng) {
			$btn.addClass('active');
			dropOff = 1;
		} else {
			$btn.removeClass('active');
			$dropdown.eq(1 + i - dropOff).text(l.toUpperCase()).addClass(l);
		}
	}

	if (!init) {
		fex.setCookie('lang', lng, 3650);
		fex.lang = lng;
		fex.updateMeta();
		fex.trBody();
	}

	$.extend($.validator.messages, {
		required: fex.tr('required_field'),
		email: fex.tr('not_valid_email_address')
	});

	var url = '/' + lng + '/' + location.hash;
	history.replaceState ? history.replaceState(null, null, url) : location.hash = url;

	$('link[rel=canonical]').each(function() {
		var node = this;
		node.href = 'https://tempmail.plus/' + fex.lang + '/' + location.hash;
	});

	var m = document.querySelector('meta[property="og:url"]');
	if (m) {
		m.setAttribute("content", 'https://tempmail.plus/' + fex.lang + '/' + location.hash);
	}
}

changeLanguage(fex.lang, true);

function getModifiedDate(date) {
	let now = new Date();
	var mail = new Date(date.replace(/-/g, '/'));

	if (!mail instanceof Date || isNaN(mail)) {
		mail = new Date(date);
	}

	if (now.getDate() == mail.getDate()) {
		return pad(mail.getHours()) + ':' + pad(mail.getMinutes());
	}

	if (now.getMonth() == mail.getMonth()) {
		return mail.getDate() + ' ' + getMonthName();
	}

	if (now.getFullYear() == mail.getFullYear()) {
		return pad(mail.getDate()) + '.' + pad(mail.getMonth() + 1) + '.' + mail.getFullYear();
	}

	function getMonthName() {
		return mail.toLocaleString(fex.lang, {month: 'short'}).toLowerCase();
	}

	function pad(n) {
		return n < 10 ? '0' + n : n;
	}
}

function toggleButton(btn, enable) {
	enable ? btn.show() : btn.hide();
}

var domainSuggester = {
	domains: ['mailto.plus', 'fexpost.com', 'fexbox.org', 'fexbox.ru', 'mailbox.in.ua'],
	input: $('#to'),

	init: function() {
		this.datalist = $('<datalist/>', {id: 'email-options'}).insertAfter(this.input);
		this.input.attr('list', 'email-options');
		this.input.on('keyup', this.checkValue);
	},

	checkValue: function(e) {
		var code = e.keyCode || e.which;
		if (code == 16) { return; }

		var inp = $(this), val = inp.val();
		var idx = val.indexOf('@');

		if (idx != 0 && idx != -1) {
			val = val.split('@')[0];
			domainSuggester.changeDatalist(val); 
    	} else {
    		domainSuggester.datalist.empty();
    	}
    },

    changeDatalist: function(val) {
    	var dlOptions = this.datalist[0].options;

    	if (dlOptions.length == 0) {
    		var options = '';

    		for (var i = 0; i < this.domains.length; i++) {
    			options += '<option>';
    		}

    		this.datalist.html(options);
    	}

    	for (var i = 0; i < this.domains.length; i++) {
    		if (this.input.val().includes(this.domains[i])) {
    			domainSuggester.datalist.empty();
    			return;
    		}
    	}

    	for (var i = 0; i < dlOptions.length; i++) {
    		dlOptions[i].value = val + '@' + this.domains[i];
    	}
    }
}

domainSuggester.init();

$('#contact-form').validate({
	rules: {
		name: {
			required: true
		},
		email: {
			required: true,
			email: true
		},
		message: {
			required: true
		}
	},
	submitHandler: function(form) {
		var name = $('#contact-name').val();
		var email = $('#contact-email').val();
		var text = $('#contact-text').val();

		$.ajax({url: '/api/contact_us', type: 'POST', datatype: 'json', data: {name: name, email: email, text: text}}).done(function(j) {
			if (j.result) {
				showAlert('message_successfully_sent', null, true);
				form.reset();
			} else {
				showAlert('error_sending_data');
			}
		}).fail(function() {
			showAlert('error_sending_data');
		});
	},
	highlight: function(e, errClass) {
		$(e).addClass('invalid');
	},
	unhighlight: function(e, errClass) {
		$(e).removeClass('invalid');
	}
});
