/**
 * Standalone script to import FrameNet semtypes to MongoDB
 */

import Promise from 'bluebird';
import jsonix from 'jsonix';
import config from '.././config';
import jsonixUtils from '.././utils/jsonixUtils';
import preProcessor from './preProcessor';
import semTypeSchema from '.././mappings/SemTypeSchema';

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
        return resolve(unmarshalledFile);
      });
    } catch (err) {
      return reject(err);
    }
  });
}

function getSemTypes(jsonixSemTypes) {
  return jsonixUtils.toJsonixSemTypeArray(jsonixSemTypes).map((jsonixSemType) => {

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
  const db = await preProcessor.connectToDatabase(dbUri);
  logger.info('Importing SemTypes to database...');
  const jsonixSemTypes = await unmarshall(semTypeFile);
  const semTypes = getSemTypes(jsonixSemTypes);
  await saveToDb(db, semTypes);
  logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`);
  logger.info(`SemTypes = ${semTypes.length}`);
}

if (require.main === module) {
  importSemTypes(config.semTypeFile, config.dbUri);
}
