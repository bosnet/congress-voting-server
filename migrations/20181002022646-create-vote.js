module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('votes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      proposalId: { type: Sequelize.INTEGER, unique: 'proposal_voter_index', allowNull: false },
      publicAddress: { type: Sequelize.STRING(60), unique: 'proposal_voter_index', allowNull: false },
      ballot: { type: Sequelize.STRING(50), allowNull: false },
      answer: {
        type: Sequelize.ENUM,
        values: ['yes', 'no', 'abs'],
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
      deletedAt: { type: Sequelize.DATE },
    });

    await queryInterface.addIndex('votes', ['proposalId', 'publicAddress'], {
      indexName: 'votes_proposalid_publicaddress_unique',
      indicesType: 'UNIQUE',
    });

    await queryInterface.createTable('votes_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      proposalId: { type: Sequelize.INTEGER, allowNull: false },
      publicAddress: { type: Sequelize.STRING(60), allowNull: false },
      ballot: { type: Sequelize.STRING(50), allowNull: false },
      answer: { type: Sequelize.STRING(3), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('votes');
    await queryInterface.removeIndex('votes', 'votes_proposalid_publicaddress_unique');
    await queryInterface.dropTable('votes_log');
  },
};
