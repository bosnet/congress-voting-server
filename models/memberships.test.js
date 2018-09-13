const { expect } = require('chai');
const cryptoRandomString = require('crypto-random-string');

const { sequelize, Membership } = require('./index');

describe('Membership Model', () => {
  let m;
  beforeEach(async () => {
    m = await Membership.register({
      publicAddress: cryptoRandomString(56),
      applicantId: cryptoRandomString(24),
      status: Membership.Status.pending.name,
    });
  });

  it('should register new membership', async () => {
    const result = await Membership.register({
      publicAddress: cryptoRandomString(56),
      applicantId: cryptoRandomString(24),
      status: Membership.Status.pending.name,
    });
    expect(result).to.have.property('id');
  });

  it('should find a existing membership by public address', async () => {
    const result = await Membership.findByAddress(m.publicAddress);
    expect(result.id).to.equal(m.id);
  });

  it('should activate a existing membership', async () => {
    await m.activate();

    await m.reload();
    expect(m.status).to.equal(Membership.Status.active.name);
  });

  it('should pend a existing membership', async () => {
    await m.activate();
    await m.pend();

    await m.reload();
    expect(m.status).to.equal(Membership.Status.pending.name);
  });

  it('should deactivate a existing membership', async () => {
    await m.deactivate();
    const [result] = await sequelize.query(`SELECT status, "deletedAt" from memberships WHERE id=${m.id}`);
    expect(result[0].deletedAt).to.be.not.null;
    expect(result[0].status).to.equal(Membership.Status.deleted.name);
  });
});
