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
const {
  VANILLA_CLIENT_ID = '',
  VANILLA_SECRET = '',
  VANILLA_FORUM_URL = '',
  VANILLA_ADMIN_EMAILS: ADMIN_EMAILS = '', // comma separated @boscoin.io emails
  VANILLA_ADMIN_PASSWORD,
} = process.env;
const VANILLA_ADMIN_EMAILS = ADMIN_EMAILS.split(',');

const sha256 = str => crypto.createHash('sha256').update(str, 'utf8').digest('hex');

const distDir = path.join(__dirname, '..', '..', 'public', 'dist');

const compiledStaticFiles = readdirSync(distDir);
const staticFiles = {};
compiledStaticFiles
  .filter(f => f.lastIndexOf('.js') === f.length - 3 || f.lastIndexOf('.css') === f.length - 4)
  .forEach((f) => { staticFiles[f.replace(/\..*?\./, '.')] = f; });

router.get(['/', '/login'], (req, res) => {
  if (req.session.address) {
    return res.redirect(VANILLA_FORUM_URL);
  }
  const loginCode = [1, 2, 3, 4].map(() => randomWord()).join('-');

  req.session.loginCode = loginCode;
  return res.render('login', {
    title: 'BOScoin Congress forum Login',
    source: req.query.source || '',
    staticFiles,
    loginCode,
    nonce: SIGN_NONCE,
  });
});

router.post('/login', async (req, res, next) => {
  try {
    let sessionKey = req.body.address;
    // login as admin
    const isAdmin = VANILLA_ADMIN_EMAILS.includes(sessionKey);
    if (isAdmin) {
      if (VANILLA_ADMIN_PASSWORD && req.body.signature === VANILLA_ADMIN_PASSWORD) {
        sessionKey = sessionKey.replace('@boscoin.io', '');
      } else {
        return next(createError(404, 'The address does not exist.'));
      }
    } else {
      const m = await Membership.findByAddress(sessionKey);
      if (!m || m.status !== Membership.Status.active.name) {
        return next(createError(404, 'The address does not exist.'));
      }

      const isValidSignature = verify(
        req.session.loginCode,
        SIGN_NONCE,
        req.body.signature,
        req.body.address,
      );
      if (!isValidSignature) { return next(createError(400, 'Wrong signature')); }
    }

    req.session.address = sessionKey;
    if (req.body.source === 'congress_forum') {
      if (req.xhr) {
        return res.json({ redirect_to: VANILLA_FORUM_URL });
      }
      return res.redirect(VANILLA_FORUM_URL);
    }

    // currently redirect to congress forum because it is only service to use login
    if (req.xhr) {
      return res.json({ redirect_to: VANILLA_FORUM_URL });
    }
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
