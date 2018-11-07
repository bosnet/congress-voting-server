const YAML = require('yaml');
const { Proposal } = require('../models/index');
const {
  newClient,
  loadHosts,
  newProposal,
} = require('./sebak');

async function newProposalTask(opts) {
  try {
    const res = await newProposal({
      secret: opts.proposerSecret,
      source: opts.proposerAddress,
      contract: opts.contract,
      start: parseInt(opts.votingStart, 10),
      end: parseInt(opts.votingEnd, 10),
    });
    return res.body;
  } catch (e) {
    throw e.response.body;
  }
}
newProposalTask.$name = 'new-proposal';

async function saveProposalsTask({ proposerAddress }) {
  const client = await loadHosts().then(newClient);
  const path = `/api/v1/accounts/${proposerAddress}/operations`;
  const res = await client.get(`${path}?type=congress-voting&reverse=true`);
  const { records } = res.body._embedded; // eslint-disable-line no-underscore-dangle
  const contracts = records.filter(r => r.body && r.body.contract)
    .map(c => ({
      hash: c.hash,
      tx_hash: c.tx_hash,
      contract: Buffer.from(c.body.contract, 'base64').toString(),
      voting: c.body.voting,
    }))
    .map((c) => {
      const docs = YAML.parseAllDocuments(c.contract);
      const meta = docs.filter(d => d.contents.type === 'MAP')
        .map(d => d.contents.toJSON())
        .reduce((a, b) => Object.assign(a, b));
      return Object.assign({ meta }, c);
    });

  console.log(contracts);
  // TODO:
  //   return Proposal.register({
  //     title: prOp.B.title,
  //     code: prOp.B.code,
  //     content: prOp.B.contract,
  //     start: prOp.B.voting.start,
  //     end: prOp.B.voting.end,
  //     hash: p.H.hash,
  //   });
  return '';
}
saveProposalsTask.$name = 'save-proposals';

async function reportVotingResultTask({ height }) {
  const prs = await Proposal.listToReport(height);
  const promises = prs.map((p) => {
    // TODO: make a voting result transaction, including uploading S3
    const proposalId = p.id;
    return `send a requst voting result of ${proposalId}`;
  });
  await Promise.all(promises);
}
reportVotingResultTask.$name = 'report-voting-result';

async function confirmVotingResultTask({ height }) {
  const client = await loadHosts().then(newClient);
  const prs = await Proposal.listToConfirm(height);
  const promises = prs.map((p) => {
    // FIXME: replace with real API
    const h = p.hash;
    return client.get(`/api/v1/transaction/${h}`)
      .then(async (res) => {
        if (res.body) {
          await p.report();
        }
      });
  });

  await Promise.all(promises);
}
confirmVotingResultTask.$name = 'confirm-voting-result';

module.exports = {
  newProposalTask,
  saveProposalsTask,
  reportVotingResultTask,
  confirmVotingResultTask,
};
