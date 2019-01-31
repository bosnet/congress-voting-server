module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    sid: { type: DataTypes.STRING, primaryKey: true },
    address: DataTypes.STRING(60),
    expires: DataTypes.DATE,
    data: DataTypes.STRING(50000),
  }, {
    tableName: 'session',
  });

  return Session;
};
