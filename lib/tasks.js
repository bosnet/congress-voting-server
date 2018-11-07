const { Proposal } = require('../models/index');
const {
  newClient,
  loadHosts,
} = require('./sebak');

async function saveProposalsTask({ proposerAddress }) {
  const client = await loadHosts().then(newClient);
  const res = await client.get(`/api/v1/accounts/${proposerAddress}/operations`);
  const { records } = res.body._embedded; // eslint-disable-line no-underscore-dangle

  console.log(records);
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
  saveProposalsTask,
  reportVotingResultTask,
  confirmVotingResultTask,
};
