module.exports = {
  up: (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn('proposals', 'opHash', Sequelize.STRING(200)),
    queryInterface.addColumn('proposals', 'blockHash', Sequelize.STRING(200)),
    queryInterface.addColumn('proposals', 'fundingAddress', Sequelize.STRING(100)),
    queryInterface.addColumn('proposals', 'amount', Sequelize.STRING(100)),
    queryInterface.removeColumn('proposals', 'hash'),
    queryInterface.removeColumn('proposals', 'blockHeight'),
  ]),
  down: (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn('proposals', 'blockHeight', Sequelize.BIGINT),
    queryInterface.addColumn('proposals', 'hash', Sequelize.STRING(100)),
    queryInterface.removeColumn('proposals', 'opHash'),
    queryInterface.removeColumn('proposals', 'blockHash'),
    queryInterface.removeColumn('proposals', 'fundingAddress'),
    queryInterface.removeColumn('proposals', 'amount'),
  ]),
};
