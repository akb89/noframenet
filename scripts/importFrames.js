/**
 * Standalone script to import FrameNet frames to MongoDB.
 */
const Frame = require('noframenet-core').Frame;
const FrameElement = require('noframenet-core').FrameElement;
const Lexeme = require('noframenet-core').Lexeme;
const LexUnit = require('noframenet-core').LexUnit;
const ProgressBar = require('ascii-progress');
const toJsonixExcludesFEArray = require('./../utils/jsonixUtils').toJsonixExcludesFEArray;
const toJsonixFECoreSetArray = require('./../utils/jsonixUtils').toJsonixFECoreSetArray;
const toJsonixFECoreSetMemberArray = require('./../utils/jsonixUtils').toJsonixFECoreSetMemberArray;
const toJsonixFrameElementArray = require('./../utils/jsonixUtils').toJsonixFrameElementArray;
const toJsonixLexemeArray = require('./../utils/jsonixUtils').toJsonixLexemeArray;
const toJsonixLexUnitArray = require('./../utils/jsonixUtils').toJsonixLexUnitArray;
const toJsonixRequiresFEArray = require('./../utils/jsonixUtils').toJsonixRequiresFEArray;
const toJsonixSemTypeArray = require('./../utils/jsonixUtils').toJsonixSemTypeArray;
const config = require('./../config');
const driver = require('./../db/mongo');
const marshaller = require('./../marshalling/unmarshaller');
const utils = require('./../utils/utils');

const logger = config.logger;

function convertToLexemes(jsonixLexUnit) {
  return toJsonixLexemeArray(jsonixLexUnit)
    .map(jsonixLexeme => new Lexeme({
      name: jsonixLexeme.name,
      pos: jsonixLexeme.pos,
      headword: jsonixLexeme.headword,
      order: jsonixLexeme.order,
      breakBefore: jsonixLexeme.breakBefore,
    })
      .toObject());
}

function convertToLexUnits(jsonixFrame, lexemes) {
  return toJsonixLexUnitArray(jsonixFrame)
    .map(jsonixLexUnit => new LexUnit({
      _id: jsonixLexUnit.id,
      name: jsonixLexUnit.name,
      pos: jsonixLexUnit.pos,
      definition: jsonixLexUnit.definition,
      lemmaID: jsonixLexUnit.lemmaID,
      frame: jsonixFrame.value.id,
      status: jsonixLexUnit.status,
      cBy: jsonixLexUnit.cBy,
      cDate: jsonixLexUnit.cDate,
      lexemes: convertToLexemes(jsonixLexUnit)
        .map((lexeme) => {
          lexemes.push(lexeme);
          return lexeme._id;
        }),
      semTypes: toJsonixSemTypeArray(jsonixLexUnit)
        .map(jsonixSemType => jsonixSemType.id),
    })
      .toObject());
}

function convertToFrameElements(jsonixFrame) {
  return toJsonixFrameElementArray(jsonixFrame)
    .map(jsonixFE => new FrameElement({
      _id: jsonixFE.id,
      name: jsonixFE.name,
      definition: jsonixFE.definition,
      coreType: jsonixFE.coreType,
      cDate: jsonixFE.cDate,
      cBy: jsonixFE.cBy,
      fgColor: jsonixFE.fgColor,
      bgColor: jsonixFE.bgColor,
      abbrev: jsonixFE.abbrev,
      requires: toJsonixRequiresFEArray(jsonixFE)
        .map(jsonixRequiresFE => jsonixRequiresFE.id),
      excludes: toJsonixExcludesFEArray(jsonixFE)
        .map(jsonixExcludesFE => jsonixExcludesFE.id),
      semTypes: toJsonixSemTypeArray(jsonixFE)
        .map(jsonixSemType => jsonixSemType.id),
    })
      .toObject());
}

function convertToFrame(jsonixFrame, frameElements, lexUnits, lexemes) {
  return new Frame({
    _id: jsonixFrame.value.id,
    name: jsonixFrame.value.name,
    definition: jsonixFrame.value.definition,
    cDate: jsonixFrame.value.cDate,
    cBy: jsonixFrame.value.cBy,
    frameElements: convertToFrameElements(jsonixFrame, frameElements)
      .map((fe) => {
        frameElements.push(fe);
        return fe._id;
      }),
    feCoreSets: toJsonixFECoreSetArray(jsonixFrame)
      .map(jsonixFECoreSet => toJsonixFECoreSetMemberArray(jsonixFECoreSet)
        .map(jsonixFE => jsonixFE.id)),
    lexUnits: convertToLexUnits(jsonixFrame, lexemes)
      .map((lu) => {
        lexUnits.push(lu);
        return lu._id;
      }),
    semTypes: toJsonixSemTypeArray(jsonixFrame)
      .map(jsonixSemType => jsonixSemType.id),
  })
    .toObject();
}

async function convertToObjects(batch) {
  const data = {
    frames: [],
    frameElements: [],
    lexUnits: [],
    lexemes: [],
  };
  await Promise.all(batch.map(async (file) => {
    const jsonixFrame = await marshaller.unmarshall(file);
    data.frames.push(convertToFrame(jsonixFrame, data.frameElements, data.lexUnits, data.lexemes));
  }));
  return data;
}

async function saveToDb(mongodb, data) {
  await mongodb.collection('frames')
    .insertMany(data.frames, {
      writeConcern: 0,
      j: false,
      ordered: false,
    });
  await mongodb.collection('frameelements')
    .insertMany(data.frameElements, {
      writeConcern: 0,
      j: false,
      ordered: false,
    });
  await mongodb.collection('lexunits')
    .insertMany(data.lexUnits, {
      writeConcern: 0,
      j: false,
      ordered: false,
    });
  await mongodb.collection('lexemes')
    .insertMany(data.lexemes, {
      writeConcern: 0,
      j: false,
      ordered: false,
    });
}

/**
 * Only import info related to Frames, FEs, LexUnits and Lexemes. Info
 * regarding relations will be imported in separate scripts.
 */
async function importBatchSet(batchSet, db) {
  let counter = 1;
  const frameProgressBar = new ProgressBar({
    total: batchSet.length,
    clean: true,
  });
  logger.info('Importing frames by batch...');
  for (const batch of batchSet) {
    logger.debug(`Importing frame batch ${counter} out of ${batchSet.length}...`);
    const data = await convertToObjects(batch); // eslint-disable-line no-await-in-loop
    try {
      await saveToDb(db.mongo, data); // eslint-disable-line no-await-in-loop
    } catch (err) {
      logger.error(err);
      logger.info('Exiting NoFrameNet');
      process.exit(1);
    }
    counter += 1;
    frameProgressBar.tick();
  }
}

async function importFramesOnceConnectedToDb(frameDir, chunkSize, db) {
  let batchSet;
  try {
    batchSet = await utils.filterAndChunk(frameDir, chunkSize);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await importBatchSet(batchSet, db);
}

async function importFrames(frameDir, chunkSize, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  await importFramesOnceConnectedToDb(frameDir, chunkSize, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.dbUri;
  const frameDir = config.frameNetDir.concat('frame');
  const frameChunkSize = config.frameChunkSize;
  importFrames(frameDir, frameChunkSize, dbUri)
    .then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}

module.exports = {
  importFramesOnceConnectedToDb,
};
