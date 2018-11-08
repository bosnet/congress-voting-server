const dns = require('dns');
const got = require('got');
const url = require('url');
const { hash, sign } = require('sebakjs-util');
const moment = require('moment');

const { SEBAK_URL } = process.env;
const { protocol, hostname, port } = url.parse(SEBAK_URL);
const clients = {};

const newClient = (hosts) => {
  const host = hosts[Math.floor(Math.random() * hosts.length)];
  if (!clients[host]) {
    clients[host] = got.extend({
      baseUrl: `${protocol}//${host}:${port}`,
      json: true,
    });
  }
  return clients[host];
};

const loadHosts = () => new Promise((resolve, reject) => dns.lookup(hostname, { all: true },
  (e, hosts) => {
    if (e != null) {
      this.hosts = hosts;
      reject(e);
    } else {
      resolve(hosts.filter(h => h.family === 4).map(h => h.address));
    }
  }));

const currentHeight = async () => {
  const client = await loadHosts().then(newClient);
  const res = await client.get('/');
  return res.body.block.height;
};

const getAccount = async (address) => {
  const client = await loadHosts().then(newClient);
  const res = await client.get(`/api/v1/accounts/${address}`);
  return res.body;
};

const getTransaction = async (h) => {
  const client = await loadHosts().then(newClient);
  return client.get(`/api/v1/transactions/${h}`).then(r => r.body);
};

const getTransactions = async (hs) => {
  const client = await loadHosts().then(newClient);
  return Promise.all(
    hs.map(h => client.get(`/api/v1/transactions/${h}`).then(r => r.body)),
  );
};

const newTxHeader = signature => ({
  version: '',
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
const newRlpBody = (source, seqId, ops) => [source, ops.length * 10000, seqId, ops];

const newProposal = async (opts) => {
  const {
    source, secret, contract, start, end,
  } = opts;
  const account = await getAccount(source);

  const type = 'congress-voting';
  const body = newRlpBody(source, account.sequence_id, [
    [[type], [Buffer.from(contract, 'base64').toString('ascii'), [start, end]]],
  ]);
  const payload = {
    H: newTxHeader(sign(hash(body), 'sebak-test-network', secret)),
    B: newTxBody(source, account.sequence_id, [
      {
        H: newOpHeader(type),
        B: { contract, voting: { start, end } },
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

module.exports = {
  newClient,
  loadHosts,
  currentHeight,
  getAccount,
  getTransaction,
  getTransactions,
  newProposal,
};
