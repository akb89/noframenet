import config from './../config';
import driver from './../db/mongo';
import { importFramesOnceConnectedToDb } from './importFrames';
import { importFullTextOnceConnectedToDb } from './importFullTexts';
import { importLexUnitsOnceConnectedToDb } from './importLexUnits';
import { importRelationsOnceConnectedToDb } from './importRelations';
import { importSemTypesOnceConnectedToDb } from './importSemTypes';

async function importFrameNetData(dbUri, lexUnitDir, lexUnitChunkSize,
  frameDir, frameChunkSize, fullTextDir, fullTextChunkSize, relationsFilePath,
  semTypesFilePath) {
  const db = await driver.connectToDatabase(dbUri);
  await importFramesOnceConnectedToDb(frameDir, frameChunkSize, db);
  await importFullTextOnceConnectedToDb(fullTextDir, fullTextChunkSize, db);
  await importRelationsOnceConnectedToDb(relationsFilePath, db);
  await importSemTypesOnceConnectedToDb(semTypesFilePath, db);
  await importLexUnitsOnceConnectedToDb(lexUnitDir, lexUnitChunkSize, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importFrameNetData(config.default.dbUri, config.default.lexUnitDir,
    config.default.lexUnitChunkSize, config.default.frameDir,
    config.default.frameChunkSize, config.default.fullTextDir,
    config.default.fullTextChunkSize, config.default.relationsFilePath,
    config.default.semTypesFilePath);
}
