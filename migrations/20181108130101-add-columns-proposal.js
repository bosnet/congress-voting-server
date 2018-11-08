'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('proposals', 'txHash', Sequelize.STRING(200)),
      queryInterface.addColumn('proposals', 'blockHeight', Sequelize.BIGINT),
      queryInterface.addColumn('proposals', 'proposerAddress', Sequelize.STRING(200)),
      queryInterface.changeColumn('proposals', 'start', Sequelize.BIGINT),
      queryInterface.changeColumn('proposals', 'end', Sequelize.BIGINT),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('proposals', 'txHash'),
      queryInterface.removeColumn('proposals', 'blockHeight'),
      queryInterface.removeColumn('proposals', 'proposerAddress'),
      queryInterface.changeColumn('proposals', 'start', Sequelize.INTEGER),
      queryInterface.changeColumn('proposals', 'end', Sequelize.INTEGER),
    ]);
  }
};
