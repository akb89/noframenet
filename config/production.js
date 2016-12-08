import logger from './../logger/logger';

const config = {
  dbUri: 'mongodb://localhost:27017/noframenet16',
  logger: logger.debug,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.6/',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
  fullTextChunkSize: 20,
};

export default config;
