const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/noframenet15',
  logger: logger.info,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.5/',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
};

module.exports = config;
