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

  describe('saveProposalsTask()', () => {
    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should fetch new proposals from sebak', async () => {
      const publicAddress = 'GCT67AX6PSARM47MJYAEMAQTS4LQRJDJFSMBAEEKHVCDIP5VRC3P2RPC';
      const ops = [
        { tx_hash: '5pkcMCD7o1RHu2fU3phYvC68t3ZAXbmq27hjwqauVBS2' },
        { tx_hash: '2uTT2gdhftR7iY4Prbh8hMJ2q5nUuraGXpTYUrHjFote' },
      ];
      mock.sebak.getAccountOperations(publicAddress, '?type=congress-voting&reverse=true', ops);
      mock.sebak.getTransaction(ops[0].tx_hash);
      mock.sebak.getTransaction(ops[1].tx_hash);

      await saveProposalsTask({
        proposerAddress: publicAddress,
      });
      const result = await Proposal.findAll({});
      expect(result).to.have.lengthOf(2);
    });

    it('should not save proposals duplicated', async () => {
      const publicAddress = 'GCT67AX6PSARM47MJYAEMAQTS4LQRJDJFSMBAEEKHVCDIP5VRC3P2RPC';
      const ops = [
        { tx_hash: '5pkcMCD7o1RHu2fU3phYvC68t3ZAXbmq27hjwqauVBS2' },
        { tx_hash: '2uTT2gdhftR7iY4Prbh8hMJ2q5nUuraGXpTYUrHjFote' },
      ];
      mock.sebak.getAccountOperations(publicAddress, '?type=congress-voting&reverse=true', ops);
      mock.sebak.getTransaction(ops[0].tx_hash);
      mock.sebak.getTransaction(ops[1].tx_hash);

      await saveProposalsTask({ proposerAddress: publicAddress });

      mock.sebak.getAccountOperations(publicAddress, '?type=congress-voting&reverse=true', ops);
      mock.sebak.getTransaction(ops[0].tx_hash);
      mock.sebak.getTransaction(ops[1].tx_hash);
      await saveProposalsTask({ proposerAddress: publicAddress });

      const result = await Proposal.findAll({});
      expect(result).to.have.lengthOf(2);
    });
  });
});
