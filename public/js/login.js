const $ = require('jquery');
const { getPublicAddress, sign } = require('sebakjs-util');

let keyType = 'seed';

function toggleKeyType(t) {
  if (t === 'recovery') {
    keyType = 'recovery';
    $('#type').html('Recovery Key');
  } else {
    keyType = 'seed';
    $('#type').html('Secret Seed');
  }
}

$('#key').keyup(function keyup() {
  const input = $(this).val();
  if (input.indexOf('BOS') === 0) { // recovery key
    toggleKeyType('recovery');
  } else {
    toggleKeyType('seed');
  }
});

$('#login').submit((event) => {
  event.preventDefault();
  const code = $('#code').val();
  const nonce = $('#nonce').val();

  // TODO: handle error when seed or recovery key is wrong
  const key = $('#key').val();
  if (keyType === 'seed') {
    const address = getPublicAddress(key);
    const signature = sign(code, nonce, key);
    $.post('/login', { signature, address }, (data) => {
      console.log(data);
    });
  }
});
