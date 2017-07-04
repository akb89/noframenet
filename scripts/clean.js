const config = require('./../config');
const driver = require('./../db/mongoose');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const logger = config.logger;

async function clean(dbUri) {
  await driver.connectToDatabase(dbUri);
  logger.info(`Cleaning up database ${dbUri}`);
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
}

if (require.main === module) {
  const dbUri = config.dbUri;
  clean(dbUri);
}
