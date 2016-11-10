/**
 * Standalone script to import FrameNet semtypes to MongoDB
 */

import Promise from 'bluebird';
import jsonix from 'jsonix';
import {
  SemType,
} from 'noframenet-core';
import config from './../config';
import jsonixUtils from './../utils/jsonixUtils';
import {
  connectToDatabase,
} from './../db/mongo.js';
import semTypeSchema from './../mappings/SemTypeSchema';

const Jsonix = jsonix.Jsonix;
const SemTypeSchema = semTypeSchema.SemTypeSchema;
const context = new Jsonix.Context([SemTypeSchema]);
const unmarshaller = context.createUnmarshaller();
const logger = config.logger;
const startTime = process.hrtime();

function unmarshall(file) {
  return new Promise((resolve, reject) => {
    try {
      unmarshaller.unmarshalFile(file, (unmarshalledFile) => {
        resolve(unmarshalledFile);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function getSuperTypes(jsonixSemType) {
  return jsonixUtils
    .toJsonixSuperTypeArray(jsonixSemType)
    .map(jsonixSuperType => jsonixSuperType.supID);
}

function getSemTypes(jsonixSemTypes) {
  return jsonixUtils.toJsonixSemTypesSemTypeArray(jsonixSemTypes).map((jsonixSemType) => {
    const semType = new SemType({
      _id: jsonixSemType.id,
      name: jsonixSemType.name,
      definition: jsonixSemType.definition,
      superTypes: getSuperTypes(jsonixSemType),
    });
    return semType;
  });
}

async function saveToDb(db, semTypes) {
  await db.collection('semtypes').insertMany(semTypes, {
    w: 0,
    j: false,
    ordered: false,
  });
}

async function importSemTypes(semTypeFile, dbUri) {
  const db = await connectToDatabase(dbUri);
  logger.info('Importing SemTypes to database...');
  //const jsonixSemTypes = await unmarshall(semTypeFile);
  //const semTypes = getSemTypes(jsonixSemTypes);
  //await saveToDb(db.mongo, semTypes);
  logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`);
  //logger.info(`SemTypes = ${semTypes.length}`);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importSemTypes(config.semTypeFile, config.dbUri);
}
