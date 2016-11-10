/**
 * Standalone script to import the content of frRelation.xml to MongoDB
 */

import {
  FrameElementRelation,
  FrameRelation,
  FrameRelationType,
} from 'noframenet-core';
import {
  toJsonixFrameElementRelationArray,
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

export function convertToFERelations(data, jsonixFrameRelation) {
  data.frameElementRelations.push(toJsonixFrameElementRelationArray(jsonixFrameRelation).map((jsonixFrameElementRelation) => {
    const frameElementRelation = new FrameElementRelation({
      _id: jsonixFrameElementRelation.id,
      subFE: jsonixFrameElementRelation.subID,
      supFE: jsonixFrameElementRelation.supID,
      frameRelation: jsonixFrameRelation.id,
    });
    return frameElementRelation;
  }));
}

export function convertToFrameRelations(data, jsonixFrameRelationType) {
  data.frameRelations.push(toJsonixFrameRelationArray(jsonixFrameRelationType).map((jsonixFrameRelation) => {
    const frameRelation = new FrameRelation({
      _id: jsonixFrameRelation.id,
      subFrame: jsonixFrameRelation.subID,
      supFrame: jsonixFrameRelation.supID,
      type: jsonixFrameRelationType.id,
    });
    convertToFERelations(data, jsonixFrameRelation);
    return frameRelation;
  }));
}

export function convertToRelationTypes(data, jsonixFrameRelations) {
  data.frameRelationTypes.push(toJsonixFrameRelationTypeArray(jsonixFrameRelations).map((jsonixFrameRelationType) => {
    const frameRelationType = new FrameRelationType({
      _id: jsonixFrameRelationType.id,
      name: jsonixFrameRelationType.name,
      subFrameName: jsonixFrameRelationType.subFrameName,
      supFrameName: jsonixFrameRelationType.superFrameName,
    });
    convertToFrameRelations(data, jsonixFrameRelationType)
    return frameRelationType;
  }));
}

function convertToObjects(jsonixFrameRelations) {
  let data = {
    frameRelationTypes: [],
    frameRelations: [],
    frameElementRelations: [],
  };
  convertToRelationTypes(data, jsonixFrameRelations);
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
  await mongodb.collection('frameelementrelations').insertMany(data.frameElementRelations, {
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
  await importRelationsOnceConnectedToDb(semTypeFilePath, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importRelations(config.relationsFilePath, config.dbUri);
}
