const { join } = require('path');
const fs = require('fs');
const { promisify } = require('util');
const yaml = require('js-yaml');
const debug = require('debug')('voting:tasks');

const readFile = promisify(fs.readFile);

const { Proposal } = require('../models/index');
const {
  newClient,
  loadHosts,
  newProposal,
  getTransactions,
} = require('./sebak');

async function newProposalTask(opts) {
  debug('newProposalTask %o', opts);

  if (!opts.height) { throw new Error('Sebak\'s current block height is missing'); }
  if (!opts.proposerSecret) { throw new Error('SEBAK_PROPOSER_SECRET is missing'); }
  if (!opts.proposerAddress) { throw new Error('SEBAK_PROPOSER_ADDRESS is missing'); }
  if (!opts.contractPath) { throw new Error('SEBAK_CONTRACT_PATH is missing'); }
  if (!opts.votingStart || isNaN(opts.votingStart)) { throw new Error('SEBAK_VOTING_START is missing'); }
  if (!opts.votingEnd || isNaN(opts.votingEnd)) { throw new Error('SEBAK_VOTING_END is missing'); }

  const contractPath = join(__dirname, opts.contractPath);
  const contract = await readFile(contractPath, 'utf8');

  try {
    // validate YAML
    const docs = yaml.safeLoadAll(contract);
    const meta = docs.filter(d => d.type === 'meta')[0];

    if (!meta) { throw new Error('meta type document is missing')}
    if (!meta.title) { throw new Error('title is missing')}
    if (!meta.id) { throw new Error('id is missing')}
    if (!meta.pf_budget_account) { throw new Error('pf_budget_account is missing')}
    if (!meta.amount_of_issuance) { throw new Error('amount_of_issuance is missing')}

    // send tx
    const res = await newProposal({
      secret: opts.proposerSecret,
      source: opts.proposerAddress,
      contract,
      start: parseInt(opts.votingStart, 10),
      end: parseInt(opts.votingEnd, 10),
      funding_address: meta.pf_budget_account,
      amount: meta.amount_of_issuance,
    });

    return res.body;
  } catch (err) {
    if (err.name === 'YAMLException') {
      throw new Error(err.message);
    }
    throw err;
  }
}
newProposalTask.$name = 'new-proposal';
newProposalTask.$args = [
  'SEBAK_PROPOSER_SECRET',
  'SEBAK_PROPOSER_ADDRESS',
  'SEBAK_VOTING_START',
  'SEBAK_VOTING_END',
  'SEBAK_CONTRACT_PATH',
];

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

  const txMap = {};
  const txs = await getTransactions(contracts.map(c => c.tx_hash));
  txs.forEach((tx) => {
    txMap[tx.hash] = tx;
  });

  return Promise.all(contracts.map(c => Proposal.register({
    code: c.meta.code,
    title: c.meta.title,
    content: c.contract,
    start: c.voting.start,
    end: c.voting.end,
    hash: c.hash,
    txHash: c.tx_hash,
    proposerAddress: c.proposer && c.proposer.address ? c.proposer.address : '',
    blockHeight: 0, // TODO: set block height ( txMap[c.tx_hash].height )
  })));
}
saveProposalsTask.$name = 'save-proposals';
newProposalTask.$args = [
  'SEBAK_PROPOSER_ADDRESS',
];

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
