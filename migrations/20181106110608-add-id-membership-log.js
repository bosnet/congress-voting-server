'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('memberships_log', 'membershipId', Sequelize.INTEGER);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('memberships_log', 'membershipId');
  }
};
