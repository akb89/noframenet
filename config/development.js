const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/fn_en_d160_dev',
  logger: logger.verbose,
  frameNetDir: '/Users/AKB/Dropbox/FrameNetData/fndata-1.6',
  frameChunkSize: 100,
  lexUnitChunkSize: 200,
};

module.exports = config;
