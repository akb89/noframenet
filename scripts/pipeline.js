import config from './../config';
import driver from './../db/mongo';
import importFrames from './importFrames';
import importFullTexts from './importFullTexts';
import importLexUnits from './importLexUnits';
import importRelations from './importRelations';
import importSemTypes from './importSemTypes';

const logger = config.default.logger;
const startTime = process.hrtime();

async function importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize,
  frameDir, frameChunkSize, fullTextDir, fullTextChunkSize, relationsFilePath,
  semTypesFilePath) {
  const db = await driver.connectToDatabase(dbUri);
  await importFrames.importFramesOnceConnectedToDb(frameDir, frameChunkSize, db);
  logger.info('Frames import completed');
  await importFullTexts.importFullTextOnceConnectedToDb(fullTextDir, fullTextChunkSize, db);
  logger.info('FullTexts import completed');
  await importRelations.importRelationsOnceConnectedToDb(relationsFilePath, db);
  logger.info('Relations import completed');
  await importSemTypes.importSemTypesOnceConnectedToDb(semTypesFilePath, db);
  logger.info('SemTypes import completed');
  await importLexUnits.importLexUnitsOnceConnectedToDb(lexUnitDir, lexUnitChunkSize, db);
  logger.info('LexUnits import completed');
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  const dbUri = config.default.dbUri;
  const lexUnitDir = config.default.frameNetDir.concat('lu');
  const lexUnitChunkSize = config.default.lexUnitChunkSize;
  const frameDir = config.default.frameNetDir.concat('frame');
  const frameChunkSize = config.default.frameChunkSize;
  const fullTextDir = config.default.frameNetDir.concat('fulltext');
  const fullTextChunkSize = config.default.fullTextChunkSize;
  const relationsFilePath = config.default.frameNetDir.concat('frRelation.xml');
  const semTypesFilePath = config.default.frameNetDir.concat('semTypes.xml');
  importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize, frameDir,
    frameChunkSize, fullTextDir, fullTextChunkSize, relationsFilePath, semTypesFilePath)
    .then(() => logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`));
}
