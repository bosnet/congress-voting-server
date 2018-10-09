const express = require('express');
const createError = require('http-errors');

const { Membership } = require('../../models/index');
const { underscored } = require('../utils');
const { getApplicantStatus } = require('../../lib/sumsub');

const router = express.Router();

// create new membership (signature required)
router.post('/memberships', async (req, res, next) => {
  // TODO: auth check
  if (!req.body.public_address) {
    return next(createError(400, 'public_address is required.'));
  }
  if (!req.body.applicant_id) {
    return next(createError(400, 'applicant_id is required.'));
  }

  const m = await Membership.register({
    publicAddress: req.body.public_address,
    applicantId: req.body.applicant_id,
    status: Membership.Status.pending.name,
  });
  return res.json(underscored(m.toJSON()));
});

// callback to get verification result from Sub&Substance
router.post('/memberships/sumsub/callback', async (req, res) => {
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
});

// find an existing membership
router.get('/memberships/:address', async (req, res, next) => {
  const m = await Membership.findByAddress(req.params.address);
  if (!m) { return next(createError(404, 'The address does not exist.')); }

  const now = new Date();
  // SUMSUB_RENEW_INTERVAL is msec
  now.setMilliseconds(now.getMilliseconds() + (process.env.SUMSUB_RENEW_INTERVAL || 1));

  if (m.status === Membership.Status.pending.name && m.updatedAt < now) {
    const result = await getApplicantStatus(m.applicantId);
    if (result === 'verified') { await m.verify(); }
    if (result === 'rejected') { await m.reject(); }
    if (result === 'pending') { await m.pend(); }
    await m.reload();
  }

  return res.json(underscored(m.toJSON()));
});

// delete an existing membership (signature required)
router.delete('/memberships/:address', async (req, res, next) => {
  // TODO: auth check
  const m = await Membership.findByAddress(req.params.address);
  if (!m) { return next(createError(404, 'The address does not exist.')); }

  await m.deactivate();
  return res.json(underscored(m.toJSON()));
});

// activate an existing membership (signature required)
router.post('/memberships/:address/activate', async (req, res, next) => {
  // TODO: auth check
  // 투표가 있으면 탈퇴를 막아야 한다
  if (!req.body.is_agree_delegation) {
    return next(createError(400, 'is_agree_delegation is required.'));
  }

  const m = await Membership.findByAddress(req.params.address);
  if (!m) { return next(createError(404, 'The address does not exist.')); }

  await m.activate();

  if (m.status !== Membership.Status.active.name) {
    return next(createError(400, 'membership status is incorrect.'));
  }

  return res.json(underscored(m.toJSON()));
});

module.exports = router;
