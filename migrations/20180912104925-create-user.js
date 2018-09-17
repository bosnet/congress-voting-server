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
    applicantId: {
      type: Sequelize.STRING(40),
    },
    status: {
      type: Sequelize.ENUM,
      values: ['active', 'pending', 'verified', 'deleted'],
    },
    isAgreeDelegation: {
      type: Sequelize.BOOLEAN,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    deletedAt: {
      type: Sequelize.DATE,
    },
  }),
  down: queryInterface => queryInterface.dropTable('memberships'),
};
