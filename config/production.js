import logger from './../logger/logger';

const config = {
  dbUri: 'mongodb://localhost:27017/valencer',
  logger: logger.info,
  lexUnitDir: '/Users/AKB/Desktop/fndata-1.6/lu',
  frameDir: '/Users/AKB/Desktop/fndata-1.6/frame',
  fullTextDir: '/Users/AKB/Desktop/fndata-1.6/fulltext',
  relationsFilePath: '/Users/AKB/Desktop/fndata-1.6/frRelation.xml',
  semTypesFilePath: '/Users/AKB/Desktop/fndata-1.6/semTypes.xml',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
  fullTextChunkSize: 20,
};

export default config;
