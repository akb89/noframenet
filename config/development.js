const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/fn_en_d150_dev',
  logger: logger.verbose,
  frameNetDir: '/Users/AKB/Dropbox/FrameNetData/fndata-1.5',
  frameChunkSize: 100,
  lexUnitChunkSize: 200,
};

module.exports = config;
