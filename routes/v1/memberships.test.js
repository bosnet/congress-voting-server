const request = require('supertest');
const cryptoRandomString = require('crypto-random-string');
const { expect } = require('chai');

const app = require('../../app');
const { Membership } = require('../../models/index');

const urlPrefix = '/api/v1';

describe('Membership /v1 API', () => {
  describe('POST /memberships', () => {
    it('should register new membership', async () => request(app)
      .post(`${urlPrefix}/memberships`)
      .send({
        public_address: cryptoRandomString(56),
        applicant_id: cryptoRandomString(24),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200));

    it('should reject without public_address', async () => request(app)
      .post(`${urlPrefix}/memberships`)
      .send({
        applicant_id: cryptoRandomString(24),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400));

    it('should reject without public_address', async () => request(app)
      .post(`${urlPrefix}/memberships`)
      .send({
        public_address: cryptoRandomString(56),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400));
  });

  describe('GET /memberships/:address', () => {
    const address = cryptoRandomString(56);
    before(async () => request(app)
      .post(`${urlPrefix}/memberships`)
      .send({
        public_address: address,
        applicant_id: cryptoRandomString(24),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200));

    it('should return an existing membership', async () => request(app)
      .get(`${urlPrefix}/memberships/${address}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('public_address').to.equal(address);
      }));
  });

  describe('DELETE /memberships/:address', () => {
    const address = cryptoRandomString(56);
    before(async () => request(app)
      .post(`${urlPrefix}/memberships`)
      .send({
        public_address: address,
        applicant_id: cryptoRandomString(24),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200));

    it('should delete an existing membership', async () => request(app)
      .delete(`${urlPrefix}/memberships/${address}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('public_address').to.equal(address);
        expect(res.body).to.have.property('status').to.equal('deleted');
        expect(res.body).to.have.property('deleted_at').to.be.not.null;
      }));

    it('should return 404 if the address not exist', async () => request(app)
      .delete(`${urlPrefix}/memberships/wrong-address`)
      .expect('Content-Type', /json/)
      .expect(404));
  });

  describe('POST /memberships/:address/activate', () => {
    it('should activate an existing membership', async () => {
      const m = await Membership.register({
        publicAddress: cryptoRandomString(56),
        applicantId: cryptoRandomString(24),
        status: Membership.Status.verified.name,
      });

      await request(app)
        .post(`${urlPrefix}/memberships/${m.publicAddress}/activate`)
        .send({ is_agree_delegation: true })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('public_address').to.equal(m.publicAddress);
          expect(res.body).to.have.property('status').to.equal('active');
        });
    });

    it('should return 400 without is_agree_delegation', async () => {
      const m = await Membership.register({
        publicAddress: cryptoRandomString(56),
        applicantId: cryptoRandomString(24),
        status: Membership.Status.verified.name,
      });

      await request(app)
        .post(`${urlPrefix}/memberships/${m.publicAddress}/activate`)
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('should return 400 if the membership status is not verified', async () => {
      const m = await Membership.register({
        publicAddress: cryptoRandomString(56),
        applicantId: cryptoRandomString(24),
      });

      await request(app)
        .post(`${urlPrefix}/memberships/${m.publicAddress}/activate`)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });
});
