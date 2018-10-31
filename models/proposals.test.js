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

    after(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
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
      expect(result).to.have.lengthOf(1);
    });
  });

  describe('report', () => {
    let h1;
    let h2;

    beforeEach(async () => {
      h1 = cryptoRandomString(30);
      h2 = cryptoRandomString(30);

      await Proposal.register({
        title: 'example',
        code: 'ex-00',
        content: '# Example proposal',
        start: 100,
        end: 200,
        hash: h1,
        reported: false,
        reportConfirmed: false,
      });

      await Proposal.register({
        title: 'example',
        code: 'ex-00',
        content: '# Example proposal',
        start: 100,
        end: 150,
        hash: h2,
        reported: false,
        reportConfirmed: false,
      });
    });

    afterEach(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should return proposal list to report voting result into sebak', async () => {
      const result = await Proposal.listToReport(160);
      expect(result).to.have.lengthOf(1);
    });

    it('should update an proposal as reported', async () => {
      const p = await Proposal.findByHash(h2);
      await p.report();
      const result = await Proposal.listToReport(160);
      expect(result).to.have.lengthOf(0);
    });

    it('should return proposal list to check if result is confirmed', async () => {
      const p = await Proposal.findByHash(h2);
      await p.report();
      const result = await Proposal.listToConfirm(160);
      expect(result).to.have.lengthOf(1);
    });

    it('should update an proposal as report confirmed', async () => {
      const p = await Proposal.findByHash(h2);
      await p.report();
      await p.confirmReport();
      const result = await Proposal.listToConfirm(160);
      expect(result).to.have.lengthOf(0);
    });
  });

  describe('listOpened ', () => {
    let h1;
    let h2;

    beforeEach(async () => {
      h1 = cryptoRandomString(30);
      h2 = cryptoRandomString(30);

      await Proposal.register({
        title: 'example',
        code: 'ex-00',
        content: '# Example proposal',
        start: 81,
        end: 130,
        hash: h1,
        reported: false,
        reportConfirmed: false,
      });

      await Proposal.register({
        title: 'example',
        code: 'ex-00',
        content: '# Example proposal',
        start: 120,
        end: 150,
        hash: h2,
        reported: false,
        reportConfirmed: false,
      });
    });

    afterEach(async () => {
      await Proposal.destroy({ where: {}, truncate: true });
    });

    it('should return opened proposal list #1', async () => {
      const result = await Proposal.listOpened(110);
      expect(result).to.have.lengthOf(1);
    });

    it('should return opened proposal list #2', async () => {
      const result = await Proposal.listOpened(120);
      expect(result).to.have.lengthOf(2);
    });

    it('should return opened proposal list #3', async () => {
      const result = await Proposal.listOpened(81);
      expect(result).to.have.lengthOf(1);
    });

    it('should return opened proposal list #2', async () => {
      const result = await Proposal.listOpened(150);
      expect(result).to.have.lengthOf(1);
    });

    it('should return empty list #1', async () => {
      const result = await Proposal.listOpened(80);
      expect(result).to.have.lengthOf(0);
    });

    it('should return empty list #2', async () => {
      const result = await Proposal.listOpened(151);
      expect(result).to.have.lengthOf(0);
    });
  });
});
