const path = require('path');
const AnnotationSet = require('noframenet-core').AnnotationSet;
const Corpus = require('noframenet-core').Corpus;
const Document = require('noframenet-core').Document;
const Frame = require('noframenet-core').Frame;
const FrameElement = require('noframenet-core').FrameElement;
const FEHierarchy = require('noframenet-core').FEHierarchy;
const FrameHierarchy = require('noframenet-core').FrameHierarchy;
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
const mongoose = require('mongoose');
const Promise = require('bluebird');

const config = require('./../config');
const driver = require('./../db/mongoose');
const hierarchiesExtractor = require('./extraction/hierarchies');
const framesExtractor = require('./extraction/frames');
const fullTextsExtractor = require('./extraction/fullTexts');
const lexUnitsExtractor = require('./extraction/lexUnits');
const relationsExtractor = require('./extraction/relations');
const semTypesExtractor = require('./extraction/semTypes');

mongoose.Promise = Promise;

const logger = config.logger;

const INSERTMANY_BATCH_SIZE = 1000;

async function saveDataToDatabase(annoSetsMap, corporaMap, documentsMap,
                                  labels, patternsMap, sentencesMap,
                                  valenceUnitsMap) {
  const annosets = Array.from(annoSetsMap.values());
  const corpora = Array.from(corporaMap.values());
  const documents = Array.from(documentsMap.values());
  const patterns = Array.from(patternsMap.values());
  const sentences = Array.from(sentencesMap.values());
  const valenceUnits = Array.from(valenceUnitsMap.values());
  logger.info('Saving AnnotationSet documents...');
  // await AnnotationSet.collection.insertMany(annosets, { ordered: false });
  // Fixed bug with v3.6.2 of mongodb where BSON object size limit is exceeded
  // when processing all annosets at once (same for sentences below)
  for (let i = 0; i < annosets.length; i += INSERTMANY_BATCH_SIZE) {
    await AnnotationSet.collection.insertMany(annosets.slice(i, i + INSERTMANY_BATCH_SIZE),
                                              { ordered: false });
  }
  logger.info('Done saving AnnotationSet documents');
  logger.info('Saving Corpus documents...');
  await Corpus.collection.insertMany(corpora, { ordered: false });
  logger.info('Done saving Corpus documents');
  logger.info('Saving Document documents...');
  await Document.collection.insertMany(documents, { ordered: false });
  logger.info('Done saving Document documents');
  logger.info('Saving Label documents...');
  await Label.collection.insertMany(labels, { ordered: false });
  logger.info('Done saving Label documents');
  logger.info('Saving Pattern documents...');
  await Pattern.collection.insertMany(patterns, { ordered: false });
  logger.info('Done saving Pattern documents');
  logger.info('Saving Sentence documents...');
  // await Sentence.collection.insertMany(sentences, { ordered: false });
  for (let i = 0; i < sentences.length; i += INSERTMANY_BATCH_SIZE) {
    await Sentence.collection.insertMany(sentences.slice(i, i + INSERTMANY_BATCH_SIZE),
                                         { ordered: false });
  }
  logger.info('Done saving Sentence documents');
  logger.info('Saving ValenceUnit documents...');
  await ValenceUnit.collection.insertMany(valenceUnits, { ordered: false });
  logger.info('Done saving ValenceUnit documents');
}

function saveRelationsAndSemTypesToDatabase(feRelations, frameRelations,
                                            frameRelationTypes, semTypes) {
  return Promise.all([
    FERelation.collection.insertMany(feRelations),
    FrameRelation.collection.insertMany(frameRelations),
    FrameRelationType.collection.insertMany(frameRelationTypes),
    SemType.collection.insertMany(semTypes),
  ]);
}

function saveFramesDataToDatabase(framesMap, fesMap, lexUnitsMap, lexemes) {
  return Promise.all([
    Frame.collection.insertMany(Array.from(framesMap.values()), { ordered: false }),
    FrameElement.collection.insertMany(Array.from(fesMap.values()), { ordered: false }),
    LexUnit.collection.insertMany(Array.from(lexUnitsMap.values()), { ordered: false }),
    Lexeme.collection.insertMany(lexemes, { ordered: false }),
  ]);
}

function saveHierarchiesToDatabase(frameHierarchyMap, feHierarchyMap) {
  return Promise.all([
    FrameHierarchy.collection.insertMany(Array.from(frameHierarchyMap.values()),
                                         { ordered: false }),
    FEHierarchy.collection.insertMany(Array.from(feHierarchyMap.values()), { ordered: false }),
  ]);
}

