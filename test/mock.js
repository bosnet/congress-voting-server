const nock = require('nock');

const { SEBAK_URL } = process.env;
const SEBAK_PREFIX = '/api/v1';

const useMock = !process.env.DONT_USE_MOCK;

const sebakCurrentHeight = (expectedHeight) => {
  if (useMock) {
    nock(SEBAK_URL, { encodedQueryParams: true })
      .get('/')
      .reply(200, {
        node: {},
        policy: {},
        block: {
          height: expectedHeight,
          hash: '5nSRHXYsCYp3oqPRB9HeXEHKk9BL5pY5sjYmwbfDWTgR',
          'total-txs': 1000,
          'total-ops': 1000,
        },
      });
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

const sebakConfirmVotingResult = (hash) => {
  if (useMock) {
    nock(SEBAK_URL, { encodedQueryParams: true })
      .get(`${SEBAK_PREFIX}/transactions/${hash}`)
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
          operations: [],
        },
      }]);
  }
};

const sebakGetFrozenAccount = (expectedAddress, expectedLinkedAddress) => {
  if (useMock) {
    nock(SEBAK_URL, { encodedQueryParams: true })
      .get(`${SEBAK_PREFIX}/accounts/${expectedAddress}`)
      .reply(200, {
        _links:
          {
            operations: {
              href: `/api/v1/accounts/${expectedAddress}/operations{?cursor,limit,order}`,
              templated: true,
            },
            self: {
              href: `/api/v1/accounts/${expectedAddress}`,
            },
            transactions: {
              href: `/api/v1/accounts/${expectedAddress}/transactions{?cursor,limit,order}`,
              templated: true,
            },
          },
        address: expectedAddress,
        balance: '100000000000',
        linked: expectedLinkedAddress,
        sequence_id: 0,
      });
  }
};

const sebakGetFrozenAccounts = (expectedAddress, expectedLinkedAddress, hasFrozen = true) => {
  if (useMock) {
    nock(SEBAK_URL, { encodedQueryParams: true })
      .get(`${SEBAK_PREFIX}/accounts/${expectedLinkedAddress}/frozen-accounts`)
      .reply(200, {
        _embedded: {
           records: hasFrozen ? [
             {
               _links: [],
               address: expectedAddress,
               amount: '100000000000',
               create_block_height: 4028,
               create_op_hash: 'CkfHuoDv6twmBvQ8kw5hgR42d3xh4xJMsCT7LSBzkUxD',
               linked: expectedLinkedAddress,
               payment_op_hash: '',
               sequence_id: 0,
               state: 'frozen',
               unfreezing_block_height: 0,
               unfreezing_op_hash: '',
               unfreezing_remaining_blocks: 0
             }
           ] : ''
        },
        _links: {
          next: {
            href: '/api/v1/accounts/GB53I47X475OOIN5FSDILXJMGVUTRJWVQV5ODF2QEYF6JYV3ZPKMUERE/frozen-accounts?limit=100&reverse=false'
          },
          prev: {
            href: '/api/v1/accounts/GB53I47X475OOIN5FSDILXJMGVUTRJWVQV5ODF2QEYF6JYV3ZPKMUERE/frozen-accounts?limit=100&reverse=true'
          },
          self: {
            href: '/api/v1/accounts/GB53I47X475OOIN5FSDILXJMGVUTRJWVQV5ODF2QEYF6JYV3ZPKMUERE/frozen-accounts'
          }
        }
      });
  }
};

const sebakGetAccount = (address) => {
  if (useMock) {
    nock(SEBAK_URL, { encodedQueryParams: true })
      .get(`${SEBAK_PREFIX}/accounts/${address}`)
      .reply(200, {
        '_links': {
          operations: {
            href: `/api/v1/accounts/${address}/operations{?cursor,limit,order}`,
            templated: true
          },
          self: {
            href: `/api/v1/accounts/${address}`
          },
          transactions: {
            href: `/api/v1/accounts/${address}/transactions{?cursor,limit,order}`,
            templated: true
          }
        },
        address,
        balance: `199999999960000`,
        linked: '',
        sequence_id: 4
      });
  }
};

