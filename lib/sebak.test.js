const { expect } = require('chai');
const cryptoRandomString = require('crypto-random-string');

const {
  saveProposals,
  currentHeight,
  reportVotingResult,
  confirmVotingResult,
} = require('./sebak');
const { Proposal } = require('../models/index');
const mock = require('../test/mock');

describe('sebak', () => {
  describe('saveProposals()', () => {
    before(mock.sebak.getProposals);

    after(async () => {
      mock.cleanAll();
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
      mock.sebak.currentHeight(expectedHeight);
    });

    after(mock.cleanAll);

    it('should get success applicant status', async () => {
      const height = await currentHeight();

      expect(height).to.equal(expectedHeight);
    });
  });

  describe('reportVotingResult()', () => {
    before(() => {
      mock.sebak.currentHeight(100);
    });

    after(mock.cleanAll);

    // TODO: make a test
    it('should send a request a voting result transaction', async () => {
      await reportVotingResult();
    });
  });

  describe('confirmVotingResult()', () => {
    let h1;
    before(async () => {
      h1 = cryptoRandomString(30);

      await Proposal.register({
        title: 'example',
        code: 'ex-00',
        content: '# Example proposal',
        start: 100,
        end: 150,
        hash: h1,
        reported: true,
        reportConfirmed: false,
      });

      mock.sebak.currentHeight(100);
      mock.sebak.confirmVotingResult(h1);
    });

    after(mock.cleanAll);

    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    // TODO: make a test
    it('should confirm a voting result in blockchain', async () => {
      await confirmVotingResult();
    });
  });
});
