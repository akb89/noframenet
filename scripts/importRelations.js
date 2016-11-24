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
import config from './../config';
import driver from './../db/mongo';
import marshaller from './../marshalling/unmarshaller';

const logger = config.logger;
const startTime = process.hrtime();

export function convertToFERelations(jsonixFrameRelation) {
  return toJsonixFERelationArray(jsonixFrameRelation)
    .map(jsonixFERelation => new FERelation({
      _id: jsonixFERelation.id,
      subFE: jsonixFERelation.subID,
      supFE: jsonixFERelation.supID,
      frameRelation: jsonixFrameRelation.id,
    }).toObject());
}

export function convertToFrameRelations(jsonixFrameRelationType, frameElementRelations) {
  return toJsonixFrameRelationArray(jsonixFrameRelationType)
    .map((jsonixFrameRelation) => {
      frameElementRelations
        .push(...convertToFERelations(jsonixFrameRelation));
      return new FrameRelation({
        _id: jsonixFrameRelation.id,
        subFrame: jsonixFrameRelation.subID,
        supFrame: jsonixFrameRelation.supID,
        type: jsonixFrameRelationType.id,
      }).toObject();
    });
}
// TODO: use rewire module
export function convertToRelationTypes(jsonixFrameRelations, frameRelations, frameElementRelations) {
  return toJsonixFrameRelationTypeArray(jsonixFrameRelations)
    .map((jsonixFrameRelationType) => {
      frameRelations
        .push(...convertToFrameRelations(jsonixFrameRelationType, frameElementRelations));
      return new FrameRelationType({
        _id: jsonixFrameRelationType.id,
        name: jsonixFrameRelationType.name,
        subFrameName: jsonixFrameRelationType.subFrameName,
        supFrameName: jsonixFrameRelationType.superFrameName,
      }).toObject();
    });
}

function convertToObjects(jsonixFrameRelations) {
  const data = {
    frameRelationTypes: [],
    frameRelations: [],
    feRelations: [],
  };
  data.frameRelationTypes.push(
    ...convertToRelationTypes(
      jsonixFrameRelations,
      data.frameRelations,
      data.feRelations));
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
}

async function importUnmarshalledFrameRelations(jsonixFrameRelations, db) {
  const data = convertToObjects(jsonixFrameRelations);
  await importDataObjects(data, db);
}

async function importRelationsOnceConnectedToDb(relationsFilePath, db) {
  const jsonixFrameRelations = await marshaller.unmarshall(relationsFilePath);
  await importUnmarshalledFrameRelations(jsonixFrameRelations, db);
  logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`);
}

async function importRelations(relationsFilePath, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  logger.info('Importing Relations to database...');
  await importRelationsOnceConnectedToDb(relationsFilePath, db);
  // TODO revise this in case of pipeline script execution?
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importRelations(config.relationsFilePath, config.dbUri);
}
