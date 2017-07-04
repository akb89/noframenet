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
const Promise = require('bluebird');

mongoose.Promise = Promise;

const logger = config.logger;

function saveFullTextDataToDatabase(annoSetsMap, corporaMap, documentsMap,
                                    labels, patternsMap, sentencesMap,
                                    valenceUnitsMap) {
  const annosets = Array.from(annoSetsMap.values());
  const corpora = Array.from(corporaMap.values());
  const documents = Array.from(documentsMap.values());
  const patterns = Array.from(patternsMap.values());
  const sentences = Array.from(sentencesMap.values());
  const valenceUnits = Array.from(valenceUnitsMap.values());
  return Promise.all([
    AnnotationSet.collection.insertMany(annosets, { ordered: false }),
    Corpus.collection.insertMany(corpora, { ordered: false }),
    Document.collection.insertMany(documents, { ordered: false }),
    Label.collection.insertMany(labels, { ordered: false }),
    Pattern.collection.insertMany(patterns, { ordered: false }),
    Sentence.collection.insertMany(sentences, { ordered: false }),
    ValenceUnit.collection.insertMany(valenceUnits, { ordered: false }),
  ]);
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

async function importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize,
                                  frameDir, frameChunkSize, fullTextDir,
                                  relationsFilePath, semTypesFilePath) {
  await driver.connectToDatabase(dbUri);

  // Maps are for unique documents
  const annoSetsMap = new Map();
  const corporaMap = new Map();
  const documentsMap = new Map();
  const framesMap = new Map();
  const fesMap = new Map();
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

  await lexUnitsExtractor.extractLexUnits(lexUnitDir, lexUnitChunkSize,
                                          annoSetsMap, labels, patternsMap,
                                          sentencesMap, valenceUnitsMap);
  logger.info('Done extracting lexUnits');

  await fullTextsExtractor.extractFullTexts(fullTextDir, annoSetsMap,
                                            corporaMap, documentsMap, labels,
                                            patternsMap, sentencesMap,
                                            valenceUnitsMap);
  logger.info('Done extracting fullTexts');
  logger.info('Saving data to database. This can take several minutes...');
  await saveFullTextDataToDatabase(annoSetsMap, corporaMap, documentsMap,
                                   labels, patternsMap, sentencesMap,
                                   valenceUnitsMap);
  logger.info('Done saving data to database');
  logger.verbose(`  annoSetsMap.size = ${annoSetsMap.size}`);
  logger.verbose(`  corporaMap.size = ${corporaMap.size}`);
  logger.verbose(`  documentsMap.size = ${documentsMap.size}`);
  logger.verbose(`  fesMap.size = ${fesMap.size}`);
  logger.verbose(`  framesMap.size = ${framesMap.size}`);
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
    .then(() => logger.info(`FrameNet data import completed in ${process.hrtime(startTime)[0]}s`));
}
