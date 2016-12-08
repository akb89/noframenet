import config from './../config';
import driver from './../db/mongo';

const logger = config.default.logger;

async function clean(dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  const dbName = db.mongo.s.databaseName;
  logger.info(`Cleaning up database ${dbName}`);
  await db.mongo.dropDatabase(dbName);
  await db.mongo.close();
  await db.mongoose.disconnect();
}

if (require.main === module) {
  const dbUri = config.default.dbUri;
  clean(dbUri);
}
