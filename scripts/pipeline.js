const path = require('path');
const Frame = require('noframenet-core').Frame;
const FrameElement = require('noframenet-core').FrameElement;
const LexUnit = require('noframenet-core').LexUnit;
const Lexeme = require('noframenet-core').Lexeme;
const config = require('./../config');
const driver = require('./../db/mongoose');
const frames = require('./import/frames');
const fullTexts = require('./import/fullTexts');
const lexUnits = require('./import/lexUnits');
const relations = require('./import/relations');
const semTypes = require('./import/semTypes');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const logger = config.logger;

async function saveFramesStepDataToDatabase(framesMap, fesMap, lexUnitsMap,
                                            lexemes) {
  await Promise.all([
    Frame.collection.insertMany(Array.from(framesMap.values())),
    FrameElement.collection.insertMany(Array.from(fesMap.values())),
    LexUnit.collection.insertMany(Array.from(lexUnitsMap.values())),
    Lexeme.collection.insertMany(lexemes),
  ]);
}

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
  const frameRelations = [];
  const frameRelationTypes = [];
  const feRelations = [];
  let labels = []; // We'll need this twice and the array can get pretty big.
                  // It will be useful to empty the array to free some memory.
  const lexemes = [];

  await frames.extractFrames(frameDir, frameChunkSize, framesMap, fesMap,
                             lexUnitsMap, lexemes);
  logger.info('Done processing frames');
  logger.info(`framesMap.size = ${framesMap.size}`);
  logger.info(`lexUnitsMap.size = ${lexUnitsMap.size}`);
  logger.info(`fesMap.size = ${fesMap.size}`);
  logger.info(`lexemes.length = ${lexemes.length}`);

  await saveFramesStepDataToDatabase(framesMap, fesMap, lexUnitsMap, lexemes);

  await relations.extractRelations(relationsFilePath, frameRelationTypes,
                                   frameRelations, feRelations);
  logger.info('Done extracting relations');
  await semTypes.extractSemTypes(semTypesFilePath, semTypes);
  logger.info('Done extracting semTypes');
  await lexUnits.extractLexUnits(lexUnitDir, lexUnitChunkSize, annoSetsMap,
                                 labels, patternsMap, sentencesMap,
                                 valenceUnitsMap);
  logger.info('Done processing lexUnits');
  labels = []; // Free some memory
  await fullTexts.importFullTexts(fullTextDir, annoSetsMap, corporaMap,
                                  documentsMap, labels, patternsMap,
                                  sentencesMap, valenceUnitsMap);
  logger.info('Done processing fullTexts');
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
