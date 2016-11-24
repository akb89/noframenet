import mongoose from 'mongoose';
import mongodb from 'mongodb';
import config from './../config';

const MongoClient = mongodb.MongoClient;
const logger = config.logger;

async function connectToDatabase(uri) {
  let mongo;
  try {
    mongo = await MongoClient.connect(uri, {
      server: {
        socketOptions: {
          connectTimeoutMS: 0,
          socketTimeoutMS: 0,
        },
      },
    }); // db inserts will be performed directly via the mongo driver for
    // better performances
    await mongoose.connect(uri, {
      server: {
        reconnectTries: Number.MAX_VALUE,
        socketOptions: {
          keepAlive: 120,
          connectTimeoutMS: 0,
          socketTimeoutMS: 0,
        },
      },
      replset: {
        socketOptions: {
          keepAlive: 120,
        },
      },
    }); // models (and indexes) will be initialized via the mongoose models for
    // scalability and readability
  } catch (err) {
    logger.error(err);
    process.exit(1); // TODO : graceful exit?
  }
  logger.info(`Connected to database: ${uri}`);
  return {
    mongo,
    mongoose,
  };
}

export default {
  connectToDatabase,
};
