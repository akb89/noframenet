const path = require('path');
const config = require('./../config');
const driver = require('./../db/mongoose');
const importFrames = require('./importFrames');
const importFullTexts = require('./importFullTexts');
const importLexUnits = require('./importLexUnits');
const importRelations = require('./importRelations');
const importSemTypes = require('./importSemTypes');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const logger = config.logger;

async function importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize,
                                  frameDir, frameChunkSize, fullTextDir,
                                  relationsFilePath, semTypesFilePath) {
  await driver.connectToDatabase(dbUri);
  await importFrames.importFramesOnceConnectedToDb(frameDir, frameChunkSize);
  logger.info('Frames import completed');
  await importRelations.importRelationsOnceConnectedToDb(relationsFilePath);
  logger.info('Relations import completed');
  await importSemTypes.importSemTypesOnceConnectedToDb(semTypesFilePath);
  logger.info('SemTypes import completed');
  await importLexUnits.importLexUnitsOnceConnectedToDb(lexUnitDir,
                                                       lexUnitChunkSize);
  logger.info('LexUnits import completed');
  await importFullTexts.importFullTextOnceConnectedToDb(fullTextDir);
  logger.info('FullTexts import completed');
  await mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.dbUri;
  const lexUnitDir = path.join(config.frameNetDir, 'lu');
  const lexUnitChunkSize = config.lexUnitChunkSize;
  const frameDir = path.join(config.frameNetDir, 'frame');
  const frameChunkSize = config.frameChunkSize;
  const fullTextDir = path.join(config.frameNetDir, 'fulltext');
  const relationsFilePath = path.join(config.frameNetDir, 'frRelation.xml');
  const semTypesFilePath = path.join(config.frameNetDir, 'semTypes.xml');
  importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize, frameDir,
                     frameChunkSize, fullTextDir, relationsFilePath,
                     semTypesFilePath)
    .then(() => logger.info(`Import completed in ${process.hrtime(startTime)[0]}s`));
}
