/**
 * Standalone script to import the content of semTypes.xml to MongoDB
 */

import { SemType,
} from 'noframenet-core';
import { toJsonixSemTypesSemTypeArray, toJsonixSuperTypeArray,
} from './../utils/jsonixUtils';
import config from './../config';
import driver from './../db/mongo';
import marshaller from './../marshalling/unmarshaller';

const logger = config.default.logger;
const startTime = process.hrtime();

function getSuperTypes(jsonixSemType) {
  return toJsonixSuperTypeArray(jsonixSemType)
    .map(jsonixSuperType => jsonixSuperType.supID);
}

function getSemTypes(jsonixSemTypes) {
  return toJsonixSemTypesSemTypeArray(jsonixSemTypes)
    .map(jsonixSemType => new SemType({
      _id: jsonixSemType.id,
      name: jsonixSemType.name,
      definition: jsonixSemType.definition,
      superTypes: getSuperTypes(jsonixSemType),
    }).toObject());
}

async function saveToDb(mongodb, semTypes) {
  await mongodb.collection('semtypes').insertMany(semTypes, {
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
  await importSemTypeObjects(semTypes, db);
}

async function importSemTypesOnceConnectedToDb(semTypesFilePath, db) {
  const jsonixSemTypes = await marshaller.unmarshall(semTypesFilePath);
  await importUnmarshalledSemTypes(jsonixSemTypes, db);
}

async function importSemTypes(semTypesFilePath, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  logger.info('Importing SemTypes to database...');
  await importSemTypesOnceConnectedToDb(semTypesFilePath, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importSemTypes(config.semTypesFilePath, config.dbUri);
}
