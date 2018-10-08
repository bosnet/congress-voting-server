const nock = require('nock');

const { SEBAK_URL } = process.env;
const SEBAK_PREFIX = '/api/v1';

const useMock = !process.env.DONT_USE_MOCK;

const sebakCurrentHeight = (expectedHeight) => {
  if (useMock) {
    nock(SEBAK_URL, { encodedQueryParams: true })
      .get(`${SEBAK_PREFIX}/`)
      .reply(200, { height: expectedHeight });
  }
};

const sebakGetProposals = () => {
  if (useMock) {
    nock(SEBAK_URL, { encodedQueryParams: true })
      .get(`${SEBAK_PREFIX}/transactions`)
      .query({})
      .reply(200, [{
        T: 'transaction',
        H: {
          version: '',
          created: '2018-01-01T00:00:00.000000000Z',
          signature: '4C8MDRj8wvCF4ZE8b56pe5SthPwfCiFb3H9VTfXPFXh66d7kuyNBexAamsw888U8qbwt4JjmrL282vq5u2sAjQ1g',
        },
        B: {
          source: 'GDIRF4UWPACXPPI4GW7CMTACTCNDIKJEHZK44RITZB4TD3YUM6CCVNGJ',
          fee: '10000',
          sequenceid: 0,
          operations: [{
            H: { type: 'pr' },
            B: {
              title: 'example',
              code: 'pf00',
              contract: 'UHJvcG9zYWwoUFIpIHdpbGwgYmUgc3RvcmVkIGluIGJsb2NrY2hhaW4KUFIgd2lsbCBiZSBzdWJtaXR0ZWQgdGhydSAnT3BlcmF0aW9uJwpUaGUgb3BlcmF0aW9uIHR5cGUgb2YgUFIgaXPCoFBSClVuZGVyIFBGMDAoYW5kIHplcm8tc2VyaWVzKSwgUFIgY2FuIGJlIHN1Ym1pdHRlZCBvbmx5IGJ5IEJPU2NvaW4KTm9kZSB3aWxsIGNoZWNrIHdoZXRoZXIgdGhlIFBSIHRyYW5zYWN0aW9uIGlzIGNyZWF0ZWQgYnkgQk9TY29pbgpDbGllbnQgY2FuIHJlcXVlc3QgUFIgdG8gbm9kZQpQUiBpbmRpY2F0ZXMgdGhlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgdGltZSBmb3Igdm90aW5nClRoZSBzdGFuZGFyZCB0aW1lIGlzIHRoZSB0aW1lIG9mIHZvdGluZyBzeXN0ZW0K',
              voting: {
                start: '100',
                end: '300',
              },
            },
          }],
        },
      }]);
  }
};

const sumsubApplicantStatus = (success, failed, pending) => {
  if (useMock) {
    nock('https://test-api.sumsub.com:443', { encodedQueryParams: true })
      .get(`/resources/applicants/${success}/state`)
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
      .get(`/resources/applicants/${failed}/state`)
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
      .get(`/resources/applicants/${pending}/state`)
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
  }
};

module.exports = {
  sebak: {
    currentHeight: sebakCurrentHeight,
    getProposals: sebakGetProposals,
  },
  sumsub: {
    applicantStatus: sumsubApplicantStatus,
  },
  cleanAll: nock.cleanAll,
};
