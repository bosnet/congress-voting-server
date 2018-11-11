'use strict';
module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(
      'ALTER TYPE enum_memberships_status ADD VALUE IF NOT EXISTS \'init\' BEFORE \'pending\''
    );
  },
  down: (queryInterface, Sequelize) => {
    // not remove existing enum values
  }
};
