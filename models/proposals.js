module.exports = (sequelize, DataTypes) => {
  const Proposal = sequelize.define('Proposal', {
    // based on https://github.com/bosnet/sebak/pull/447
    title: { type: DataTypes.STRING },
    code: { type: DataTypes.STRING(100) },
    content: { type: DataTypes.TEXT, allowNull: false },
    start: { type: DataTypes.BIGINT },
    end: { type: DataTypes.BIGINT },
    opHash: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    txHash: { type: DataTypes.STRING(200), allowNull: true },
    blockHash: { type: DataTypes.STRING(200), allowNull: true },
    proposerAddress: { type: DataTypes.STRING(200), allowNull: true },
    fundingAddress: { type: DataTypes.STRING(100), allowNull: true },
    amount: { type: DataTypes.STRING(100), allowNull: true },
    reported: { type: DataTypes.BOOLEAN, defaultValue: false },
    reportConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },

    // voting result
    resultMembershipHash: { type: DataTypes.STRING(150) },
    resultMembershipPath: { type: DataTypes.STRING(150) },
    resultVotersHash: { type: DataTypes.STRING(150) },
    resultVotersPath: { type: DataTypes.STRING(150) },
    resultBallotHash: { type: DataTypes.STRING(150) },
    resultBallotPath: { type: DataTypes.STRING(150) },
    resultCount: { type: DataTypes.INTEGER },
    resultYes: { type: DataTypes.INTEGER },
    resultNo: { type: DataTypes.INTEGER },
    resultAbs: { type: DataTypes.INTEGER },
  }, {
    tableName: 'proposals',
    paranoid: true,
  });

  // class methods
  Proposal.register = async function register(m) {
    const exist = await this.findOne({ where: { opHash: m.opHash } });
    if (!exist) {
      return this.build(m).save();
    }
    return null;
  };

  Proposal.findByOpHash = async function findByOpHash(opHash) {
    return this.findOne({ where: { opHash } });
  };

  Proposal.findById = async function findById(id) {
    return this.findOne({ where: { id } });
  };

  Proposal.list = async function list() {
    return this.findAll({});
  };

  Proposal.listToReport = async function listToReport(currentBlock = 0) {
    return this.findAll({
      where: {
        reported: false,
        end: { [sequelize.Op.lt]: currentBlock },
      },
    });
  };

  Proposal.listToConfirm = async function listToConfirm(currentBlock = 0) {
    return this.findAll({
      where: {
        reported: true,
        reportConfirmed: false,
        end: { [sequelize.Op.lt]: currentBlock },
      },
    });
  };

  Proposal.listOpened = async function listOpened(currentBlock = 0) {
    return this.findAll({
      where: {
        start: { [sequelize.Op.lte]: currentBlock },
        end: { [sequelize.Op.gte]: currentBlock },
      },
    });
  };

  // instance methods
  Proposal.prototype.report = async function report(result) {
    return this.update({
      reported: true,
      resultMembershipHash: result.membershipHash,
      resultMembershipPath: result.membershipPath,
      resultVotersHash: result.votersHash,
      resultVotersPath: result.votersPath,
      resultBallotHash: result.ballotHash,
      resultBallotPath: result.ballotPath,
      resultCount: result.count,
      resultYes: result.yes,
      resultNo: result.no,
      resultAbs: result.abs,
    });
  };

  Proposal.prototype.confirmReport = async function confirmReport() {
    return this.update({ reportConfirmed: true });
  };

  return Proposal;
};
