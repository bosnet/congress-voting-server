const express = require('express');
const crypto = require('crypto');
const createError = require('http-errors');
const path = require('path');
const { readdirSync } = require('fs');
const randomWord = require('random-word');
const { verify } = require('sebakjs-util');

const { Membership } = require('../../models/index');

const router = express.Router();

const SIGN_NONCE = 'boscoin';
const VANILLA_CLIENT_ID = process.env.VANILLA_CLIENT_ID || '';
const VANILLA_SECRET = process.env.VANILLA_SECRET || '';
const VANILLA_FORUM_URL = 'https://boscoin.vanillacommunity.com/sso?Target=/categories';

const sha256 = str => crypto.createHash('sha256').update(str, 'utf8').digest('hex');

const distDir = path.join(__dirname, '..', '..', 'public', 'dist');

const compiledStaticFiles = readdirSync(distDir);
const staticFiles = {};
compiledStaticFiles
  .filter(f => f.lastIndexOf('.js') === f.length - 3 || f.lastIndexOf('.css') === f.length - 4)
  .forEach((f) => { staticFiles[f.replace(/\..*?\./, '.')] = f; });

router.get('/login', (req, res) => {
  if (req.session.address) {
    return res.redirect(VANILLA_FORUM_URL);
  }
  const loginCode = [1, 2, 3, 4].map(() => randomWord()).join('-');

  req.session.loginCode = loginCode;
  return res.render('login', {
    title: 'login',
    source: req.query.source || '',
    staticFiles,
    loginCode,
    nonce: SIGN_NONCE,
  });
});

router.post('/login', async (req, res, next) => {
  try {
    const m = await Membership.findByAddress(req.body.address);
    if (!m) { return next(createError(404, 'The address does not exist.')); }
    // TODO: check if congress member

    const isValidSignature = verify(
      req.session.loginCode,
      SIGN_NONCE,
      req.body.signature,
      req.body.address,
    );
    if (!isValidSignature) { return next(createError(400, 'Wrong signature')); }

    req.session.address = req.body.address;
    if (req.body.source === 'congress_forum') {
      return res.redirect(VANILLA_FORUM_URL);
    }

    // currently redirect to congress forum because it is only service to use login
    return res.redirect(VANILLA_FORUM_URL);
  } catch (err) {
    return next(err);
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

router.get('/vanilla/authentication', (req, res) => {
  res.type('application/javascript');

  // check parameters
  const callback = req.query.callback || 'callback';
  if (!req.query.client_id) {
    return res.send(`${callback}({"error":"invalid_request","message":"The client_id parameter is missing"})`);
  }
  if (req.query.client_id !== VANILLA_CLIENT_ID) {
    return res.send(`${callback}({"error":"invalid_client","message":"Unknown client"})`);
  }
  if (!req.query.timestamp) {
    return res.send(`${callback}({"name": ""})`);
  }
  if (!req.query.signature) {
    return res.send(`${callback}({"error":"invalid_request","message":"Missing signature parameter"})`);
  }

  // check signature
  const reqSignature = sha256(`${req.query.timestamp}${VANILLA_SECRET}`);
  if (reqSignature !== req.query.signature) {
    return res.send(`${callback}({"error":"access_denied","message":"Signature invalid"})`);
  }

  const addr = req.session.address;
  if (addr) {
    const data = {
      email: `${addr}@boscoin.io`,
      name: addr.substr(0, 7),
      uniqueid: addr,
    };
    const searchParams = new URLSearchParams(data);
    const resSignature = sha256(`${searchParams.toString()}${VANILLA_SECRET}`);

    const jsonpData = Object.assign({}, data, {
      client_id: VANILLA_CLIENT_ID,
      signature: resSignature,
    });

    return res.send(`${callback}(${JSON.stringify(jsonpData)})`);
  }

  return res.send(`${callback}({"name": ""})`);
});

module.exports = router;
