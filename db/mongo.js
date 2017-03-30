const mongoose = require('mongoose');
const mongodb = require('mongodb');
const bluebird = require('bluebird');
const config = require('./../config');

const MongoClient = mongodb.MongoClient;
const logger = config.logger;

mongoose.Promise = bluebird;

async function connectToDatabase(uri) {
  let mongo;
  try {
    mongo = await MongoClient.connect(uri, {
      connectTimeoutMS: 0,
      socketTimeoutMS: 0,
    }); // db inserts will be performed directly via the mongo driver for
    // better performances
    await mongoose.connect(uri, {
      reconnectTries: Number.MAX_VALUE,
      keepAlive: 120,
      connectTimeoutMS: 0,
      socketTimeoutMS: 0,
    }); // models (and indexes) will be initialized via the mongoose models for
  // scalability and readability
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
  logger.info(`Connected to database: ${uri}`);
  return {
    mongo,
    mongoose,
  };
}

module.exports = {
  connectToDatabase,
};
