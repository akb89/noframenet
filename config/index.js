'use strict';

import Logger from './../logger';

const config = {
  dbUri: 'mongodb://localhost:27017/dev',
  port: 3030,
  logger: Logger.info,
  lexUnitDir: '/Users/AKB/Desktop/fndata-1.6/lu',
  frameDir: '/Users/AKB/Desktop/fndata-1.6/frame',
  fullTextDir: '/Users/AKB/Desktop/fndata-1.6/fulltext',
  relationsFilePath: '/Users/AKB/Desktop/fndata-1.6/frRelation.xml',
  semTypesFilePath: '/Users/AKB/Desktop/fndata-1.6/semTypes.xml',
  validLayers: ['FE', 'PT', 'GF'], // Configured this way for scalability, as
  // other languages may use additional specific layers
  // validLayers: ['FE', 'PT', 'GF', 'Target', 'PENN', 'NER', 'WSL', 'Other',
  //  'Sent', 'Noun']
  frameChunkSize: 100,
  lexUnitChunkSize: 200,
  fullTextChunkSize: 100,
};

export default config;
