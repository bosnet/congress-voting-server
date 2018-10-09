const { Enum } = require('enumify');

class Status extends Enum {}
Status.initEnum(['pending', 'verified', 'rejected', 'active', 'deleted']);

module.exports = (sequelize, DataTypes) => {
  const Membership = sequelize.define('Membership', {
    publicAddress: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    applicantId: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM,
      values: Status.enumValues.map(s => s.name),
      defaultValue: Status.pending.name,
    },
    isAgreeDelegation: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'memberships',
    paranoid: true,
  });

  // class methods
  Membership.Status = Status;

  Membership.register = async function register(m) {
    const d = await this.build(m).save();
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
  Membership.prototype.pend = async function pend() {
    if (this.status === Status.verified.name || this.status === Status.rejected.name) {
      await this.update({ status: Status.pending.name });
    } else if (this.status === Status.pending.name) { // to renew updatedAt
      await Membership.update({ status: Status.pending.name }, { where: { id: this.id } });
    }
  };

  Membership.prototype.verify = async function verify() {
    if (this.status === Status.pending.name || this.status === Status.rejected.name) {
      await this.update({ status: Status.verified.name });
    }
  };

  Membership.prototype.reject = async function reject() {
    if (this.status === Status.pending.name || this.status === Status.verified.name) {
      await this.update({ status: Status.rejected.name });
    }
  };

  Membership.prototype.activate = async function activate() {
    if (this.status === Status.verified.name) {
      await this.update({ status: Status.active.name });
    }
  };

  Membership.prototype.deactivate = async function deactivate() {
    // TODO: prevent public address unique violation
    await this.update({ status: Status.deleted.name });
    await this.destroy();
  };

  return Membership;
};
