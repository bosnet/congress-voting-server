const { expect } = require('chai');
const cryptoRandomString = require('crypto-random-string');

const { sequelize, Membership } = require('./index');

describe('Membership Model', () => {
  let m;
  beforeEach(async () => {
    m = await Membership.register({
      publicAddress: cryptoRandomString(56),
      status: Membership.Status.init.name,
    });
  });

  after(async () => {
    await Membership.destroy({ where: {}, truncate: true });
  });

  it('should register new membership', async () => {
    const result = await Membership.register({
      publicAddress: cryptoRandomString(56),
      status: Membership.Status.init.name,
    });
    expect(result).to.have.property('id');
  });

  it('should find a existing membership by public address', async () => {
    const result = await Membership.findByAddress(m.publicAddress);
    expect(result.id).to.equal(m.id);
  });

  it('should verify a pending membership', async () => {
    await m.pend();
    await m.verify();

    expect(m.status).to.equal(Membership.Status.verified.name);
  });

  it('should verify a existing membership only init, pending or rejected', async () => {
    const u = await Membership.register({
      publicAddress: cryptoRandomString(56),
      status: Membership.Status.active.name,
    });

    await u.verify();

    expect(u.status).to.equal(Membership.Status.active.name);
  });

  it('should reject a existing membership', async () => {
    await m.pend();
    await m.reject();

    expect(m.status).to.equal(Membership.Status.rejected.name);
  });

  it('should reject a existing membership only init, pending or verified', async () => {
    const u = await Membership.register({
      publicAddress: cryptoRandomString(56),
      status: Membership.Status.active.name,
    });

    await u.reject();

    expect(u.status).to.equal(Membership.Status.active.name);
  });

  it('should activate a existing membership', async () => {
    const u = await Membership.register({
      publicAddress: cryptoRandomString(56),
      status: Membership.Status.verified.name,
    });

    await u.activate(12);

    expect(u.status).to.equal(Membership.Status.active.name);
    expect(u.activatedAt).to.equal(12);
  });

  it('should activate a existing membership only verified', async () => {
    await m.pend();
    await m.activate(10);

    await m.reload();
    expect(m.status).to.equal(Membership.Status.pending.name);
  });

  it('should pend an init membership with applicantId', async () => {
    const u = await Membership.register({
      publicAddress: cryptoRandomString(56),
      status: Membership.Status.init.name,
    });

    const id = cryptoRandomString(24);
    await u.pend(id);

    expect(u.status).to.equal(Membership.Status.pending.name);
    expect(u.applicantId).to.equal(id);
  });

  it('should pend a existing membership', async () => {
    const u = await Membership.register({
      publicAddress: cryptoRandomString(56),
      status: Membership.Status.rejected.name,
    });

    await u.pend();

    expect(u.status).to.equal(Membership.Status.pending.name);
  });

  it('should pend a existing membership only verified or rejected', async () => {
    const u = await Membership.register({
      publicAddress: cryptoRandomString(56),
      status: Membership.Status.active.name,
    });

    await u.pend();

    expect(u.status).to.equal(Membership.Status.active.name);
  });

  it('should deactivate a existing membership', async () => {
    await m.deactivate(13);
    const [result] = await sequelize.query(`SELECT status, "deletedAt", "deactivatedAt" from memberships WHERE id=${m.id}`);
    expect(result[0].deletedAt).to.be.not.null;
    expect(result[0].status).to.equal(Membership.Status.deleted.name);
    expect(result[0].deactivatedAt).to.equal(13);
  });

  it('should register membership with deleted address', async () => {
    const newUser = {
      publicAddress: m.publicAddress,
      status: Membership.Status.pending.name,
    };
    await m.deactivate(13);

    const result = await Membership.register(newUser);
    expect(result).to.have.property('id').to.not.equal(m.id);
  });
});
