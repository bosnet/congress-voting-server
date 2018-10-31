const express = require('express');
const createError = require('http-errors');
const { hash, verify } = require('sebakjs-util');

const { Proposal, Vote } = require('../../models/index');
const { underscored } = require('../utils');
const {
  saveProposals,
  currentHeight,
  reportVotingResult,
  confirmVotingResult,
} = require('../../lib/sebak');

const { SEBAK_NETWORKID = 'sebak-test-network' } = process.env;

const router = express.Router();

// fetch proposals and save them
setTimeout(() => {
  setInterval(async () => {
    // FIXME: fix handle errors
    // TODO: integrate with sebak
    await saveProposals();
    await reportVotingResult();
    await confirmVotingResult();
  }, parseInt(process.env.FETCH_INTERVAL, 10));
}, parseInt(process.env.FETCH_INTERVAL, 10) * Math.random());

// proposal list
router.get('/proposals', async (req, res, next) => {
  try {
    const prs = await Proposal.list();
    const result = prs.map(p => underscored(p.toJSON()));

    return res.json({
      data: result,
    });
  } catch (err) {
    return next(err);
  }
});

// proposal detail
router.get('/proposals/:id', async (req, res, next) => {
  try {
    const pr = await Proposal.findById(req.params.id);
    if (!pr) { return next(createError(404, 'The proposal id does not exist.')); }

    return res.json({
      data: underscored(pr.toJSON()),
    });
  } catch (err) {
    return next(err);
  }
});

// vote to a proposal(with signature)
router.post('/proposals/:id/vote', async (req, res, next) => {
  try {
    const [publicAddress, proposalId, answer] = req.body.data;
    if (parseInt(req.params.id, 10) !== proposalId) {
      return next(createError(400, 'The proposal id does not match.'));
    }

    const pr = await Proposal.findById(req.params.id);
    if (!pr) { return next(createError(404, 'The proposal id does not exist.')); }

    const height = await currentHeight();
    if (height < pr.start || pr.end < height) {
      return next(createError(400, 'The proposal is not opened.'));
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

    const v = await Vote.register({
      proposalId: pr.id,
      publicAddress,
      answer,
    });

    return res.json({
      data: underscored(v.toJSON()),
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
