// Because of the export default works with babel, we need to use classic require
import logger from './../logger/logger';

const env = process.env.NODE_ENV || 'development';
let config;
try {
  config = require(`./${env}.js`);
} catch (error) {
  logger.info.info(error);
  logger.info.info(`No specific configuration for env ${env}`);
}

export default config;
