import config from './../config';
import driver from './../db/mongo';
import importFrames from './importFrames';
import importFullTexts from './importFullTexts';
import importLexUnits from './importLexUnits';
import importRelations from './importRelations';
import importSemTypes from './importSemTypes';
import clean from './clean';

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
  await clean.cleanOnceConnectedToDB();
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importFrameNetData(config.default.dbUri, config.default.lexUnitDir,
    config.default.lexUnitChunkSize, config.default.frameDir,
    config.default.frameChunkSize, config.default.fullTextDir,
    config.default.fullTextChunkSize, config.default.relationsFilePath,
    config.default.semTypesFilePath).then(() => logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`));
}
