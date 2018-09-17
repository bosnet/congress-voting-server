const decamelize = require('decamelize');

module.exports = {
  underscored: (obj) => {
    const newObj = {};
    Object.keys(obj).forEach((key) => {
      newObj[decamelize(key)] = obj[key];
    });
    return newObj;
  },
};
