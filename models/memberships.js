const { Enum } = require('enumify');
const { hash } = require('sebakjs-util');

class Status extends Enum {}
Status.initEnum(['init', 'pending', 'verified', 'rejected', 'active', 'deleted']);

module.exports = (sequelize, DataTypes) => {
  const Membership = sequelize.define('Membership', {
    publicAddress: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    applicantId: { type: DataTypes.STRING(40), unique: true },
    status: {
      type: DataTypes.ENUM,
      values: Status.enumValues.map(s => s.name),
      defaultValue: Status.init.name,
    },
    isAgreeDelegation: { type: DataTypes.BOOLEAN, defaultValue: false },
    activatedAt: { type: DataTypes.INTEGER },
    deactivatedAt: { type: DataTypes.INTEGER },
  }, {
    tableName: 'memberships',
    paranoid: true,
  });

  const MembershipLog = sequelize.define('MembershipLog', {
    membershipId: { type: DataTypes.INTEGER },
    publicAddress: { type: DataTypes.STRING(60), allowNull: false },
    applicantId: { type: DataTypes.STRING(40) },
    status: { type: DataTypes.STRING(10) },
    isAgreeDelegation: { type: DataTypes.BOOLEAN },
    activatedAt: { type: DataTypes.INTEGER },
    deactivatedAt: { type: DataTypes.INTEGER },
    signature: { type: DataTypes.STRING(100) },
  }, { tableName: 'memberships_log' });

  MembershipLog.register = async function register(m) {
    const d = await this.build({
      membershipId: m.id,
      publicAddress: m.publicAddress,
      applicantId: m.applicantId,
      status: m.status,
      isAgreeDelegation: m.isAgreeDelegation,
      activatedAt: m.activatedAt,
      deactivatedAt: m.deactivatedAt,
      signature: m.signature,
    }).save();
    return d;
  };

  // class methods
  Membership.Status = Status;

  Membership.register = async function register(m, sig) {
    const d = await this.build(m).save();
    await MembershipLog.register(Object.assign({ signature: sig }, d.toJSON()));
    return d;
  };

  Membership.findByAddress = async function findByAddress(address) {
    const d = await this.findOne({
      where: {
        publicAddress: address,
      },
    });

    return d;
  };

  // instance methods
  Membership.prototype.pend = async function pend(applicantId) {
    if (this.status === Status.init.name) {
      if (applicantId) {
        await this.update({ applicantId, status: Status.pending.name });
      } else {
        await this.update({ status: Status.pending.name });
      }
    } else if (this.status === Status.verified.name || this.status === Status.rejected.name) {
      await this.update({ status: Status.pending.name });
    } else if (this.status === Status.pending.name) { // to renew updatedAt
      await Membership.update({ status: Status.pending.name }, { where: { id: this.id } });
    }
    await MembershipLog.register(Object.assign({ membershipId: this.id }, this.toJSON()));
  };

  Membership.prototype.verify = async function verify() {
    if (this.status === Status.pending.name || this.status === Status.rejected.name) {
      await this.update({ status: Status.verified.name });
      await MembershipLog.register(Object.assign({ membershipId: this.id }, this.toJSON()));
    }
  };

  Membership.prototype.reject = async function reject() {
    if (this.status === Status.pending.name || this.status === Status.verified.name) {
      await this.update({ status: Status.rejected.name });
      await MembershipLog.register(Object.assign({ membershipId: this.id }, this.toJSON()));
    }
  };

  Membership.prototype.activate = async function activate(height = 0, sig) {
    if (this.status === Status.verified.name) {
      await this.update({ status: Status.active.name, activatedAt: height });
      await MembershipLog.register(
        Object.assign(
          { signature: sig, membershipId: this.id },
          this.toJSON(),
        ),
      );
    }
  };

  Membership.prototype.deactivate = async function deactivate(height = 0, sig) {
    // TODO: prevent public address unique violation
    await this.update({
      publicAddress: hash([this.publicAddress, height]),
      status: Status.deleted.name,
      deactivatedAt: height,
    });
    await MembershipLog.register(
      Object.assign(
        { signature: sig, membershipId: this.id },
        this.toJSON(),
      ),
    );
    await this.destroy();
  };

  return Membership;
};
