const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/noframenet17dev',
  logger: logger.debug,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.7/',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
};

module.exports = config;
