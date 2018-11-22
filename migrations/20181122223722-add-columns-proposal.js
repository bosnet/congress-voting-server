module.exports = {
  up: (queryInterface, Sequelize) => Promise.all([
    queryInterface.addColumn('proposals', 'conditionRatio', Sequelize.FLOAT),
  ]),
  down: queryInterface => Promise.all([
    queryInterface.removeColumn('proposals', 'conditionRatio'),
  ]),
};
