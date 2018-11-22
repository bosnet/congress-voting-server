const request = require('supertest');
const cryptoRandomString = require('crypto-random-string');
const { expect } = require('chai');
const { generate, hash, sign } = require('sebakjs-util');

const app = require('../../app');
const { Proposal, Vote } = require('../../models/index');
const mock = require('../../test/mock');

const urlPrefix = '/api/v1';

describe('Proposals /v1 API', () => {
  describe('GET /proposals', () => {
    before(async () => {
      await Proposal.register({
        title: 'PF',
        code: 'pf-00',
        content: '# PF00',
        start: 100,
        end: 200,
        opHash: cryptoRandomString(30),
      });
    });

    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
      mock.cleanAll();
    });

    it('should return all proposals', async () => {
      mock.sebak.currentHeight(120);

      request(app)
        .get(`${urlPrefix}/proposals`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('data').to.have.lengthOf(1);
        });
    });

    it('should return all proposals with open/close state', async () => {
      mock.sebak.currentHeight(120);

      await Proposal.register({
        title: 'PF',
        code: 'pf-01',
        content: '# PF01',
        start: 150,
        end: 200,
        opHash: cryptoRandomString(30),
      });

      request(app)
        .get(`${urlPrefix}/proposals`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('data').to.have.lengthOf(2);
          expect(res.body.data[0]).to.have.property('state').to.equal('opened');
          expect(res.body.data[0]).to.have.property('remain').to.equal(80);
          expect(res.body.data[1]).to.have.property('state').to.equal('open-before');
          expect(res.body.data[1]).to.have.property('remain').to.equal(30);
        });
    });
  });

  describe('GET /proposals/:id', () => {
    let proposalId;
    before(async () => {
      const m = await Proposal.register({
        title: 'PF',
        code: 'pf-00',
        content: '# PF00',
        start: 100,
        end: 200,
        opHash: cryptoRandomString(30),
      });
      proposalId = m.id;
    });

    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should return details of given proposal', async () => request(app)
      .get(`${urlPrefix}/proposals/${proposalId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('id').to.equal(proposalId);
      }));
  });

  describe('POST /proposals/:id/vote', () => {
    let proposalId;
    let keypair;

    before(async () => {
      const m = await Proposal.register({
        title: 'PF',
        code: 'pf-00',
        content: '# PF00',
        start: 100,
        end: 200,
        opHash: cryptoRandomString(30),
      });
      proposalId = m.id;
      keypair = generate();
    });

    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should vote to given proposal', async () => {
      mock.sebak.currentHeight(120);

      const rlp = [keypair.address, proposalId, Vote.Answer.yes.name];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .post(`${urlPrefix}/proposals/${proposalId}/vote`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('proposal_id').to.equal(proposalId);
        });

      mock.cleanAll();
    });

    it('should reject the request if given proposal is not open', async () => {
      mock.sebak.currentHeight(80);

      const rlp = [keypair.address, Vote.Answer.yes.name];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .post(`${urlPrefix}/proposals/${proposalId}/vote`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);

      mock.cleanAll();
    });

    it('should reject the request if given proposal is not open', async () => {
      mock.sebak.currentHeight(80);

      const rlp = [keypair.address, Vote.Answer.yes.name];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .post(`${urlPrefix}/proposals/${proposalId}/vote`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);

      mock.cleanAll();
    });

    it('should reject the request if given signature is invalid', async () => {
      mock.sebak.currentHeight(80);

      const rlp = [keypair.address, Vote.Answer.yes.name];
      const sig = sign(hash(rlp), 'wrong-networkid', keypair.seed);

      await request(app)
        .post(`${urlPrefix}/proposals/${proposalId}/vote`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);

      mock.cleanAll();
    });
  });
});
