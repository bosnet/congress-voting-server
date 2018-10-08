const express = require('express');
const createError = require('http-errors');

const { Proposal } = require('../../models/index');
const { underscored } = require('../utils');
const { saveProposals } = require('../../lib/sebak');

const router = express.Router();

// fetch proposals and save them
setTimeout(() => {
  setInterval(async () => {
    // FIXME: fix handle errors
    await saveProposals();
  }, parseInt(process.env.FETCH_INTERVAL, 10));
}, parseInt(process.env.FETCH_INTERVAL, 10) * Math.random());

// proposal list
router.get('/proposals', async (req, res) => {
  const prs = await Proposal.list();
  const result = prs.map(p => underscored(p.toJSON()));

  return res.json({
    data: result,
  });
});

// proposal detail
router.get('/proposals/:id', async (req, res, next) => {
  const pr = await Proposal.findById(req.params.id);
  if (!pr) { return next(createError(404, 'The proposal id does not exist.')); }

  return res.json({
    data: underscored(pr.toJSON()),
  });
});

module.exports = router;
