import mongoose from 'mongoose';
import mongodb from "mongodb";
import config from "./../config";

const MongoClient = mongodb.MongoClient;
const logger = config.logger;

async function connectToDatabase(uri) {
  let mongo;
  try {
    mongo = await MongoClient.connect(uri); // db inserts will be performed directly via the mongo driver for better performances
    await mongoose.connect('mongodb://localhost:27017/dev'); // models (and indexes) will be initialized via the mongoose models for scalability and readability
  } catch (err) {
    logger.error(err);
    process.exit(1); // TODO : graceful exit?
  }
  logger.info(`Connected to database: ${config.dbUri}`);
  return {
    mongo,
    mongoose
  };
}

export {
  connectToDatabase,
}
