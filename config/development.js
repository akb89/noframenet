import logger from './../logger/logger';

const config = {
  dbUri: 'mongodb://localhost:27017/noframenet15dev',
  logger: logger.verbose,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.5/',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
};

export default config;
