/**
 * Standalone script to import FrameNet semtypes to MongoDB
 */

import {
  SemType,
  Set,
} from 'noframenet-core';
import config from './../config';
import jsonixUtils from './../utils/jsonixUtils';
import {
  connectToDatabase,
} from './../db/mongo.js';
import {
  unmarshall,
} from './../marshalling/unmarshaller';

const logger = config.logger;
const startTime = process.hrtime();

function getSuperTypes(jsonixSemType) {
  return jsonixUtils
    .toJsonixSuperTypeArray(jsonixSemType)
    .map(jsonixSuperType => jsonixSuperType.supID);
}

// Export for testing
export function getSemTypes(jsonixSemTypes) {
  return jsonixUtils.toJsonixSemTypesSemTypeArray(jsonixSemTypes).map((jsonixSemType) => {
    const semType = new SemType({
      _id: jsonixSemType.id,
      name: jsonixSemType.name,
      definition: jsonixSemType.definition,
      superTypes: getSuperTypes(jsonixSemType),
    });
    return semType.toObject();
  });
}

async function saveToDb(db, semTypes) {
  await db.collection('semtypes').insertMany(semTypes, {
    w: 0,
    j: false,
    ordered: false,
  });
}

async function importSemTypeObjects(semTypes, db) {
  try {
    await saveToDb(db.mongo, semTypes);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
  logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`);
  logger.info(`SemTypes = ${semTypes.length}`);
}

async function importUnmarshalledSemTypes(jsonixSemTypes, db) {
  const semTypes = getSemTypes(jsonixSemTypes);
  await importSemTypeObjects(semTypes, db)
}

async function importSemTypesOnceConnectedToDb(semTypeFilePath, db) {
  const jsonixSemTypes = await unmarshall(semTypeFilePath);
  await importUnmarshalledSemTypes(jsonixSemTypes, db)
}

async function importSemTypes(semTypeFilePath, dbUri) {
  const db = await connectToDatabase(dbUri);
  logger.info('Importing SemTypes to database...');
  await importSemTypesOnceConnectedToDb(semTypeFilePath, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importSemTypes(config.semTypeFilePath, config.dbUri);
}
