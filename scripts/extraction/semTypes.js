/**
 * Standalone script to import the content of semTypes.xml to MongoDB
 */
const SemType = require('noframenet-core').SemType;
const toJsonixSemTypesSemTypeArray = require('./../../utils/jsonixUtils').toJsonixSemTypesSemTypeArray;
const toJsonixSuperTypeArray = require('./../../utils/jsonixUtils').toJsonixSuperTypeArray;
const config = require('./../../config');
const marshaller = require('./../../marshalling/unmarshaller');

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

function processSemTypes(jsonixSemTypes, semTypes) {
  semTypes.push(...getSemTypes(jsonixSemTypes));
}

async function importSemTypes(semTypesFilePath, semTypes) {
  logger.info(`Extracting semTypes from file: ${semTypesFilePath}`);
  let jsonixSemTypes;
  try {
    jsonixSemTypes = await marshaller.unmarshall(semTypesFilePath);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await processSemTypes(jsonixSemTypes, semTypes);
}

module.exports = {
  importSemTypes,
};
