const config = require('./../config');
const driver = require('./../db/mongo');

const logger = config.logger;

async function clean(dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  const dbName = db.mongo.s.databaseName;
  logger.info(`Cleaning up database ${dbName}`);
  await db.mongo.dropDatabase(dbName);
  await db.mongo.close();
  await db.mongoose.disconnect();
}

if (require.main === module) {
  const dbUri = config.dbUri;
  clean(dbUri);
}
