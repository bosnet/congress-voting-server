module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('session', {
      sid: { type: Sequelize.STRING, primaryKey: true },
      address: Sequelize.STRING(60),
      expires: Sequelize.DATE,
      data: Sequelize.STRING(50000),
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('session');
  },
};
