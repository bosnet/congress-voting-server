const { Enum } = require('enumify');
const uuidv4 = require('uuid/v4');

class Answer extends Enum {}
Answer.initEnum(['yes', 'no', 'abs']);

module.exports = (sequelize, DataTypes) => {
  const Vote = sequelize.define('Vote', {
    proposalId: { type: DataTypes.INTEGER, unique: 'votes_proposalid_publicaddress_unique', allowNull: false },
    publicAddress: { type: DataTypes.STRING(60), unique: 'votes_proposalid_publicaddress_unique', allowNull: false },
    ballot: { type: DataTypes.STRING(50), defaultValue: uuidv4() },
    answer: {
      type: DataTypes.ENUM,
      values: Answer.enumValues.map(s => s.name),
      allowNull: false,
    },
  }, {
    tableName: 'votes',
    paranoid: true,
  });

  const VoteLog = sequelize.define('VoteLog', {
    proposalId: { type: DataTypes.INTEGER, allowNull: false },
    publicAddress: { type: DataTypes.STRING(60), allowNull: false },
    ballot: { type: DataTypes.STRING(50), allowNull: false },
    answer: { type: DataTypes.STRING(3), allowNull: false },
  }, { tableName: 'votes_log' });

  VoteLog.register = async function register(m) {
    const d = await this.build({
      proposalId: m.proposalId,
      publicAddress: m.publicAddress,
      ballot: m.ballot,
      answer: m.answer,
    }).save();
    return d;
  };

  // class methods
  Vote.Answer = Answer;

  Vote.register = async function register(m) {
    const exist = await this.findOne({
      where: {
        proposalId: m.proposalId,
        publicAddress: m.publicAddress,
      },
    });

    if (!exist) {
      const d = await this.build({
        proposalId: m.proposalId,
        publicAddress: m.publicAddress,
        ballot: uuidv4(),
        answer: Answer.enumValueOf(m.answer).name,
      }).save();
      await VoteLog.register(d);
      return d;
    }

    const d = await exist.update({
      ballot: uuidv4(),
      answer: Answer.enumValueOf(m.answer).name,
    });
    await VoteLog.register(d);
    return d;
  };

  return Vote;
};
