/**
 * Standalone script to import FrameNet frames to MongoDB.
 */

import {
  Frame,
  FrameElement,
} from 'noframenet-core';
import {
  toJsonixExcludesFEArray,
  toJsonixFECoreSetArray,
  toJsonixFECoreSetMemberArray,
  toJsonixFrameElementArray,
  toJsonixLexUnitArray,
  toJsonixRequiresFEArray,
  toJsonixSemTypeArray,
} from './../utils/jsonixUtils';
import {
  filterAndChunk,
} from './../utils/filesUtils';
import {
  connectToDatabase,
} from './../db/mongo';
import {
  unmarshall,
} from './../marshalling/unmarshaller';
import config from './../config';

const logger = config.logger;
const startTime = process.hrtime();

function convertToFrameElements(jsonixFrame) {
  return toJsonixFrameElementArray(jsonixFrame).map((jsonixFE) => {
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

function convertToFrame(jsonixFrame, frameElements) {
  const frame = new Frame({
    _id: jsonixFrame.value.id,
    name: jsonixFrame.value.name,
    definition: jsonixFrame.value.definition,
    cDate: jsonixFrame.value.cDate,
    cBy: jsonixFrame.value.cBy,
  });
  const fes = convertToFrameElements(jsonixFrame, frameElements);
  frameElements.push(...fes);
  frame.frameElements = fes.map(fe => fe._id);
  frame.feCoreSets = toJsonixFECoreSetArray(jsonixFrame)
    .map(jsonixFECoreSet => toJsonixFECoreSetMemberArray(jsonixFECoreSet)
      .map(jsonixFE => jsonixFE.id));
  frame.lexUnits = toJsonixLexUnitArray(jsonixFrame)
    .map(jsonixLexUnit => jsonixLexUnit.id);
  frame.semTypes = toJsonixSemTypeArray(jsonixFrame)
    .map(jsonixSemType => jsonixSemType.id);
  return frame.toObject();
}

async function convertToObjects(batch) {
  const data = {
    frames: [],
    frameElements: [],
  };
  await Promise.all(batch.map(async(file) => {
    const jsonixFrame = await unmarshall(file);
    data.frames.push(convertToFrame(jsonixFrame, data.frameElements));
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
}

/**
 * Only import info related to Frames and FEs. Info regarding LexUnits and
 * relations will be imported in separate scripts.
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
  const batchSet = await filterAndChunk(frameDir, chunkSize);
  await importBatchSet(batchSet, db);
  logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`);
}

async function importFrames(frameDir, chunkSize, dbUri) {
  const db = await connectToDatabase(dbUri);
  await importFramesOnceConnectedToDb(frameDir, chunkSize, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importFrames(config.frameDir, config.frameChunkSize, config.dbUri);
}
