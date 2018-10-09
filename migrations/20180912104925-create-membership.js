module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('memberships', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    publicAddress: {
      type: Sequelize.STRING(60),
      allowNull: false,
      unique: true,
    },
    applicantId: { type: Sequelize.STRING(40) },
    status: {
      type: Sequelize.ENUM,
      values: ['pending', 'verified', 'rejected', 'active', 'deleted'],
    },
    isAgreeDelegation: { type: Sequelize.BOOLEAN },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
    deletedAt: { type: Sequelize.DATE },
    activatedAt: { type: Sequelize.INTEGER },
    deactivatedAt: { type: Sequelize.INTEGER },
  }),
  down: queryInterface => queryInterface.dropTable('memberships'),
};
