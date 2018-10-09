module.exports = (sequelize, DataTypes) => {
  const Proposal = sequelize.define('Proposal', {
    // based on https://github.com/bosnet/sebak/pull/447
    title: { type: DataTypes.STRING },
    code: { type: DataTypes.STRING(100) },
    content: { type: DataTypes.TEXT, allowNull: false },
    start: { type: DataTypes.INTEGER },
    end: { type: DataTypes.INTEGER },
    hash: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    reported: { type: DataTypes.BOOLEAN, defaultValue: false },
    reportConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'proposals',
    paranoid: true,
  });

  // class methods
  Proposal.register = async function register(m) {
    const exist = await this.findOne({ where: { hash: m.hash } });
    if (!exist) {
      const d = await this.build(m).save();
      return d;
    }
    return null;
  };

  Proposal.findByHash = async function findByHash(hash) {
    const d = await this.findOne({ where: { hash } });
    return d;
  };

  Proposal.findById = async function findById(id) {
    const d = await this.findOne({ where: { id } });
    return d;
  };

  Proposal.list = async function list() {
    const prs = await this.findAll({});
    return prs;
  };

  Proposal.listToReport = async function listToReport(currentBlock = 0) {
    const prs = await this.findAll({
      where: {
        reported: false,
        end: { [sequelize.Op.lt]: currentBlock },
      },
    });
    return prs;
  };

  Proposal.listToConfirm = async function listToConfirm(currentBlock = 0) {
    const prs = await this.findAll({
      where: {
        reported: true,
        reportConfirmed: false,
        end: { [sequelize.Op.lt]: currentBlock },
      },
    });
    return prs;
  };

  // instance methods
  Proposal.prototype.report = async function report() {
    await this.update({ reported: true });
  };

  Proposal.prototype.confirmReport = async function confirmReport() {
    await this.update({ reportConfirmed: true });
  };

  return Proposal;
};
