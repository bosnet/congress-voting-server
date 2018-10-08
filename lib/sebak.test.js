const { expect } = require('chai');
const cryptoRandomString = require('crypto-random-string');
const nock = require('nock');

const { saveProposals, currentHeight } = require('./sebak');
const { Proposal } = require('../models/index');

const { SEBAK_URL } = process.env;
const PREFIX = '/api/v1';

describe('sebak', () => {
  describe('saveProposals()', () => {
    before(() => {
      nock(SEBAK_URL, { encodedQueryParams: true })
        .get(`${PREFIX}/transactions`)
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
    });

    after(async () => {
      nock.cleanAll();
      const hashToRemove = '31vomPRqGdhRPNhotyzcc96BZSY9bHSj5hvydC3zRJXr';
      await Proposal.update({ hash: cryptoRandomString(50) }, {
        where: { hash: hashToRemove },
      });
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should get success applicant status', async () => {
      const prs = await Proposal.list();
      expect(prs).to.have.lengthOf(0);

      await saveProposals();

      const prs2 = await Proposal.list();
      expect(prs2).to.have.lengthOf(1);
    });
  });

  describe('currentHeight()', () => {
    const expectedHeight = 133;

    before(() => {
      nock(SEBAK_URL, { encodedQueryParams: true })
        .get(`${PREFIX}/`)
        .reply(200, { height: expectedHeight });
    });

    after(async () => {
      nock.cleanAll();
    });

    it('should get success applicant status', async () => {
      const height = await currentHeight();

      expect(height).to.equal(expectedHeight);
    });
  });
});
