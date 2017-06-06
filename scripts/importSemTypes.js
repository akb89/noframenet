/**
 * Standalone script to import the content of semTypes.xml to MongoDB
 */
const SemType = require('noframenet-core').SemType;
const toJsonixSemTypesSemTypeArray = require('./../utils/jsonixUtils').toJsonixSemTypesSemTypeArray;
const toJsonixSuperTypeArray = require('./../utils/jsonixUtils').toJsonixSuperTypeArray;
const config = require('./../config');
const driver = require('./../db/mongo');
const marshaller = require('./../marshalling/unmarshaller');

const logger = config.logger;


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
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
}

async function importUnmarshalledSemTypes(jsonixSemTypes, db) {
  const semTypes = getSemTypes(jsonixSemTypes);
  await importSemTypeObjects(semTypes, db);
}

async function importSemTypesOnceConnectedToDb(semTypesFilePath, db) {
  logger.info(`Processing file: ${semTypesFilePath}`);
  let jsonixSemTypes;
  try {
    jsonixSemTypes = await marshaller.unmarshall(semTypesFilePath);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await importUnmarshalledSemTypes(jsonixSemTypes, db);
}

async function importSemTypes(semTypesFilePath, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  await importSemTypesOnceConnectedToDb(semTypesFilePath, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.dbUri;
  const semTypesFilePath = config.frameNetDir.concat('semTypes.xml');
  importSemTypes(semTypesFilePath, dbUri).then(() => logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`));
}

module.exports = {
  importSemTypesOnceConnectedToDb,
};
