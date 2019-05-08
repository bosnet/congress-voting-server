/* eslint-disable no-console */
const AWS = require('aws-sdk');
const { join } = require('path');
const fs = require('fs');
const { promisify } = require('util');
const yaml = require('js-yaml');
const { hash } = require('sebakjs-util');

const readFile = promisify(fs.readFile);

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
s3.upload = promisify(s3.putObject);

const {
  sequelize,
  Membership,
  Proposal,
  Vote,
} = require('../models/index');
const {
  newClient,
  loadHosts,
  newProposal,
  getTransaction,
  newVotingResult,
} = require('./sebak');

async function newProposalTask(opts) {
  if (!opts.height) { throw new Error('Sebak\'s current block height is missing'); }
  if (!opts.proposerSecret) { throw new Error('SEBAK_PROPOSER_SECRET is missing'); }
  if (!opts.proposerAddress) { throw new Error('SEBAK_PROPOSER_ADDRESS is missing'); }
  if (!opts.sequenceId) { throw new Error('SEBAK_SEQUENCE_ID is missing'); }
  if (!opts.contractPath) { throw new Error('SEBAK_CONTRACT_PATH is missing'); }
  if (!opts.votingStart || Number.isNaN(opts.votingStart)) { throw new Error('SEBAK_VOTING_START is missing'); }
  if (!opts.votingEnd || Number.isNaN(opts.votingEnd)) { throw new Error('SEBAK_VOTING_END is missing'); }

  const contractPath = join(__dirname, '../', opts.contractPath);
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
      sequence_id: parseInt(opts.sequenceId, 10),
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
  'SEBAK_SEQUENCE_ID',
  'SEBAK_VOTING_START',
  'SEBAK_VOTING_END',
  'SEBAK_CONTRACT_PATH',
];

async function saveProposalsTask({ proposerAddress }) {
  if (!proposerAddress) { throw new Error('SEBAK_PROPOSER_ADDRESS is missing'); }

  const client = await loadHosts().then(newClient);
  const path = `/api/v1/accounts/${proposerAddress}/operations`;
  const res = await client.get(`${path}?type=congress-voting&reverse=true`);
  const { records } = res.body._embedded; // eslint-disable-line no-underscore-dangle
  const contracts = records.filter(r => r.body && r.body.contract)
    .map((c) => {
      const url = c._links.self.href; // eslint-disable-line no-underscore-dangle
      const opIndex = url.substr(url.lastIndexOf('/') + 1);
      const opHash = `${c.tx_hash}-${opIndex}`;
      return {
        opHash,
        txHash: c.tx_hash,
        contract: Buffer.from(c.body.contract, 'base64').toString(),
        voting: c.body.voting,
        fundingAddress: c.body.funding_address,
        amount: c.body.amount,
      };
    })
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
    conditionRatio: c.meta.execution_condition_ratio,
  })));
}
saveProposalsTask.$name = 'save-proposals';
saveProposalsTask.$args = [
  'SEBAK_PROPOSER_ADDRESS',
];

const uploadResult = async (storages, type, opHash, data) => {
  // TODO: currently only support S3
  const path = `${opHash}/${type}`;

  const promises = storages.map(async (s) => {
    const result = await s3.upload({
      Bucket: s.bucket,
      Key: path,
      Body: data,
      ACL: 'public-read',
      ContentType: 'text/plain',
    });

    console.log(`${`upload ${type}`.padStart(20, ' ')} = ${result.ETag ? 'success' : 'failed'}`);
    if (result.ETag) {
      console.log(`${`${type} url`.padStart(20, ' ')} = ${s.url}/${path}`);
    }

    return { url: s.url, path };
  });

  const results = await Promise.all(promises);
  console.log(`${'saved proposals'.padStart(20, ' ')} = ${results.length}`);
  return results;
};

