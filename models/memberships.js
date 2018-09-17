const { Enum } = require('enumify');

class Status extends Enum {}
Status.initEnum(['active', 'pending', 'verified', 'deleted']);

module.exports = (sequelize, DataTypes) => {
  const Membership = sequelize.define('Membership', {
    publicAddress: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    applicantId: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM, values: ['active', 'pending', 'verified', 'deleted'], defaultValue: Status.pending.name },
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
  Membership.prototype.activate = async function activate() {
    const d = await this.update({ status: Status.active.name });
    return d;
  };

  Membership.prototype.pend = async function pend() {
    const d = await this.update({ status: Status.pending.name });
    return d;
  };

  Membership.prototype.deactivate = async function deactivate() {
    // TODO: prevent public address unique violation
    await this.update({ status: Status.deleted.name });
    const d = await this.destroy();
    return d;
  };

  return Membership;
};
