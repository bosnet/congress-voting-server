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

  describe('POST /memberships/sumsub/callback', () => {
    const address = cryptoRandomString(56);
    const applId = cryptoRandomString(24);

    before(async () => {
      await Membership.register({
        publicAddress: address,
        applicantId: applId,
        status: Membership.Status.pending.name,
      });
    });

    it('should receive passed verification result from sum&sub', async () => {
      await request(app)
        .post(`${urlPrefix}/memberships/sumsub/callback`)
        .send({
          applicantId: applId,
          inspectionId: '5ba373130a975a04148d46a9',
          correlationId: 'req-4cbee12c-49c1-4238-b53e-cb6342a4c2b0',
          jobId: 'd1f40374-f248-4068-af0b-090796808d56',
          externalUserId: address,
          type: 'INSPECTION_REVIEW_COMPLETED',
          review: {
            reviewAnswer: 'GREEN',
            label: 'OTHER',
            rejectLabels: ['DOCUMENT_PAGE_MISSING'],
            reviewRejectType: 'RETRY',
          },
          success: true,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const result = await Membership.findByAddress(address);
      expect(result.status).to.equal(Membership.Status.verified.name);
    });

    it('should receive failed verification result from sum&sub', async () => {
      await request(app)
        .post(`${urlPrefix}/memberships/sumsub/callback`)
        .send({
          applicantId: applId,
          inspectionId: '5ba373130a975a04148d46a9',
          correlationId: 'req-ff7c34f6-5b8c-48c5-b689-54ec0571f7c8',
          jobId: 'd1f40374-f248-4068-af0b-090796808d56',
          externalUserId: address,
          type: 'INSPECTION_REVIEW_COMPLETED',
          review: {
            reviewAnswer: 'RED',
            label: 'OTHER',
            rejectLabels: ['ID_INVALID'],
            reviewRejectType: 'RETRY',
          },
          success: true,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const result = await Membership.findByAddress(address);
      expect(result.status).to.equal(Membership.Status.rejected.name);
    });
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
