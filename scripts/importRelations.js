/**
 * Standalone script to import the content of frRelation.xml to MongoDB
 */

import {
  FERelation,
  FrameRelation,
  FrameRelationType,
} from 'noframenet-core';
import {
  toJsonixFERelationArray,
  toJsonixFrameRelationArray,
  toJsonixFrameRelationTypeArray,
} from './../utils/jsonixUtils';
import {
  connectToDatabase,
} from './../db/mongo.js';
import {
  unmarshall,
} from './../marshalling/unmarshaller';
import config from './../config';

const logger = config.logger;
const startTime = process.hrtime();

export function convertToFERelations(jsonixFrameRelation) {
  return toJsonixFERelationArray(jsonixFrameRelation).map((jsonixFERelation) => {
    const feRelation = new FERelation({
      _id: jsonixFERelation.id,
      subFE: jsonixFERelation.subID,
      supFE: jsonixFERelation.supID,
      frameRelation: jsonixFrameRelation.id,
    });
    return feRelation.toObject();
  });
}

export function convertToFrameRelations(jsonixFrameRelationType, frameElementRelations) {
  return toJsonixFrameRelationArray(jsonixFrameRelationType).map((jsonixFrameRelation) => {
    const frameRelation = new FrameRelation({
      _id: jsonixFrameRelation.id,
      subFrame: jsonixFrameRelation.subID,
      supFrame: jsonixFrameRelation.supID,
      type: jsonixFrameRelationType.id,
    });
    frameElementRelations.push(...convertToFERelations(jsonixFrameRelation));
    return frameRelation.toObject();
  });
}

export function convertToRelationTypes(jsonixFrameRelations, frameRelations, frameElementRelations) {
  return toJsonixFrameRelationTypeArray(jsonixFrameRelations).map((jsonixFrameRelationType) => {
    const frameRelationType = new FrameRelationType({
      _id: jsonixFrameRelationType.id,
      name: jsonixFrameRelationType.name,
      subFrameName: jsonixFrameRelationType.subFrameName,
      supFrameName: jsonixFrameRelationType.superFrameName,
    });
    frameRelations.push(...convertToFrameRelations(jsonixFrameRelationType, frameElementRelations));
    return frameRelationType.toObject();
  });
}

function convertToObjects(jsonixFrameRelations) {
  let data = {
    frameRelationTypes: [],
    frameRelations: [],
    feRelations: [],
  };
  data.frameRelationTypes.push(...convertToRelationTypes(jsonixFrameRelations, data.frameRelations, data.feRelations));
  return data;
}

async function saveToDb(mongodb, data) {
  await mongodb.collection('framerelationtypes').insertMany(data.frameRelationTypes, {
    w: 0,
    j: false,
    ordered: false,
  });
  await mongodb.collection('framerelations').insertMany(data.frameRelations, {
    w: 0,
    j: false,
    ordered: false,
  });
  await mongodb.collection('ferelations').insertMany(data.feRelations, {
    w: 0,
    j: false,
    ordered: false,
  });
}

async function importDataObjects(data, db) {
  try {
    await saveToDb(db.mongo, data);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
  logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`);
  //logger.info(`SemTypes = ${semTypes.length}`);
}

async function importUnmarshalledFrameRelations(jsonixFrameRelations, db) {
  const data = convertToObjects(jsonixFrameRelations);
  await importDataObjects(data, db);
}

async function importRelationsOnceConnectedToDb(relationsFilePath, db) {
  const jsonixFrameRelations = await unmarshall(relationsFilePath);
  await importUnmarshalledFrameRelations(jsonixFrameRelations, db);
}

async function importRelations(relationsFilePath, dbUri) {
  const db = await connectToDatabase(dbUri);
  logger.info('Importing Relations to database...');
  await importRelationsOnceConnectedToDb(relationsFilePath, db);
  // TODO revise this in case of pipeline script execution?
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importRelations(config.relationsFilePath, config.dbUri);
}