const makeVotingResult = async (pr, rawMemberships, storages) => {
  console.log(`\n------voting result(hash: ${pr.opHash})-------`);

  // get all memberships
  const members = rawMemberships.map(m => m.publicAddress);
  const membersData = Buffer.from(members.join('\n'));
  const membersHash = hash(membersData);
  console.log(`${'membership count'.padStart(20, ' ')} = ${members.length}`);
  // TODO: check all memberships still has frozen accounts

  // get all voters
  const rawVoters = await Vote.findByProposalId(pr.id);
  const voters = rawVoters.map(v => v.publicAddress);
  const votersData = Buffer.from(voters.join('\n'));
  const votersHash = hash(votersData);
  console.log(`${'voters count'.padStart(20, ' ')} = ${voters.length}`);

  // make ballotstamps to let users are able to check if their vote is included
  const ballots = rawVoters.map(v => hash(pr.opHash + v.publicAddress + v.ballot + v.answer));
  const ballotsData = Buffer.from(ballots.join('\n'));
  const ballotsHash = hash(ballotsData);
  console.log(`${'ballotStamps count'.padStart(20, ' ')} = ${ballots.length}`);

  // aggregate vote answers
  const votingResults = rawVoters.reduce((accum, cur) => {
    accum[cur.answer] += 1; // eslint-disable-line no-param-reassign
    return accum;
  }, { yes: 0, no: 0, abs: 0 });
  votingResults.count = members.length;
  console.log(`${'answer:count'.padStart(20, ' ')} = ${votingResults.count}`);
  console.log(`${'answer:yes'.padStart(20, ' ')} = ${votingResults.yes}`);
  console.log(`${'answer:no'.padStart(20, ' ')} = ${votingResults.no}`);
  console.log(`${'answer:abs'.padStart(20, ' ')} = ${votingResults.abs}`);

  // upload result onto S3
  const membersUploadResult = await uploadResult(storages, 'membership', pr.opHash, membersData);
  const ballotsUploadResult = await uploadResult(storages, 'ballotstamps', pr.opHash, ballotsData);
  const votersUploadResult = await uploadResult(storages, 'voters', pr.opHash, votersData);

  // save result in db
  await pr.report({
    membershipHash: membersHash,
    membershipUrls: membersUploadResult.map(o => `${o.url}/${o.path}`).join(','),
    votersHash,
    votersUrls: votersUploadResult.map(o => `${o.url}/${o.path}`).join(','),
    ballotHash: ballotsHash,
    ballotUrls: ballotsUploadResult.map(o => `${o.url}/${o.path}`).join(','),
    count: votingResults.count,
    yes: votingResults.yes,
    no: votingResults.no,
    abs: votingResults.abs,
  });
  console.log('saved voting result in database');

  return {
    ballotStampsHash: ballotsHash,
    ballotStampsUrls: ballotsUploadResult.map(o => `${o.url}/${o.path}`),
    votersHash,
    votersUrls: votersUploadResult.map(o => `${o.url}/${o.path}`),
    membershipHash: membersHash,
    membershipUrls: membersUploadResult.map(o => `${o.url}/${o.path}`),
    result: votingResults,
    congressVotingHash: pr.opHash,
  };
};

async function confirmVotingResult(height, proposerAddress) {
  const prs = await Proposal.listToConfirm(height);
  console.log('\n-----------------------------------------------');
  console.log(`\n-- confirmVotingResult: ${prs.length} ---`);
  console.log('\n-----------------------------------------------');

  const client = await loadHosts().then(newClient);
  const path = `/api/v1/accounts/${proposerAddress}/operations`;
  const res = await client.get(`${path}?type=congress-voting-result&reverse=true`);
  let { records } = res.body._embedded; // eslint-disable-line no-underscore-dangle

  if (!records) {
    records = [];
  }

  const confirmedResults = prs.filter(p => records.some(
    r => r.body.congress_voting_hash === p.opHash,
  ));
  const unconfirmedResults = prs.filter(p => !records.some(
    r => r.body.congress_voting_hash === p.opHash,
  ));

  // update them as confirmed in database
  const promises = confirmedResults.map(r => r.confirmReport());
  await Promise.all(promises);
  console.log(`${'confirmed count'.padStart(20, ' ')} = ${confirmedResults.length}`);
  console.log(`${'unconfirmed count'.padStart(20, ' ')} = ${unconfirmedResults.length}`);

  // return voting result to send tx into sebak again
  return unconfirmedResults.map(r => ({
    ballotStampsHash: r.resultBallotHash,
    ballotStampsUrls: r.resultBallotUrls.split(','),
    votersHash: r.resultVotersHash,
    votersUrls: r.resultVotersUrls.split(','),
    membershipHash: r.resultMembershipHash,
    membershipUrls: r.resultMembershipUrls.split(','),
    result: {
      count: r.resultCount,
      yes: r.resultYes,
      no: r.resultNo,
      abs: r.resultAbs,
    },
    congressVotingHash: r.opHash,
  }));
}

