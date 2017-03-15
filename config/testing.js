import logger from './../logger/logger';

const config = {
  dbUri: 'mongodb://localhost:27017/noframenet16test',
  logger: logger.warn,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.6/',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
};

export default config;
