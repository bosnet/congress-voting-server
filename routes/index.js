const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    sebak: process.env.SEBAK_URL,
    'sebak-network-id': process.env.SEBAK_NETWORKID,
    'sumnsub-url': process.env.SUMSUB_HOST,
    'sumnsub-renew-interval': process.env.SUMSUB_RENEW_INTERVAL,
    'congress-voting-account': process.env.CONGRESS_VOTING_ACCOUNT,
  });
});

module.exports = router;
