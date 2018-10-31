const express = require('express');
const createError = require('http-errors');
const { hash, verify } = require('sebakjs-util');

const { Membership } = require('../../models/index');
const { underscored } = require('../utils');
const { getApplicantStatus, getAccessToken } = require('../../lib/sumsub');
const { currentHeight } = require('../../lib/sebak');

const { SEBAK_NETWORKID = 'sebak-test-network' } = process.env;

const router = express.Router();

// create new membership (signature required)
router.post('/memberships', async (req, res, next) => {
  try {
    if (!req.body.data) {
      return next(createError(400, 'there is no data'));
    }

    const [publicAddress, applicantId] = req.body.data;
    if (!publicAddress) {
      return next(createError(400, 'public address is required.'));
    }
    if (!applicantId) {
      return next(createError(400, 'applicant id is required.'));
    }

    // check signature
    const verified = verify(
      hash(req.body.data),
      SEBAK_NETWORKID,
      req.body.signature,
      publicAddress,
    );
    if (!verified) {
      return next(createError(400, 'The signature is invalid.'));
    }

    const m = await Membership.register({
      publicAddress,
      applicantId,
      status: Membership.Status.pending.name,
    }, req.body.signature);
    return res.json(underscored(m.toJSON()));
  } catch (err) {
    return next(err);
  }
});

// callback to get verification result from Sub&Substance
router.post('/memberships/sumsub/callback', async (req, res, next) => {
  try {
    if (req.body.type === 'INSPECTION_REVIEW_COMPLETED') {
      // externalUserId is public address
      const m = await Membership.findByAddress(req.body.externalUserId);
      if (!m) { return res.status(404).json({}); }

      if (req.body.review && req.body.review.reviewAnswer === 'GREEN') {
        // verification passed
        await m.verify();
      } else if (req.body.review && req.body.review.reviewAnswer === 'RED') {
        // verification failed
        await m.reject();
      }
    }

    return res.json({});
  } catch (err) {
    return next(err);
  }
});

// obtain access token from sum&sub
router.get('/memberships/sumsub/access-token/:address', async (req, res, next) => {
  try {
    const token = await getAccessToken(req.params.address);

    return res.json({ data: token });
  } catch (err) {
    return next(err);
  }
});

// find an existing membership
router.get('/memberships/:address', async (req, res, next) => {
  try {
    const m = await Membership.findByAddress(req.params.address);
    if (!m) { return next(createError(404, 'The address does not exist.')); }

    const now = new Date();
    // SUMSUB_RENEW_INTERVAL is msec
    now.setMilliseconds(now.getMilliseconds() - (process.env.SUMSUB_RENEW_INTERVAL || 1));

    if (m.status === Membership.Status.pending.name && m.updatedAt < now) {
      const result = await getApplicantStatus(m.applicantId);
      if (result === 'verified') { await m.verify(); }
      if (result === 'rejected') { await m.reject(); }
      if (result === 'pending') { await m.pend(); }
      await m.reload();
    }

    return res.json(underscored(m.toJSON()));
  } catch (err) {
    return next(err);
  }
});

// delete an existing membership (signature required)
router.delete('/memberships/:address', async (req, res, next) => {
  try {
    const addr = req.params.address;
    const { sig } = req.query;

    const m = await Membership.findByAddress(addr);
    if (!m) { return next(createError(404, 'The address does not exist.')); }

    // check signature

    const verified = verify(hash([addr]), SEBAK_NETWORKID, sig, addr);
    if (!verified) {
      return next(createError(400, 'The signature is invalid.'));
    }

    const height = await currentHeight();
    await m.deactivate(height, sig);
    return res.json(underscored(m.toJSON()));
  } catch (err) {
    return next(err);
  }
});

// activate an existing membership (signature required)
router.post('/memberships/:address/activate', async (req, res, next) => {
  try {
    const m = await Membership.findByAddress(req.params.address);
    if (!m) { return next(createError(404, 'The address does not exist.')); }

    const [publicAddress, freezingHash] = req.body.data;
    if (publicAddress !== req.params.address) {
      return next(createError(400, 'The address does not match.'));
    }

    // check signature
    const verified = verify(
      hash(req.body.data),
      SEBAK_NETWORKID,
      req.body.signature,
      publicAddress,
    );
    if (!verified) {
      return next(createError(400, 'The signature is invalid.'));
    }

    // TODO: should check 10,000 BOS frozen?
    const height = await currentHeight();
    await m.activate(height, req.body.signature);

    if (m.status !== Membership.Status.active.name) {
      return next(createError(400, 'membership status is incorrect.'));
    }

    return res.json(underscored(m.toJSON()));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
