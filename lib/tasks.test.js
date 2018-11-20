const { expect } = require('chai');
const cryptoRandomString = require('crypto-random-string');

const {
  newProposalTask,
  saveProposalsTask,
  reportVotingResultTask,
  confirmVotingResultTask,
} = require('./tasks');
const { Proposal } = require('../models/index');
const mock = require('../test/mock');

describe('tasks', () => {
  afterEach(mock.cleanAll);

  describe('newProposalTask()', () => {
    it('should submit proposal into sebak', async () => {
      const publicAddress = 'GCT67AX6PSARM47MJYAEMAQTS4LQRJDJFSMBAEEKHVCDIP5VRC3P2RPC';

      mock.sebak.getAccount(publicAddress);
      mock.sebak.newProposal(publicAddress);

      const proposal = {
        height: 1168,
        proposerSecret: 'SC4SK7D37HD6WXTMDOCSMWTQ7R2H3HJ6QXW3G6A5KLTRHBFNHQO4TWFH',
        proposerAddress: publicAddress,
        contractPath: '../test/contract-sample.yaml',
        votingStart: 300,
        votingEnd: 500,
      };
      
      const res = await newProposalTask(proposal);
      expect(res).to.have.property('status').to.equal('submitted');
    });
  });
});
