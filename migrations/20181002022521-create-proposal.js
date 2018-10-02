module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('proposals', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    title: { type: Sequelize.STRING },
    code: { type: Sequelize.STRING(100) },
    content: { type: Sequelize.TEXT, allowNull: false },
    start: { type: Sequelize.INTEGER },
    end: { type: Sequelize.INTEGER },
    hash: { type: Sequelize.STRING(100), allowNull: false, unique: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
    deletedAt: { type: Sequelize.DATE },
  }),
  down: queryInterface => queryInterface.dropTable('proposals'),
};
