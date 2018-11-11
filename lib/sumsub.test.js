const { expect } = require('chai');

const {
  getApplicantStatus,
  getAccessToken,
  getApplicant,
  getApplicantByAddress,
} = require('./sumsub');
const mock = require('../test/mock');

describe('Sum&Sub', () => {
  describe('getApplicantStatus()', () => {
    const successApplicantId = 'success-applicant-id';
    const failedApplicantId = 'failed-applicant-id';
    const pendingApplicantId = 'pending-applicant-id';

    before(() => {
      mock.sumsub.applicantStatus(successApplicantId, failedApplicantId, pendingApplicantId);
    });

    after(mock.cleanAll);

    it('should get success applicant status', async () => {
      const result = await getApplicantStatus(successApplicantId);
      expect(result).to.equal('verified');
    });

    it('should get failed applicant status', async () => {
      const result = await getApplicantStatus(failedApplicantId);
      expect(result).to.equal('rejected');
    });

    it('should get pending applicant status', async () => {
      const result = await getApplicantStatus(pendingApplicantId);
      expect(result).to.equal('pending');
    });
  });

  describe('getAccessToken()', () => {
    const address = 'your-public-address';
    before(() => {
      mock.sumsub.accessToken(address);
    });

    after(mock.cleanAll);

    it('should get an access token', async () => {
      const result = await getAccessToken(address);
      expect(result).to.be.ok;
    });
  });

  describe('getApplicant()', () => {
    const applicantId = '5be68f870a975a2e44066c31';
    const address = 'GCYRCKD3ITDTW3ZKJJEL44VRGEXLHXSUIQ4MNM73EXA4JXY3URJOJT5X14';
    before(() => {
      mock.sumsub.applicant(applicantId, address);
    });

    after(mock.cleanAll);

    it('should applicant data', async () => {
      const result = await getApplicant(applicantId);
      expect(result).to.have.property('externalUserId');
    });
  });

  describe('getApplicantByAddress()', () => {
    const applicantId = '5be68f870a975a2e44066c31';
    const address = 'GCYRCKD3ITDTW3ZKJJEL44VRGEXLHXSUIQ4MNM73EXA4JXY3URJOJT5X14';
    before(() => {
      mock.sumsub.applicantByExternalId(applicantId, address);
    });

    after(mock.cleanAll);

    it('should applicant data', async () => {
      const result = await getApplicantByAddress(address);
      expect(result).to.have.property('id'); // applicantId
      expect(result).to.have.property('externalUserId').to.equal(address);
    });
  });
});
