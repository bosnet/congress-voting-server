const request = require('supertest');
const cryptoRandomString = require('crypto-random-string');
const { expect } = require('chai');

const app = require('../../app');
const { Proposal } = require('../../models/index');

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
        hash: cryptoRandomString(30),
      });
    });

    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should return all proposals', async () => request(app)
      .get(`${urlPrefix}/proposals`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('data').to.have.lengthOf(1);
      }));
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
        hash: cryptoRandomString(30),
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
});
