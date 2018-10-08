const { expect } = require('chai');
const cryptoRandomString = require('crypto-random-string');

const { Vote } = require('./index');

describe('Vote Model', () => {
  after(async () => {
    Vote.destroy({ where: {}, truncate: true });
  });

  describe('register()', () => {
    after(async () => {
      Vote.destroy({ where: {}, truncate: true });
    });

    it('should register new vote', async () => {
      const result = await Vote.register({
        proposal_id: 1,
        public_address: cryptoRandomString(56),
        answer: Vote.Answer.no.name,
      });

      expect(result).to.have.property('id');
    });

    it('should update an existing vote if proposalId and addr are same', async () => {
      const proposalId = 2;
      const address = cryptoRandomString(56);
      const result = await Vote.register({
        proposal_id: proposalId,
        public_address: address,
        answer: Vote.Answer.no.name,
      });

      expect(result).to.have.property('id');
      expect(result).to.have.property('answer').to.equal(Vote.Answer.no.name);

      const updated = await Vote.register({
        proposal_id: proposalId,
        public_address: address,
        answer: Vote.Answer.yes.name,
      });

      expect(updated).to.have.property('id').to.equal(result.id);
      expect(updated).to.have.property('answer').to.equal(Vote.Answer.yes.name);
    });
  });
});
