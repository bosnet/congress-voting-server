module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn(
    'memberships_log',
    'membershipId',
    Sequelize.INTEGER,
  ),
  down: queryInterface => queryInterface.removeColumn(
    'memberships_log',
    'membershipId',
  ),
};
