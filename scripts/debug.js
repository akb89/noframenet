import config from './../config';
import driver from './../db/mongo';
import importFullTexts from './importFullTexts';

const logger = config.default.logger;

async function debug(file, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  try {
    await importFullTexts.importFile(file);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.default.dbUri;
  const fullTextDir = config.default.frameNetDir.concat('fulltext');
  const file = fullTextDir.concat('/LUCorpus-v0.3__20000420_xin_eng-NEW.xml');
  debug(file, dbUri)
    .then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}