const sebakNewProposal = (address, success = true) => {
  if (useMock) {
    nock(SEBAK_URL, { encodedQueryParams: true })
      .post(`${SEBAK_PREFIX}/transactions`)
      .reply(success ? 200 : 400, {
        _links: {
          history: {
            href: '/api/v1/transactions/5pkcMCD7o1RHu2fU3phYvC68t3ZAXbmq27hjwqauVBS2/history'
          },
          self: { href: '/api/v1/transactions' }
        },
        hash: '5pkcMCD7o1RHu2fU3phYvC68t3ZAXbmq27hjwqauVBS2',
        message: {
          source: address,
          fee: '10000',
          sequence_id: 0,
          operations: [{
            H: { type: 'congress-voting' },
            B: {
              contract: 'dHlwZTogbWV0YQoKdGl0bGU6IE1lbWJlcnNoaXAgUmV3YXJkIFBGCgppZDogUEZfUl8wMC0wMDAtQQoKcHJvcG9zZXI6IEJsb2NrY2hhaW5PUyBJbmMKCnByb3Bvc2VyX2FjY291bnQ6IEdCTlVUV1NNNEZSU0VVTFZNSFpGN05GUVdJQkdFREY1WDVPSFhGT1pKQjZTSDVNSUVERUpFSjJGCgpleGVjdXRpb25fZHVyYXRpb246IDYzMDcyMDAKCmFtb3VudF9vZl9pc3N1YW5jZTogMTYwODMzNjAwCgpwZl9idWRnZXRfYWNjb3VudDogR0JXQ01XRFVaSzY3WU5VWjQ0VVBOVkZZWlJTQ0NTNE9MRTZPUldENFpMSTJNVkdZNEtKRFBITU8K',
              voting: { start: 300, end: 500 },
              funding_address: 'GBWCMWDUZK67YNUZ44UPNVFYZRSCCS4OLE6ORWD4ZLI2MVGY4KJDPHMO',
              amount: '160833600'
            }
          }],
        },
        status: 'submitted',
      });
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

const sumsubAccessToken = (address) => {
  if (useMock) {
    nock('https://test-api.sumsub.com:443', { encodedQueryParams: true })
      .post('/resources/accessTokens')
      .query({
        userId: address,
        key: process.env.SUMSUB_APIKEY,
      })
      .reply(200, {
        token: 'ddb9ac92-c522-40d0-993d-7e438c298329',
        userId: address,
      });
  }
};

const sumsubApplicant = (id, address) => {
  if (useMock) {
    nock('https://test-api.sumsub.com:443', { encodedQueryParams: true })
      .get(`/resources/applicants/${id}`)
      .query({
        key: process.env.SUMSUB_APIKEY,
      })
      .reply(200, {
        list: {
          items: [{
            id,
            createdAt: '2018-11-10 07:57:59',
            clientId: 'boscoin',
            inspectionId: '5be68f870a975a2e44066c32',
            jobId: '2ab53a3d-dd09-4e92-992e-10f31f98076f',
            externalUserId: address,
            info: { country: 'KOR', idDocs: [{}] },
            email: 'test@example.com',
            env: 'test-api',
            applicantPlatform: 'MacOSX',
            requiredIdDocs: {
              country: null,
              includedCountries: null,
              excludedCountries: null,
              docSets: [{}, {}, {}],
            },
            review: {
              createDate: '2018-11-10 07:58:13+0000',
              reviewStatus: 'pending',
              notificationFailureCnt: 0,
            },
            lang: 'ko',
          }],
          totalItems: 1,
        },
      });
  }
};

const sumsubApplicantByExternalId = (id, address) => {
  if (useMock) {
    nock('https://test-api.sumsub.com:443', { encodedQueryParams: true })
      .get(`/resources/applicants/-;externalUserId=${address}`)
      .query({
        key: process.env.SUMSUB_APIKEY,
      })
      .reply(200, {
        list: {
          items: [{
            id,
            createdAt: '2018-11-10 07:57:59',
            clientId: 'boscoin',
            inspectionId: '5be68f870a975a2e44066c32',
            jobId: '2ab53a3d-dd09-4e92-992e-10f31f98076f',
            externalUserId: 'GCYRCKD3ITDTW3ZKJJEL44VRGEXLHXSUIQ4MNM73EXA4JXY3URJOJT5X14',
            info: { country: 'KOR', idDocs: [{}] },
            email: 'test@example.com',
            env: 'test-api',
            applicantPlatform: 'MacOSX',
            requiredIdDocs: {
              country: null,
              includedCountries: null,
              excludedCountries: null,
              docSets: [{}, {}, {}],
            },
            review: {
              createDate: '2018-11-10 07:58:13+0000',
              reviewStatus: 'pending',
              notificationFailureCnt: 0,
            },
            lang: 'ko',
          }],
          totalItems: 1,
        },
      });
  }
};

module.exports = {
  sebak: {
    currentHeight: sebakCurrentHeight,
    getProposals: sebakGetProposals,
    confirmVotingResult: sebakConfirmVotingResult,
    getFrozenAccount: sebakGetFrozenAccount,
    getFrozenAccounts: sebakGetFrozenAccounts,
    newProposal: sebakNewProposal,
    getAccount: sebakGetAccount,
  },
  sumsub: {
    applicantStatus: sumsubApplicantStatus,
    accessToken: sumsubAccessToken,
    applicant: sumsubApplicant,
    applicantByExternalId: sumsubApplicantByExternalId,
  },
  cleanAll: nock.cleanAll,
};
