const mongoose = require('mongoose');
const bluebird = require('bluebird');
const config = require('./../config');

const logger = config.logger;

mongoose.Promise = bluebird;

async function connectToDatabase(uri) {
  try {
    const options = {
      reconnectTries: Number.MAX_VALUE,
      keepAlive: 120,
      connectTimeoutMS: 0,
      socketTimeoutMS: 0,
    };

    await mongoose.connect(uri, options);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  logger.info(`Connected to database: ${uri}`);
}

module.exports = {
  connectToDatabase,
};
