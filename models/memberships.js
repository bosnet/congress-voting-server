const { Enum } = require('enumify');

class Status extends Enum {}
Status.initEnum(['active', 'pending', 'deleted']);

module.exports = (sequelize, DataTypes) => {
  const Membership = sequelize.define('Membership', {
    publicAddress: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    applicantId: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM, values: ['active', 'pending', 'deleted'], defaultValue: Status.pending.name },
  }, {
    tableName: 'memberships',
    paranoid: true,
  });

  return Membership;
};
