const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/fn_en_d150',
  logger: logger.info,
  frameNetDir: '/Users/AKB/Dropbox/FrameNetData/fndata-1.5',
  frameChunkSize: 150,
  lexUnitChunkSize: 200,
};

module.exports = config;
