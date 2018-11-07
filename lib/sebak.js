const dns = require('dns');
const got = require('got');
const url = require('url');

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

module.exports = {
  newClient,
  loadHosts,
  currentHeight,
  getAccount,
};
