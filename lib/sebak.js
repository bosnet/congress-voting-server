const got = require('got');
const { hash, verify } = require('sebakjs-util');

const { Proposal } = require('../models/index');

// TODO: use SEBAK DNS seed
const { SEBAK_URL, SEBAK_NETWORKID = 'sebak-test-network' } = process.env;
const PREFIX = '/api/v1';

const client = got.extend({
  baseUrl: `${SEBAK_URL}${PREFIX}`,
  json: true,
});

const opToRlp = (op) => {
  const data = [];
  data.push([op.H.type]);
  if (op.H.type === 'pr') {
    const body = [];
    body.push(op.B.title);
    body.push(op.B.code);
    body.push(op.B.contract);
    body.push([op.B.voting.start, op.B.voting.end]);

    data.push(body);
  }

  return data;
};

const txToRlp = (tx) => {
  const data = [];
  data.push(tx.B.source);
  data.push(tx.B.fee);
  data.push(tx.B.sequenceid);

  const ops = tx.B.operations.map(opToRlp);
  data.push(ops);

  return data;
};

const saveProposals = async () => {
  // FIXME: replace with real API
  const res = await client.get(`${SEBAK_URL}${PREFIX}/transactions`);
  const prs = res.body.filter((b) => {
    const rlp = txToRlp(b);
    b.H.hash = hash(rlp); // eslint-disable-line no-param-reassign
    return verify(b.H.hash, SEBAK_NETWORKID, b.H.signature, b.B.source);
  });

  const promises = prs.map((p) => {
    const [prOp] = p.B.operations.filter(o => o.H.type === 'pr');

    return Proposal.register({
      title: prOp.B.title,
      code: prOp.B.code,
      content: prOp.B.contract,
      start: prOp.B.voting.start,
      end: prOp.B.voting.end,
      hash: p.H.hash,
    });
  });

  await Promise.all(promises);
};

const currentHeight = async () => {
  // FIXME: replace with real API
  const res = await client.get(`${SEBAK_URL}${PREFIX}/`);
  return res.body.height;
};

const reportVotingResult = async () => {
  const blockHeight = await currentHeight();
  const prs = await Proposal.listToReport(blockHeight);
  const promises = prs.map((p) => {
    // TODO: make a voting result transaction, including uploading S3
    const proposalId = p.id;
    return `send a requst voting result of ${proposalId}`;
  });
  await Promise.all(promises);
};

const confirmVotingResult = async () => {
  const blockHeight = await currentHeight();
  const prs = await Proposal.listToConfirm(blockHeight);
  const promises = prs.map((p) => {
    // FIXME: replace with real API
    const h = p.hash;
    return client.get(`${SEBAK_URL}${PREFIX}/transaction/${h}`)
      .then(async (res) => {
        if (res.body) {
          await p.report();
        }
      });
  });

  await Promise.all(promises);
};

module.exports = {
  saveProposals,
  currentHeight,
  reportVotingResult,
  confirmVotingResult,
};
