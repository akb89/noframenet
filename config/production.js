const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/fn_en_170',
  logger: logger.info,
  frameNetDir: '/Users/AKB/Dropbox/FrameNetData/fndata-1.7',
  splitsDir: '/Users/AKB/Dropbox/FrameNetData/fndata-1.7',
  importLexUnits: true,
  importFullTexts: true,
  importHierarchy: true,
  frameChunkSize: 150,
  lexUnitChunkSize: 200,
};

module.exports = config;
