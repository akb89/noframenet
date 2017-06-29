const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/fn_en_d150',
  logger: logger.info,
  frameNetDir: '/Users/AKB/Dropbox/FrameNetData/fndata-1.5',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
};

module.exports = config;
