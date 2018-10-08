const { expect } = require('chai');
const cryptoRandomString = require('crypto-random-string');

const { Proposal } = require('./index');

describe('Proposal Model', () => {
  after(async () => {
    await Proposal.destroy({ where: {}, truncate: true });
  });

  describe('register()', () => {
    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should register new proposal', async () => {
      const result = await Proposal.register({
        title: 'PF',
        code: 'pf-00',
        content: '# PF00',
        start: 100,
        end: 200,
        hash: cryptoRandomString(30),
      });
      expect(result).to.have.property('id');
    });

    it('should do nothing if the proposal already registered', async () => {
      const pr = {
        title: 'PF',
        code: 'pf-00',
        content: '# PF00',
        start: 100,
        end: 200,
        hash: cryptoRandomString(30),
      };

      await Proposal.register(pr);
      const result = await Proposal.register(pr);
      expect(result).to.be.null;
    });
  });

  describe('find*(), list()', () => {
    let m;
    before(async () => {
      m = await Proposal.register({
        title: 'example',
        code: 'ex-00',
        content: '# Example proposal',
        start: 100,
        end: 200,
        hash: cryptoRandomString(30),
      });
    });

    it('should return the proposal by hash', async () => {
      const result = await Proposal.findByHash(m.hash);
      expect(result.id).to.equal(m.id);
    });

    it('should return the proposal by id', async () => {
      const result = await Proposal.findById(m.id);
      expect(result.id).to.equal(m.id);
    });

    it('should return proposals', async () => {
      const result = await Proposal.list();
      expect(result).to.have.property('length').to.equal(1);
    });
  });
});
