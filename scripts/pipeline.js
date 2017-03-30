const config = require('./../config');
const driver = require('./../db/mongo');
const importFrames = require('./importFrames');
const importFullTexts = require('./importFullTexts');
const importLexUnits = require('./importLexUnits');
const importRelations = require('./importRelations');
const importSemTypes = require('./importSemTypes');

const logger = config.logger;

async function importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize,
  frameDir, frameChunkSize, fullTextDir, relationsFilePath,
  semTypesFilePath) {
  const db = await driver.connectToDatabase(dbUri);
  await importFrames.importFramesOnceConnectedToDb(frameDir, frameChunkSize, db);
  logger.info('Frames import completed');
  await importRelations.importRelationsOnceConnectedToDb(relationsFilePath, db);
  logger.info('Relations import completed');
  await importSemTypes.importSemTypesOnceConnectedToDb(semTypesFilePath, db);
  logger.info('SemTypes import completed');
  await importLexUnits.importLexUnitsOnceConnectedToDb(lexUnitDir, lexUnitChunkSize, db);
  logger.info('LexUnits import completed');
  await importFullTexts.importFullTextOnceConnectedToDb(fullTextDir);
  logger.info('FullTexts import completed');
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.dbUri;
  const lexUnitDir = config.frameNetDir.concat('lu');
  const lexUnitChunkSize = config.lexUnitChunkSize;
  const frameDir = config.frameNetDir.concat('frame');
  const frameChunkSize = config.frameChunkSize;
  const fullTextDir = config.frameNetDir.concat('fulltext');
  const relationsFilePath = config.frameNetDir.concat('frRelation.xml');
  const semTypesFilePath = config.frameNetDir.concat('semTypes.xml');
  importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize, frameDir,
    frameChunkSize, fullTextDir, relationsFilePath, semTypesFilePath)
    .then(() => logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`));
}
