/**
 * Standalone script to import the content of semTypes.xml to MongoDB
 */
const SemType = require('noframenet-core').SemType;
const toJsonixSemTypesSemTypeArray = require('./../utils/jsonixUtils').toJsonixSemTypesSemTypeArray;
const toJsonixSuperTypeArray = require('./../utils/jsonixUtils').toJsonixSuperTypeArray;
const config = require('./../config');
const driver = require('./../db/mongoose');
const marshaller = require('./../marshalling/unmarshaller');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

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

async function saveToDb(semTypes) {
  await SemType.collection.insertMany(semTypes,
                                      { w: 0, j: false, ordered: false });
}

async function importSemTypeObjects(semTypes) {
  try {
    await saveToDb(semTypes);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
}

async function importUnmarshalledSemTypes(jsonixSemTypes) {
  const semTypes = getSemTypes(jsonixSemTypes);
  await importSemTypeObjects(semTypes);
}

async function importSemTypesOnceConnectedToDb(semTypesFilePath) {
  logger.info(`Processing file: ${semTypesFilePath}`);
  let jsonixSemTypes;
  try {
    jsonixSemTypes = await marshaller.unmarshall(semTypesFilePath);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await importUnmarshalledSemTypes(jsonixSemTypes);
}

async function importSemTypes(semTypesFilePath, dbUri) {
  await driver.connectToDatabase(dbUri);
  await importSemTypesOnceConnectedToDb(semTypesFilePath);
  await mongoose.disconnect();
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
