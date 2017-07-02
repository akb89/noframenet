const path = require('path');
const AnnotationSet = require('noframenet-core').AnnotationSet;
const Corpus = require('noframenet-core').Corpus;
const Document = require('noframenet-core').Document;
const Frame = require('noframenet-core').Frame;
const FrameElement = require('noframenet-core').FrameElement;
const FERelation = require('noframenet-core').FERelation;
const FrameRelation = require('noframenet-core').FrameRelation;
const FrameRelationType = require('noframenet-core').FrameRelationType;
const Label = require('noframenet-core').Label;
const LexUnit = require('noframenet-core').LexUnit;
const Lexeme = require('noframenet-core').Lexeme;
const Pattern = require('noframenet-core').Pattern;
const SemType = require('noframenet-core').SemType;
const Sentence = require('noframenet-core').Sentence;
const ValenceUnit = require('noframenet-core').ValenceUnit;
const config = require('./../config');
const driver = require('./../db/mongoose');
const framesExtractor = require('./extraction/frames');
const fullTextsExtractor = require('./extraction/fullTexts');
const lexUnitsExtractor = require('./extraction/lexUnits');
const relationsExtractor = require('./extraction/relations');
const semTypesExtractor = require('./extraction/semTypes');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const logger = config.logger;

async function saveFullTextDataToDatabase(annoSetsMap, corporaMap, documentsMap,
                                          labels, patternsMap, sentencesMap,
                                          valenceUnitsMap) {
  return Promise.all([
    AnnotationSet.collection.insertMany(Array.from(annoSetsMap.values())),
    Corpus.collection.insertMany(Array.from(corporaMap.values())),
    Document.collection.insertMany(Array.from(documentsMap.values())),
    Label.collection.insertMany(labels),
    Pattern.collection.insertMany(Array.from(patternsMap.values())),
    Sentence.collection.insertMany(Array.from(sentencesMap.values())),
    ValenceUnit.collection.insertMany(Array.from(valenceUnitsMap.values())),
  ]);
}

async function saveRelationsAndSemTypesToDatabase(feRelations, frameRelations,
                                                  frameRelationTypes, semTypes) {
  return Promise.all([
    FERelation.collection.insertMany(feRelations),
    FrameRelation.collection.insertMany(frameRelations),
    FrameRelationType.collection.insertMany(frameRelationTypes),
    SemType.collection.insertMany(semTypes),
  ]);
}

async function saveFramesDataToDatabase(framesMap, fesMap, lexUnitsMap,
                                        lexemes) {
  return Promise.all([
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
  const semTypes = [];

  await framesExtractor.extractFrames(frameDir, frameChunkSize, framesMap,
                                      fesMap, lexUnitsMap, lexemes);
  logger.info('Done extracting frames');

  await saveFramesDataToDatabase(framesMap, fesMap, lexUnitsMap, lexemes);

  await relationsExtractor.extractRelations(relationsFilePath, feRelations,
                                            frameRelations, frameRelationTypes);
  logger.info('Done extracting relations');
  logger.verbose(`   frameRelationTypes.length = ${frameRelationTypes.length}`);
  logger.verbose(`   frameRelations.length = ${frameRelations.length}`);
  logger.verbose(`   feRelations.length = ${feRelations.length}`);

  await semTypesExtractor.extractSemTypes(semTypesFilePath, semTypes);
  logger.info('Done extracting semTypes');
  logger.verbose(`  semTypes.length = ${semTypes.length}`);

  await saveRelationsAndSemTypesToDatabase(feRelations, frameRelations,
                                           frameRelationTypes, semTypes);

  await lexUnitsExtractor.extractLexUnits(lexUnitDir, lexUnitChunkSize,
                                          annoSetsMap, labels, patternsMap,
                                          sentencesMap, valenceUnitsMap);
  logger.info('Done extracting lexUnits');

  // Label.collection.insertMany(labels); // Do not await this as it takes a
  // long time to process

  const labelCount = labels.length;
  labels = []; // Free some memory. Does this work as intended if saveLabels is
              // asynchronous?
  await fullTextsExtractor.extractFullTexts(fullTextDir, annoSetsMap,
                                            corporaMap, documentsMap, labels,
                                            patternsMap, sentencesMap,
                                            valenceUnitsMap);
  logger.info('Done extracting fullTexts');

  await saveFullTextDataToDatabase(annoSetsMap, corporaMap, documentsMap,
                                   labels, patternsMap, sentencesMap,
                                   valenceUnitsMap);

  logger.verbose(`  annoSetsMap.size = ${annoSetsMap.size}`);
  logger.verbose(`  corporaMap.size = ${corporaMap.size}`);
  logger.verbose(`  documentsMap.size = ${documentsMap.size}`);
  logger.verbose(`  fesMap.size = ${fesMap.size}`);
  logger.verbose(`  framesMap.size = ${framesMap.size}`);
  logger.verbose(`  labels.length = ${labels.length + labelCount}`);
  logger.verbose(`  lexemes.length = ${lexemes.length}`);
  logger.verbose(`  lexUnitsMap.size = ${lexUnitsMap.size}`);
  logger.verbose(`  patternsMap.size = ${patternsMap.size}`);
  logger.verbose(`  sentencesMap.size = ${sentencesMap.size}`);
  logger.verbose(`  valenceUnitsMap.size = ${valenceUnitsMap.size}`);
  await mongoose.disconnect(); // TODO: remove this?
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
