module.exports = {
  up: queryInterface => queryInterface.sequelize.query(
    'ALTER TYPE enum_memberships_status ADD VALUE IF NOT EXISTS \'init\' BEFORE \'pending\'',
  ),
  down: () => {
    // not remove existing enum values
  },
};
