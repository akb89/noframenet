const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/noframenet15dev',
  logger: logger.debug,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.5/',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
};

module.exports = config;
