import '../css/login.css';
import '../css/floating-label.scss';

const $ = require('jquery');
require('floating-form-labels');
const { createHash, createDecipheriv } = require('crypto');
const BaseX = require('base-x');
const { getPublicAddress, sign } = require('sebakjs-util');

$('.ffl-wrapper').floatingFormLabels();

const B58 = BaseX('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
const iv = Buffer.from([0x42, 0x4F, 0x53, 0x5F, 0x43, 0x4F, 0x49, 0x4E,
  0x5F, 0x57, 0x41, 0x4C, 0x4C, 0x45, 0x54, 0x53]);

const $clearBtn = $('.clear');
const $seedOrKey = $('#seed-or-key');
const $keyForm = $('#login .form-item.key');
const $passwordForm = $('#login .form-item.password');
const $passwordInput = $('#login #password');
const $keyFormError = $('#login .form-item.key .error-msg');
const $passwordFormError = $('#login .form-item.password .error-msg');
const $step1 = $('#login .step1');
const $step2 = $('#login .step2');
const $errors = $('#login .errors');

$clearBtn.click(() => {
  $seedOrKey.val('').focus();
});

function isRecoveryKey(key) {
  return key.indexOf('BOS') === 0;
}

function showError(msg) {
  $errors.html(msg).addClass('show');
}

function login(source, signature, address) {
  $.post('/login', { source, signature, address })
    .done((data) => {
      if (data && data.redirect_to) {
        window.location.href = data.redirect_to;
      }
    })
    .fail((xhr, textStatus, errorThrown) => {
      if (errorThrown === 'Not Found') {
        return showError('This is not a Membership Account');
      }
      throw errorThrown;
    });
}

$seedOrKey.keydown(() => {
  $keyForm.removeClass('error');

  const input = $(this).val();
  $clearBtn.toggleClass('show', input.length > 0);
});

$('#login-form').submit((event) => {
  event.preventDefault();

  const key = $seedOrKey.val().trim();

  if (key.length < 1) {
    $keyFormError.html('Enter Secret Seed or Recovery Key');
    $keyForm.addClass('error');
    return false;
  }

  const code = $('#code').val();
  const nonce = $('#nonce').val();

  if (!isRecoveryKey(key)) {
    try {
      const address = getPublicAddress(key);
      const signature = sign(code, nonce, key);
      const source = $('#source').val();
      return login(source, signature, address);
    } catch (e) {
      if (e.message === 'invalid encoded string') {
        $keyFormError.html('Secret Seed is invalid');
        $keyForm.addClass('error');
      }
      throw e;
    }
  } else if (isRecoveryKey(key)) {
    $step1.addClass('hide');
    $step1.removeClass('show');
    $step2.addClass('show');
    $step2.removeClass('hide');
    return true;
  }
  return false;
});

$passwordInput.keydown(() => {
  $passwordForm.removeClass('error');
});

$('#password-form').submit((event) => {
  event.preventDefault();

  const recoveryKey = $seedOrKey.val().trim();
  const pw = $passwordInput.val().trim();

  if (pw.length < 1) {
    $passwordFormError.html('Enter your password');
    $passwordForm.addClass('error');
    return false;
  }

  const code = $('#code').val();
  const nonce = $('#nonce').val();

  try {
    const data = recoveryKey.substring(3, recoveryKey.length - 2);
    const pwHash = createHash('sha256').update(pw).digest();
    const decipher = createDecipheriv('aes256', pwHash, iv);
    const decrypted = decipher.update(B58.decode(data), 'binary', 'utf8');
    const seed = decrypted + decipher.final('utf8');

    const source = $('#source').val();
    const address = getPublicAddress(seed);
    const signature = sign(code, nonce, seed);
    return login(source, signature, address);
  } catch (e) {
    if (e.message === 'unable to decrypt data') {
      $passwordFormError.html('Please check Recovery key or password again');
      $passwordForm.addClass('error');
    }
    throw e;
  }
});

$('.visible').click(function visibleClick() {
  if ($passwordInput.attr('type') === 'password') {
    $passwordInput.attr('type', 'text');
    $(this).find('.off').hide();
    $(this).find('.on').show();
  } else {
    $passwordInput.attr('type', 'password');
    $(this).find('.on').hide();
    $(this).find('.off').show();
  }
});

$('#login .back-btn').click(() => {
  $step1.addClass('show');
  $step1.removeClass('hide');
  $step2.addClass('hide');
  $step2.removeClass('show');
});
