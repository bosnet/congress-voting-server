const request = require('supertest');
const cryptoRandomString = require('crypto-random-string');
const { expect } = require('chai');
const nock = require('nock');
const { generate, hash, sign } = require('sebakjs-util');

const app = require('../../app');
const { Membership, Proposal } = require('../../models/index');
const mock = require('../../test/mock');

const urlPrefix = '/api/v1';

describe('Membership /v1 API', () => {
  describe('POST /memberships', () => {
    let keypair;

    beforeEach(() => {
      keypair = generate();
    });

    it('should register new membership', async () => {
      const rlp = [keypair.address, cryptoRandomString(30)];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .post(`${urlPrefix}/memberships`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('should reject without public_address or applicant_id', async () => {
      const rlp = [keypair.address];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .post(`${urlPrefix}/memberships`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('should reject with wrong signature', async () => {
      const rlp = [keypair.address, cryptoRandomString(30)];
      const sig = sign(hash(rlp), 'wrong-netword-id', keypair.seed);

      await request(app)
        .post(`${urlPrefix}/memberships`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });
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
    let m;
    const keypair = generate();

    before(async () => {
      const rlp = [keypair.address, cryptoRandomString(24)];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      const res = await request(app)
        .post(`${urlPrefix}/memberships`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      m = res.body;
    });

    it('should return an existing membership', async () => request(app)
      .get(`${urlPrefix}/memberships/${keypair.address}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('public_address').to.equal(keypair.address);
      }));

    it('should renew verification result from sum&sub when renew parameter provided', (done) => {
      const interval = process.env.SUMSUB_RENEW_INTERVAL;
      process.env.SUMSUB_RENEW_INTERVAL = 10;

      nock('https://test-api.sumsub.com:443')
        .filteringPath(/resources\/applicants.*/g, 'mocked')
        .get('/mocked')
        .reply(200, { status: { reviewStatus: 'pending' } });

      setTimeout(() => {
        let err;
        request(app)
          .get(`${urlPrefix}/memberships/${keypair.address}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then((res) => {
            try {
              expect(res.body).to.have.property('public_address').to.equal(keypair.address);
              expect(res.body).to.have.property('updated_at').to.not.equal(m.updated_at);
            } catch (e) { err = e; }

            nock.cleanAll();
            process.env.SUMSUB_RENEW_INTERVAL = interval;
            done(err);
          });
      }, 100);
    });
  });

  describe('DELETE /memberships/:address', () => {
    let keypair;
    const expectedHeight = 100;

    beforeEach(async () => {
      keypair = generate();
      mock.sebak.currentHeight(expectedHeight);
      await Membership.register({
        publicAddress: keypair.address,
        applicantId: cryptoRandomString(24),
        status: Membership.Status.active.name,
      });
    });

    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should delete an existing membership', async () => {
      const rlp = [keypair.address];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .delete(`${urlPrefix}/memberships/${keypair.address}?sig=${sig}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('public_address').to.equal(keypair.address);
          expect(res.body).to.have.property('status').to.equal('deleted');
          expect(res.body).to.have.property('deleted_at').to.be.not.null;
          expect(res.body).to.have.property('deactivated_at').to.equal(expectedHeight);
        });
    });

    it('should not delete an existing membership if there is a opened proposal at least', async () => {
      await Proposal.register({
        title: 'PF',
        code: 'pf-00',
        content: '# PF00',
        start: 50,
        end: 150,
        hash: cryptoRandomString(30),
      });
      const rlp = [keypair.address];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .delete(`${urlPrefix}/memberships/${keypair.address}?sig=${sig}`)
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('should return 404 if the address not exist', async () => {
      const rlp = [keypair.address];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .delete(`${urlPrefix}/memberships/wrong-address?sig=${sig}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('should return 400 if signature is invalid', async () => {
      const rlp = [keypair.address];
      const sig = sign(hash(rlp), 'wrong-network-id', keypair.seed);

      await request(app)
        .delete(`${urlPrefix}/memberships/${keypair.address}?sig=${sig}`)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('POST /memberships/:address/activate', () => {
    let keypair;
    const expectedHeight = 100;

    beforeEach(() => {
      keypair = generate();
      mock.sebak.currentHeight(expectedHeight);
    });

    it('should activate an existing membership', async () => {
      const m = await Membership.register({
        publicAddress: keypair.address,
        applicantId: cryptoRandomString(24),
        status: Membership.Status.verified.name,
      });

      const rlp = [keypair.address, cryptoRandomString(30)];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .post(`${urlPrefix}/memberships/${m.publicAddress}/activate`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('public_address').to.equal(m.publicAddress);
          expect(res.body).to.have.property('status').to.equal('active');
          expect(res.body).to.have.property('activated_at').to.equal(expectedHeight);
        });
    });

    it('should return 400 if the membership status is not verified', async () => {
      const m = await Membership.register({
        publicAddress: keypair.address,
        applicantId: cryptoRandomString(24),
      });

      const rlp = [keypair.address, cryptoRandomString(30)];
      const sig = sign(hash(rlp), process.env.SEBAK_NETWORKID, keypair.seed);

      await request(app)
        .post(`${urlPrefix}/memberships/${m.publicAddress}/activate`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('should return 400 if given signature is invalid', async () => {
      const m = await Membership.register({
        publicAddress: keypair.address,
        applicantId: cryptoRandomString(24),
        status: Membership.Status.verified.name,
      });

      const rlp = [keypair.address, cryptoRandomString(30)];
      const sig = sign(hash(rlp), 'wrong-network-id', keypair.seed);

      await request(app)
        .post(`${urlPrefix}/memberships/${m.publicAddress}/activate`)
        .send({
          data: rlp,
          signature: sig,
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });
});
