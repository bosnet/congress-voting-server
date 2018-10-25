const { expect } = require('chai');

const { getApplicantStatus, getAccessToken } = require('./sumsub');
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
});
