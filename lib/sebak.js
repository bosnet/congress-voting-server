const got = require('got');
const url = require('url');
const { hash, sign } = require('sebakjs-util');
const moment = require('moment');
const debug = require('debug')('voting:lib:sebak');

const { SEBAK_URL, SEBAK_NETWORKID } = process.env;
const { protocol, hostname, port } = url.parse(SEBAK_URL);

const TRANSACTION_VERSION = '1';

const newClient = () => got.extend({
  baseUrl: `${protocol}//${hostname}:${port}`,
  json: true,
});

const loadHosts = () => Promise.resolve();

const currentHeight = async () => {
  const client = await loadHosts().then(newClient);
  const res = await client.get('/');
  debug('currentHeight %o', res.body);
  return res.body.block.height;
};

const getAccount = async (address) => {
  const client = await loadHosts().then(newClient);
  const res = await client.get(`/api/v1/accounts/${address}`);
  debug('getAccount %o', res.body);
  return res.body;
};

const getFrozenAccounts = async (address) => {
  const client = await loadHosts().then(newClient);
  const res = await client.get(`/api/v1/accounts/${address}/frozen-accounts`);
  debug('getFrozenAccounts %o', res.body);
  return res.body;
};

const getTransaction = async (h) => {
  const client = await loadHosts().then(newClient);
  const res = client.get(`/api/v1/transactions/${h}`);
  debug('getTransaction %s %o', h, res.body);
  return res.body;
};

const getTransactions = async (hs) => {
  const client = await loadHosts().then(newClient);
  return Promise.all(
    hs.map(h => client.get(`/api/v1/transactions/${h}`).then(r => r.body)),
  );
};

const newTxHeader = signature => ({
  version: TRANSACTION_VERSION,
  created: moment().format('YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ'),
  signature,
});
const newTxBody = (source, seqId, operations) => ({
  source,
  fee: (operations.length * 10000).toString(),
  sequence_id: seqId,
  operations,
});
const newOpHeader = type => ({ type });
const newRlpBody = (source, seqId, ops) => [source, (ops.length * 10000).toString(), seqId, ops];

const newProposal = async (opts) => {
  const {
    source, secret, contract, start, end, funding_address, amount, // eslint-disable-line camelcase
  } = opts;
  const account = await getAccount(source);

  const type = 'congress-voting';
  const base64Contract = Buffer.from(contract).toString('base64');
  const body = newRlpBody(source, account.sequence_id, [
    [
      [type],
      [
        base64Contract,
        [start, end],
        funding_address, // eslint-disable-line camelcase
        amount.toString(),
      ],
    ],
  ]);

  const txHash = hash(body);
  const payload = {
    H: newTxHeader(sign(txHash, SEBAK_NETWORKID, secret)),
    B: newTxBody(source, account.sequence_id, [
      {
        H: newOpHeader(type),
        B: {
          contract: base64Contract,
          voting: { start, end },
          funding_address,
          amount: amount.toString(),
        },
      },
    ]),
  };

  const client = await loadHosts().then(newClient);
  const res = await client.post('/api/v1/transactions', {
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return res;
};

const newVotingResult = async (opts) => {
  const { source, secret, operations } = opts;
  const account = await getAccount(source);

  const type = 'congress-voting-result';
  const body = newRlpBody(
    source,
    account.sequence_id,
    operations.map(o => [
      [type],
      [
        [o.ballotStampsHash, o.ballotStampsUrls],
        [o.votersHash, o.votersUrls],
        [o.result.count, o.result.yes, o.result.no, o.result.abs],
        o.congressVotingHash,
        [o.membershipHash, o.membershipUrls],
      ],
    ]),
  );

  const txHash = hash(body);
  const payload = {
    H: newTxHeader(sign(txHash, SEBAK_NETWORKID, secret)),
    B: newTxBody(
      source,
      account.sequence_id,
      operations.map(o => ({
        H: newOpHeader(type),
        B: {
          ballot_stamps: {
            hash: o.ballotStampsHash,
            urls: o.ballotStampsUrls,
          },
          voters: {
            hash: o.votersHash,
            urls: o.votersUrls,
          },
          result: {
            count: o.result.count,
            yes: o.result.yes,
            no: o.result.no,
            abs: o.result.abs,
          },
          congress_voting_hash: o.congressVotingHash,
          membership: {
            hash: o.membershipHash,
            urls: o.membershipUrls,
          },
        },
      })),
    ),
  };

  const client = await loadHosts().then(newClient);
  const res = await client.post('/api/v1/transactions', {
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return res;
};

module.exports = {
  newClient,
  loadHosts,
  currentHeight,
  getAccount,
  getFrozenAccounts,
  getTransaction,
  getTransactions,
  newProposal,
  newVotingResult,
};
