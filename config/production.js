const logger = require('./../logger/logger');

const config = {
  dbUri: 'mongodb://localhost:27017/fn_en_170_dev',
  logger: logger.info,
  frameNetDir: '/Users/AKB/GitHub/dFN/data/fndata-1.7-with-dev',
  splitsDir: '/Users/AKB/GitHub/dFN/data/fndata-1.7-with-dev/dev',
  importLexUnits: false,
  importFullTexts: true,
  frameChunkSize: 150,
  lexUnitChunkSize: 200,
};

module.exports = config;
