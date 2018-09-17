const express = require('express');
const createError = require('http-errors');

const { Membership } = require('../../models/index');
const { underscored } = require('../utils');

const router = express.Router();

// create new membership
router.post('/memberships', async (req, res, next) => {
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

// find an existing membership
router.get('/memberships/:address', async (req, res) => {
  const m = await Membership.findByAddress(req.params.address);
  return res.json(underscored(m.toJSON()));
});

// delete an existing membership
router.delete('/memberships/:address', async (req, res, next) => {
  const m = await Membership.findByAddress(req.params.address);
  if (!m) { return next(createError(404, 'The address does not exist.')); }

  await m.deactivate();
  return res.json(underscored(m.toJSON()));
});


module.exports = router;
