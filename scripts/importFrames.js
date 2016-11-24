/**
 * Standalone script to import FrameNet frames to MongoDB.
 */

import {
  Frame,
  FrameElement,
  Lexeme,
  LexUnit,
} from 'noframenet-core';
import {
  toJsonixExcludesFEArray,
  toJsonixFECoreSetArray,
  toJsonixFECoreSetMemberArray,
  toJsonixFrameElementArray,
  toJsonixLexemeArray,
  toJsonixLexUnitArray,
  toJsonixRequiresFEArray,
  toJsonixSemTypeArray,
} from './../utils/jsonixUtils';
import config from './../config';
import driver from './../db/mongo';
import marshaller from './../marshalling/unmarshaller';
import utils from './../utils/utils';

const logger = config.logger;
const startTime = process.hrtime();

function convertToLexemes(jsonixLexUnit) {
  return toJsonixLexemeArray(jsonixLexUnit)
    .map(jsonixLexeme =>
      new Lexeme({
        name: jsonixLexeme.name,
        pos: jsonixLexeme.pos,
        headword: jsonixLexeme.headword,
        order: jsonixLexeme.order,
        breakBefore: jsonixLexeme.breakBefore,
      }).toObject());
}

function convertToLexUnits(jsonixFrame, lexemes) {
  return toJsonixLexUnitArray(jsonixFrame)
    .map((jsonixLexUnit) => {
      const lexUnit = new LexUnit({
        _id: jsonixLexUnit.id,
        name: jsonixLexUnit.name,
        pos: jsonixLexUnit.pos,
        definition: jsonixLexUnit.definition,
        lemmaID: jsonixLexUnit.lemmaID,
        frame: jsonixFrame.value.id,
        status: jsonixLexUnit.status,
      });
      const _lexemes = convertToLexemes(jsonixLexUnit);
      lexemes.push(..._lexemes);
      lexUnit.lexemes = _lexemes.map(lex => lex._id);
      lexUnit.semTypes = toJsonixSemTypeArray(jsonixLexUnit)
        .map(jsonixSemType => jsonixSemType.id);
      return lexUnit.toObject();
    });
}

function convertToFrameElements(jsonixFrame) {
  return toJsonixFrameElementArray(jsonixFrame)
    .map((jsonixFE) => {
      const frameElement = new FrameElement({
        _id: jsonixFE.id,
        name: jsonixFE.name,
        definition: jsonixFE.definition,
        coreType: jsonixFE.coreType,
        cDate: jsonixFE.cDate,
        cBy: jsonixFE.cBy,
        fgColor: jsonixFE.fgColor,
        bgColor: jsonixFE.bgColor,
        abbrev: jsonixFE.abbrev,
      });
      frameElement.requires = toJsonixRequiresFEArray(jsonixFE)
        .map(jsonixRequiresFE => jsonixRequiresFE.id);
      frameElement.excludes = toJsonixExcludesFEArray(jsonixFE)
        .map(jsonixExcludesFE => jsonixExcludesFE.id);
      frameElement.semTypes = toJsonixSemTypeArray(jsonixFE)
        .map(jsonixSemType => jsonixSemType.id);
      return frameElement.toObject();
    });
}

function convertToFrame(jsonixFrame, frameElements, lexUnits, lexemes) {
  const frame = new Frame({
    _id: jsonixFrame.value.id,
    name: jsonixFrame.value.name,
    definition: jsonixFrame.value.definition,
    cDate: jsonixFrame.value.cDate,
    cBy: jsonixFrame.value.cBy,
  });
  const fes = convertToFrameElements(jsonixFrame, frameElements);
  frameElements.push(...fes);
  frame.frameElements = fes
    .map(fe => fe._id);
  frame.feCoreSets = toJsonixFECoreSetArray(jsonixFrame)
    .map(jsonixFECoreSet => toJsonixFECoreSetMemberArray(jsonixFECoreSet)
      .map(jsonixFE => jsonixFE.id));
  const lus = convertToLexUnits(jsonixFrame, lexemes);
  lexUnits.push(...lus);
  frame.lexUnits = lus.map(lu => lu._id);
  frame.semTypes = toJsonixSemTypeArray(jsonixFrame)
    .map(jsonixSemType => jsonixSemType.id);
  return frame.toObject();
}

async function convertToObjects(batch) {
  const data = {
    frames: [],
    frameElements: [],
    lexUnits: [],
    lexemes: [],
  };
  await Promise.all(batch.map(async(file) => {
    const jsonixFrame = await marshaller.unmarshall(file);
    data.frames.push(convertToFrame(jsonixFrame, data.frameElements, data.lexUnits, data.lexemes));
  }));
  return data;
}

async function saveToDb(mongodb, data) {
  await mongodb.collection('frames').insertMany(data.frames, {
    writeConcern: 0,
    j: false,
    ordered: false,
  });
  await mongodb.collection('frameelements').insertMany(data.frameElements, {
    writeConcern: 0,
    j: false,
    ordered: false,
  });
  await mongodb.collection('lexunits').insertMany(data.lexUnits, {
    writeConcern: 0,
    j: false,
    ordered: false,
  });
  await mongodb.collection('lexemes').insertMany(data.lexemes, {
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
  for (const batch of batchSet) {
    logger.info(`Importing frame batch ${counter} out of ${batchSet.length}...`);
    const data = await convertToObjects(batch);
    try {
      await saveToDb(db.mongo, data);
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
    counter += 1;
  }
}

async function importFramesOnceConnectedToDb(frameDir, chunkSize, db) {
  const batchSet = await utils.filterAndChunk(frameDir, chunkSize);
  await importBatchSet(batchSet, db);
  logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`);
}

async function importFrames(frameDir, chunkSize, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  await importFramesOnceConnectedToDb(frameDir, chunkSize, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importFrames(config.frameDir, config.frameChunkSize, config.dbUri);
}
