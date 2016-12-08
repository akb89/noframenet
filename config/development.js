import logger from './../logger/logger';

const config = {
  dbUri: 'mongodb://localhost:27017/noframenet16dev',
  logger: logger.info,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.6/',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
  fullTextChunkSize: 20,
};

export default config;
