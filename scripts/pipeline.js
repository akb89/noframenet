const path = require('path');
const config = require('./../config');
const driver = require('./../db/mongoose');
const frames = require('./import/frames');
const fullTexts = require('./import/fullTexts');
const lexUnits = require('./import/lexUnits');
//const relations = require('./import/relations');
//const semTypes = require('./import/semTypes');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const logger = config.logger;

async function importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize,
                                  frameDir, frameChunkSize, fullTextDir,
                                  relationsFilePath, semTypesFilePath) {
  await driver.connectToDatabase(dbUri);

  // Maps represent unique objects which are inserted to the database
  // in the end of the pipeline
  const annoSetsMap = new Map();
  const corporaMap = new Map();
  const documentsMap = new Map();
  const framesMap = new Map();
  const fesMap = new Map();
  const lexUnitsMap = new Map();
  const patternsMap = new Map();
  const sentencesMap = new Map();
  const valenceUnitsMap = new Map();
  // Arrays are inserted to the database as import goes on. They gather
  // objects with no unicity constraints.
  const labels = [];
  const lexemes = [];

  await frames.importFrames(frameDir, frameChunkSize, framesMap, fesMap,
                            lexUnitsMap, lexemes);
  logger.info('Frames import completed');
  logger.info(`framesMap.size = ${framesMap.size}`);
  logger.info(`lexUnitsMap.size = ${lexUnitsMap.size}`);
  logger.info(`fesMap.size = ${fesMap.size}`);
  logger.info(`lexemes.length = ${lexemes.length}`);
  await lexUnits.importLexUnits(lexUnitDir, lexUnitChunkSize, annoSetsMap,
                                fesMap, framesMap, patternsMap, sentencesMap,
                                valenceUnitsMap, labels);
  logger.info('LexUnits import completed');
  logger.info(`annoSetsMap.size = ${annoSetsMap.size}`);
  logger.info(`patternsMap.size = ${patternsMap.size}`);
  logger.info(`sentencesMap.size = ${sentencesMap.size}`);
  logger.info(`valenceUnitsMap.size = ${valenceUnitsMap.size}`);
  /*await importRelations.importRelationsOnceConnectedToDb(relationsFilePath);
  logger.info('Relations import completed');
  await importSemTypes.importSemTypesOnceConnectedToDb(semTypesFilePath);
  logger.info('SemTypes import completed');
  await importLexUnits.importLexUnitsOnceConnectedToDb(lexUnitDir,
                                                       lexUnitChunkSize);
  logger.info('LexUnits import completed');*/
  await fullTexts.importFullTexts(fullTextDir, annoSetsMap, corporaMap,
                                  documentsMap, labels, patternsMap,
                                  sentencesMap, valenceUnitsMap);
  logger.info('FullTexts import completed');
  logger.info(`annoSetsMap.size = ${annoSetsMap.size}`);
  logger.info(`corporaMap.size = ${corporaMap.size}`);
  logger.info(`documentsMap.size = ${documentsMap.size}`);
  logger.info(`patternsMap.size = ${patternsMap.size}`);
  logger.info(`sentencesMap.size = ${sentencesMap.size}`);
  logger.info(`valenceUnitsMap.size = ${valenceUnitsMap.size}`);
  await mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.dbUri;
  const lexUnitDir = path.join(config.frameNetDir, 'lu');
  const lexUnitChunkSize = config.lexUnitChunkSize;
  const frameDir = path.join(config.frameNetDir, 'frame');
  const frameChunkSize = config.frameChunkSize;
  const fullTextDir = path.join(config.frameNetDir, 'fulltext');
  const relationsFilePath = path.join(config.frameNetDir, 'frRelation.xml');
  const semTypesFilePath = path.join(config.frameNetDir, 'semTypes.xml');
  importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize, frameDir,
                     frameChunkSize, fullTextDir, relationsFilePath,
                     semTypesFilePath)
    .then(() => logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`));
}
