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
  getTransaction,
} = require('./sebak');

async function newProposalTask(opts) {
  debug('newProposalTask %o', opts);

  if (!opts.height) { throw new Error('Sebak\'s current block height is missing'); }
  if (!opts.proposerSecret) { throw new Error('SEBAK_PROPOSER_SECRET is missing'); }
  if (!opts.proposerAddress) { throw new Error('SEBAK_PROPOSER_ADDRESS is missing'); }
  if (!opts.contractPath) { throw new Error('SEBAK_CONTRACT_PATH is missing'); }
  if (!opts.votingStart || Number.isNaN(opts.votingStart)) { throw new Error('SEBAK_VOTING_START is missing'); }
  if (!opts.votingEnd || Number.isNaN(opts.votingEnd)) { throw new Error('SEBAK_VOTING_END is missing'); }

  const contractPath = join(__dirname, opts.contractPath);
  const contract = await readFile(contractPath, 'utf8');

  try {
    // validate YAML
    const docs = yaml.safeLoadAll(contract);
    const meta = docs.filter(d => d.type === 'meta')[0];

    if (!meta) { throw new Error('meta type document is missing'); }
    if (!meta.title) { throw new Error('title is missing'); }
    if (!meta.id) { throw new Error('id is missing'); }
    if (!meta.pf_budget_account) { throw new Error('pf_budget_account is missing'); }
    if (!meta.amount_of_issuance) { throw new Error('amount_of_issuance is missing'); }
    if (!meta.execution_condition_ratio) { throw new Error('execution_condition_ratio is missing'); }

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
      opHash: c.hash,
      txHash: c.tx_hash,
      contract: Buffer.from(c.body.contract, 'base64').toString(),
      voting: c.body.voting,
      fundingAddress: c.body.funding_address,
      amount: c.body.amount,
    }))
    .map((c) => {
      const docs = yaml.safeLoadAll(c.contract);
      const meta = docs.filter(d => d.type === 'meta');
      if (meta.length > 0) {
        c.meta = meta[0]; // eslint-disable-line
      }
      return c;
    });

  const promises = contracts.map(c => getTransaction(c.txHash)
    .then((t) => {
      c.blockHash = t.block; // eslint-disable-line no-param-reassign
    }));

  await Promise.all(promises);

  return Promise.all(contracts.map(c => Proposal.register({
    title: c.meta.title,
    code: c.meta.id,
    content: c.contract,
    start: c.voting.start,
    end: c.voting.end,
    opHash: c.opHash,
    txHash: c.txHash,
    blockHash: c.blockHash,
    proposerAddress: c.meta.proposer_account || '',
    fundingAddress: c.fundingAddress,
    amount: c.amount,
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