async function importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize,
                                  frameDir, frameChunkSize, fullTextDir,
                                  relationsFilePath, semTypesFilePath,
                                  importLexUnits, importFullTexts,
                                  importHierarchy) {
  await driver.connectToDatabase(dbUri);

  // Maps are for unique documents
  const annoSetsMap = new Map();
  const corporaMap = new Map();
  const documentsMap = new Map();
  const framesMap = new Map();
  const fesMap = new Map();
  const frameHierarchyMap = new Map();
  const feHierarchyMap = new Map();
  const lexUnitsMap = new Map();
  const patternsMap = new Map();
  const sentencesMap = new Map();
  const valenceUnitsMap = new Map();
  const frameRelations = [];
  const frameRelationTypes = [];
  const feRelations = [];
  const labels = [];
  const lexemes = [];
  const semTypes = [];

  await framesExtractor.extractFrames(frameDir, frameChunkSize, framesMap,
                                      fesMap, lexUnitsMap, lexemes);
  logger.info('Done extracting frames');
  logger.verbose(`  framesMap.size = ${framesMap.size}`);
  logger.verbose(`  fesMap.size = ${fesMap.size}`);
  logger.verbose(`  lexUnitsMap.size = ${lexUnitsMap.size}`);
  logger.verbose(`  lexemes.length = ${lexemes.length}`);

  await saveFramesDataToDatabase(framesMap, fesMap, lexUnitsMap, lexemes);

  await relationsExtractor.extractRelations(relationsFilePath, feRelations,
                                            frameRelations, frameRelationTypes);
  logger.info('Done extracting relations');
  logger.verbose(`  frameRelationTypes.length = ${frameRelationTypes.length}`);
  logger.verbose(`  frameRelations.length = ${frameRelations.length}`);
  logger.verbose(`  feRelations.length = ${feRelations.length}`);

  await semTypesExtractor.extractSemTypes(semTypesFilePath, semTypes);
  logger.info('Done extracting semTypes');
  logger.verbose(`  semTypes.length = ${semTypes.length}`);

  await saveRelationsAndSemTypesToDatabase(feRelations, frameRelations,
                                           frameRelationTypes, semTypes);

  if (importHierarchy) {
    hierarchiesExtractor.extractHierarchies(feRelations, frameRelations,
                                            frameRelationTypes, framesMap,
                                            fesMap, frameHierarchyMap,
                                            feHierarchyMap);
    await saveHierarchiesToDatabase(frameHierarchyMap, feHierarchyMap);
    logger.info('Done extracting hierarchy');
  }

  if (importLexUnits) {
    await lexUnitsExtractor.extractLexUnits(lexUnitDir, lexUnitChunkSize,
                                            annoSetsMap, labels, patternsMap,
                                            sentencesMap, valenceUnitsMap);
    logger.info('Done extracting lexUnits');
  }

  if (importFullTexts) {
    await fullTextsExtractor.extractFullTexts(fullTextDir, annoSetsMap,
                                              corporaMap, documentsMap, labels,
                                              patternsMap, sentencesMap,
                                              valenceUnitsMap);
    logger.info('Done extracting fullTexts');
  }

  logger.info('Saving data to database. This can take several minutes...');
  await saveDataToDatabase(annoSetsMap, corporaMap, documentsMap,
                           labels, patternsMap, sentencesMap, valenceUnitsMap);
  logger.info('Done saving data to database');
  logger.verbose(`  annoSetsMap.size = ${annoSetsMap.size}`);
  logger.verbose(`  corporaMap.size = ${corporaMap.size}`);
  logger.verbose(`  documentsMap.size = ${documentsMap.size}`);
  logger.verbose(`  fesMap.size = ${fesMap.size}`);
  logger.verbose(`  framesMap.size = ${framesMap.size}`);
  logger.verbose(`  frameHierarchyMap.size = ${frameHierarchyMap.size}`);
  logger.verbose(`  feHierarchyMap.size = ${feHierarchyMap.size}`);
  logger.verbose(`  labels.length = ${labels.length}`);
  logger.verbose(`  lexemes.length = ${lexemes.length}`);
  logger.verbose(`  lexUnitsMap.size = ${lexUnitsMap.size}`);
  logger.verbose(`  patternsMap.size = ${patternsMap.size}`);
  logger.verbose(`  sentencesMap.size = ${sentencesMap.size}`);
  logger.verbose(`  valenceUnitsMap.size = ${valenceUnitsMap.size}`);
  await mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.dbUri;
  const importLexUnits = config.importLexUnits;
  const importFullTexts = config.importFullTexts;
  const importHierarchy = config.importHierarchy;
  const lexUnitDir = path.join(config.splitsDir, 'lu');
  const lexUnitChunkSize = config.lexUnitChunkSize;
  const frameDir = path.join(config.frameNetDir, 'frame');
  const frameChunkSize = config.frameChunkSize;
  const fullTextDir = path.join(config.splitsDir, 'fulltext');
  const relationsFilePath = path.join(config.frameNetDir, 'frRelation.xml');
  const semTypesFilePath = path.join(config.frameNetDir, 'semTypes.xml');
  importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize, frameDir,
                     frameChunkSize, fullTextDir, relationsFilePath,
                     semTypesFilePath, importLexUnits, importFullTexts,
                     importHierarchy)
    .then(() => logger.info(`FrameNet data import completed in ${process.hrtime(startTime)[0]}s`));
}