async function reportVotingResultTask(opts) {
  if (!opts.proposerAddress) { throw new Error('SEBAK_PROPOSER_ADDRESS is missing'); }
  if (!opts.proposerSecret) { throw new Error('SEBAK_PROPOSER_SECRET is missing'); }
  if (!opts.sequenceId) { throw new Error('SEBAK_SEQUENCE_ID is missing'); }
  if (!opts.votingResultStorages) { throw new Error('SEBAK_VOTING_RESULT_STORAGES is missing'); }
  if (!opts.height) { throw new Error('Sebak\'s current block height is missing'); }

  if (!process.env.AWS_ACCESS_KEY_ID) { throw new Error('AWS_ACCESS_KEY_ID is missing'); }
  if (!process.env.AWS_SECRET_ACCESS_KEY) { throw new Error('AWS_SECRET_ACCESS_KEY is missing'); }

  let storages;
  try {
    const storageList = opts.votingResultStorages.split(',');
    storages = storageList.map((s) => {
      const splitted = s.split('|');
      if (splitted.length !== 3) { throw new Error(); }
      return {
        type: splitted[0],
        url: splitted[1],
        bucket: splitted[2],
      };
    });

    if (storages.length < 1) { throw new Error(); }
  } catch (e) {
    throw new Error('SEBAK_VOTING_RESULT_STORAGES is wrong format');
  }

  const operations = await confirmVotingResult(opts.height, opts.proposerAddress);

  const prs = await Proposal.listToReport(opts.height);
  console.log('\n-----------------------------------------------');
  console.log(`\n-- total proposals to report: ${prs.length} ---`);
  console.log('\n-----------------------------------------------');
  const rawMemberships = await Membership.findActiveMembers();

  // make voting result
  const iter = (idx) => {
    if (idx > prs.length - 1) { return Promise.resolve(); }

    const pr = prs[idx];
    return makeVotingResult(pr, rawMemberships, storages)
      .then((op) => {
        operations.push(op);
        return iter(idx + 1);
      });
  };
  await iter(0);

  // send tx
  if (operations.length > 0) {
    const res = await newVotingResult({
      secret: opts.proposerSecret,
      source: opts.proposerAddress,
      sequence_id: parseInt(opts.sequenceId, 10),
      operations,
    });

    console.log(`sent voting result into sebak -> ${res.body.status}`);
    console.log(`${'operation count'.padStart(20, ' ')} = ${operations.length}`);
  }
}
reportVotingResultTask.$name = 'report-voting-result';
reportVotingResultTask.$args = [
  'SEBAK_PROPOSER_ADDRESS',
  'SEBAK_PROPOSER_SECRET',
  'SEBAK_SEQUENCE_ID',
  'SEBAK_VOTING_RESULT_STORAGES',
];

async function aggregatePF00CandidatesTask({ startDate }) {
  if (!startDate) { throw new Error('SEBAK_START_DATE is missing'); }

  const activeRows = await sequelize.query(
    'SELECT '
    + 'members."publicAddress" AS address, members.status AS status, log."createdAt" AS "createdAt" '
    + 'FROM memberships AS members '
    + 'INNER JOIN ( '
    + '  SELECT "membershipId", min("createdAt") AS "createdAt" '
    + '  FROM memberships_log '
    + '  WHERE status = \'verified\' '
    + '  GROUP BY "membershipId" '
    + ') AS log '
    + 'ON members.id = log."membershipId" '
    + 'WHERE (members.status = \'active\' OR members.status = \'verified\') ',
  );

  // pre-members
  const start = new Date(startDate);
  const activeMembers = activeRows[1].rows.map((r) => {
    const d = r.createdAt > start ? r.createdAt : start;
    return [r.address, d.toISOString()];
  });

  // TODO: next time this should be re-checked if data is correct
  const deactiveRows = await sequelize.query(
    'SELECT '
    + 'log."publicAddress" AS address, '
    + 'min(log."createdAt") AS "verifiedAt", log2."createdAt" AS "deletedAt" '
    + 'FROM memberships_log AS log '
    + 'INNER JOIN ( '
    + 'SELECT "membershipId", status, "createdAt" '
    + 'FROM memberships_log '
    + 'WHERE status = \'deleted\' '
    + ') AS log2 '
    + 'ON log."membershipId" = log2."membershipId" '
    + `WHERE log.status = 'verified' AND log2."createdAt" >= '${startDate}'`
    + `GROUP BY log."publicAddress", log."membershipId", log2."createdAt"`,
  );
  const deactiveMembers = deactiveRows[1].rows.map(r => [
    r.address,
    r.verifiedAt.toISOString(),
    r.deletedAt.toISOString(),
  ]);

  const result = activeMembers.concat(deactiveMembers);
  const csvData = result.map(m => m.join(','));
  csvData.splice(0, 0, 'address,premembership,deleted');
  fs.writeFileSync('premembers.csv', csvData.join('\n'));
}
aggregatePF00CandidatesTask.$name = 'aggregate-pf00-candidates';
aggregatePF00CandidatesTask.$args = [
  'SEBAK_START_DATE',
];

module.exports = {
  newProposalTask,
  saveProposalsTask,
  reportVotingResultTask,
  aggregatePF00CandidatesTask,
};
