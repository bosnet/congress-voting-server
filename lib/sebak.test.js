const { expect } = require('chai');
const cryptoRandomString = require('crypto-random-string');

const {
  saveProposals,
  currentHeight,
  reportVotingResult,
  confirmVotingResult,
  getAccount,
} = require('./sebak');
const { Proposal } = require('../models/index');
const mock = require('../test/mock');

describe('sebak', () => {
  describe('currentHeight()', () => {
    const expectedHeight = 133;

    before(() => {
      mock.sebak.currentHeight(expectedHeight);
    });

    after(mock.cleanAll);

    it('should get success applicant status', async () => {
      const height = await currentHeight();

      expect(height).to.equal(expectedHeight);
    });
  });

  describe('getAccount()', () => {
    let h1;
    let h2;
    before(async () => {
      h1 = cryptoRandomString(30);
      h2 = cryptoRandomString(30);

      mock.sebak.getFrozenAccount(h1, h2);
    });

    after(mock.cleanAll);

    it('should return frozen account if it is frozen', async () => {
      const res = await getAccount(h1);
      expect(res).to.have.property('linked').to.equal(h2);
    });
  });
});
