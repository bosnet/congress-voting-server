const pino = require('pino');

const logger = pino({
  level: 'error',
});

module.exports = logger;
