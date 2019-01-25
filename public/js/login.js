import '../css/login.css';
import '../css/floating-label.scss';

const $ = require('jquery');
require('floating-form-labels');
const { getPublicAddress, sign } = require('sebakjs-util');

$('.ffl-wrapper').floatingFormLabels();

var $clearBtn = $('.clear');
var $seedOrKey = $('#seed-or-key');
var $keyForm = $('#login .form-item.key');
var $passwordForm = $('#login .form-item.password');
var $keyFormError = $('#login .form-item.key .error-msg');
var $passwordFormError = $('#login .form-item.password .error-msg');
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

$seedOrKey.keyup(function () {
  $keyForm.removeClass('error');

  const input = $(this).val();
  $clearBtn.toggleClass('show', input.length > 0);
});

$('#login-form').submit((event) => {
  event.preventDefault();

  let key = $seedOrKey.val().trim();

  if (key.length < 1) {
    $keyFormError.html('Enter Secret Seed or Recovery Key');
    $keyForm.addClass('error');
    return false;
  }

  const code = $('#code').val();
  const nonce = $('#nonce').val();

  // TODO: handle error when seed or recovery key is wrong
  if (!isRecoveryKey(key)) {
    try {
      const address = getPublicAddress(key);
      const signature = sign(code, nonce, key);
      const source = $('#source').val();
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
    } catch(e) {
      if (e.message === 'invalid encoded string') {
        $keyFormError.html('Secret Seed is invalid');
        $keyForm.addClass('error');
      } else {
        throw e;
      }
    }
  } else if (isRecoveryKey(key)) {
    // const RECOVERY_KEY_PREFIX = 'BOS';
    // const RECOVERY_KEY_POSTFIX = 'D1';
    //
    // const data = encoded.substring(3, key.length - 2);
    // const decipher = crypto.createDecipheriv('aes256', this.createKey(passphrase), iv);
    // const decrypted = decipher.update(B58.decode(data), 'binary', 'utf8');
    // return decrypted + decipher.final('utf8');

  }
});
