const { expect } = require('chai');
const nock = require('nock');

const { getApplicantStatus } = require('./sumsub');

describe('Sum&Sub', () => {
  describe('getApplicantStatus()', () => {
    const successApplicantId = 'success-applicant-id';
    const failedApplicantId = 'failed-applicant-id';
    const pendingApplicantId = 'pending-applicant-id';

    before(() => {
      nock('https://test-api.sumsub.com:443', { encodedQueryParams: true })
        .get(`/resources/applicants/${successApplicantId}/state`)
        .query({ key: process.env.SUMSUB_APIKEY })
        .reply(200, {
          id: '5ba373130a975a04148d46a8',
          status: {
            id: '5ba373130a975a04148d46ac',
            inspectionId: '5ba373130a975a04148d46a9',
            jobId: 'd1f40374-f248-4068-af0b-090796808d56',
            createDate: '2018-09-20 10:15:01+0000',
            reviewDate: '2018-09-20 10:30:08+0000',
            reviewResult: {
              reviewAnswer: 'GREEN',
              label: 'OTHER',
              rejectLabels: ['DOCUMENT_PAGE_MISSING'],
              reviewRejectType: 'RETRY',
            },
            reviewStatus: 'completedSent',
            notificationFailureCnt: 0,
            applicantId: '5ba373130a975a04148d46a8',
          },
          documentStatus: [{
            idDocType: 'PASSPORT',
            country: 'KOR',
            imageId: 569464400,
            reviewResult: {
              reviewAnswer: 'RED',
              label: 'OTHER',
              rejectLabels: ['ID_INVALID'],
              reviewRejectType: 'RETRY',
            },
          }, {
            idDocType: 'SELFIE',
            country: 'KOR',
            imageId: 2024974751,
            reviewResult: {
              reviewAnswer: 'RED',
              label: 'OTHER',
              rejectLabels: ['ID_INVALID'],
              reviewRejectType: 'RETRY',
            },
          }],
        })
        .get(`/resources/applicants/${failedApplicantId}/state`)
        .query({ key: process.env.SUMSUB_APIKEY })
        .reply(200, {
          id: '5ba373130a975a04148d46a8',
          status: {
            id: '5ba373130a975a04148d46ac',
            inspectionId: '5ba373130a975a04148d46a9',
            jobId: 'd1f40374-f248-4068-af0b-090796808d56',
            createDate: '2018-09-20 10:15:01+0000',
            reviewDate: '2018-09-20 10:30:08+0000',
            reviewResult: {
              reviewAnswer: 'RED',
              label: 'OTHER',
              rejectLabels: ['ID_INVALID'],
              reviewRejectType: 'RETRY',
            },
            reviewStatus: 'completedSent',
            notificationFailureCnt: 0,
            applicantId: '5ba373130a975a04148d46a8',
          },
          documentStatus: [{
            idDocType: 'PASSPORT',
            country: 'KOR',
            imageId: 569464400,
            reviewResult: {
              reviewAnswer: 'RED',
              label: 'OTHER',
              rejectLabels: ['ID_INVALID'],
              reviewRejectType: 'RETRY',
            },
          }, {
            idDocType: 'SELFIE',
            country: 'KOR',
            imageId: 2024974751,
            reviewResult: {
              reviewAnswer: 'RED',
              label: 'OTHER',
              rejectLabels: ['ID_INVALID'],
              reviewRejectType: 'RETRY',
            },
          }],
        })
        .get(`/resources/applicants/${pendingApplicantId}/state`)
        .query({ key: process.env.SUMSUB_APIKEY })
        .reply(200, {
          id: '5b9923830a975a439951cfcd',
          status: {
            id: '5b9923830a975a439951cfd1',
            inspectionId: '5b9923830a975a439951cfce',
            jobId: '33a67b03-cf00-45fa-bcf3-0623d4203aab',
            createDate: '2018-09-12 14:32:35+0000',
            reviewStatus: 'pending',
            notificationFailureCnt: 0,
            applicantId: '5b9923830a975a439951cfcd',
          },
          documentStatus: [{
            idDocType: 'PASSPORT',
            country: 'RUS',
            imageId: 1711600983,
            externalHash: 'i9u+OONrww9egOEhmmo6RGeySVDiBsPJqC/9/Ky9xAs=',
          }, {
            idDocType: 'SELFIE',
            country: 'RUS',
            imageId: 910289050,
            externalHash: '569OjIN/pYLZNRkkzZikNdh1Tr0raP1QktBlbWgV2FE=',
          }, {
            idDocType: 'UTILITY_BILL',
            country: 'RUS',
            imageId: 2066646482,
            externalHash: 'OzYYbkj+oOthk8fryxSt3GfTqIaeZaEfjtXXIRepsJA=',
          }],
        });
    });

    after(() => nock.cleanAll());

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
      expect(result).to.be.null;
    });
  });
});
