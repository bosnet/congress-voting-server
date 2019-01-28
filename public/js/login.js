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

var $clearBtn = $('.clear');
var $seedOrKey = $('#seed-or-key');
var $keyForm = $('#login .form-item.key');
var $passwordForm = $('#login .form-item.password');
var $passwordInput = $('#login #password');
var $keyFormError = $('#login .form-item.key .error-msg');
var $passwordFormError = $('#login .form-item.password .error-msg');
var $step1 = $('#login .step1');
var $step2 = $('#login .step2');
var $errors = $('#login .errors');

$clearBtn.click(function clickClearBtn() {
  $seedOrKey.val('').focus();
});

let keyType = 'seed';

function toggleKeyType(t) {
  if (t === 'recovery') {
    keyType = 'recovery';
    $keyForm.hide();
    $passwordForm.show();
  } else {
    keyType = 'seed';
    $passwordForm.hide();
    $keyForm.show();
  }
}

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
        location.href = data.redirect_to;
      }
    })
    .fail((xhr, textStatus, errorThrown) => {
      if (errorThrown === 'Not Found') {
        return showError('This is not a Membership Account');
      }
    });
}

$seedOrKey.keyup(function () {
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
      login(source, signature, address);
    } catch(e) {
      if (e.message === 'invalid encoded string') {
        $keyFormError.html('Secret Seed is invalid');
        $keyForm.addClass('error');
      } else {
        throw e;
      }
    }
  } else if (isRecoveryKey(key)) {
    $step1.addClass('hide');
    $step1.removeClass('show');
    $step2.addClass('show');
    $step2.removeClass('hide');
  }
});

$passwordInput.keyup(function () {
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

  const RECOVERY_KEY_PREFIX = 'BOS';
  const RECOVERY_KEY_POSTFIX = 'D1';

  try {
    const data = recoveryKey.substring(3, recoveryKey.length - 2);
    const pwHash = createHash('sha256').update(pw).digest();
    const decipher = createDecipheriv('aes256', pwHash, iv);
    const decrypted = decipher.update(B58.decode(data), 'binary', 'utf8');
    const seed =  decrypted + decipher.final('utf8');

    const source = $('#source').val();
    const address = getPublicAddress(seed);
    const signature = sign(code, nonce, seed);
    console.log(address);
    login(source, signature, address);
  } catch(e) {
    if (e.message === 'unable to decrypt data') {
      $passwordFormError.html('Please check Recovery key or password again');
      $passwordForm.addClass('error');
    } else {
      throw e;
    }
  }
});

$('.visible').click((event) => {
  if ($passwordInput.attr('type') === 'password') {
    $passwordInput.attr('type', 'text');
  } else {
    $passwordInput.attr('type', 'password');
  }
});

$('#login .back-btn').click((event) => {
  $step1.addClass('show');
  $step1.removeClass('hide');
  $step2.addClass('hide');
  $step2.removeClass('show');
});
