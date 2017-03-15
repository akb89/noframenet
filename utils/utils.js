import filesystem from 'fs';
import path from 'path';
import config from './../config';

const logger = config.default.logger;

function isValidXml(file) {
  return file.endsWith('.xml');
}

if (!Array.prototype.chunk) {
  Object.defineProperty(Array.prototype, 'chunk', {
    value(chunkSize) {
      const chunks = [];
      if (this.length <= chunkSize) {
        chunks.push(this);
        return chunks;
      }
      let iterator = 0;
      while (iterator + chunkSize <= this.length) {
        chunks.push(this.slice(iterator, iterator + chunkSize));
        iterator += chunkSize;
      }
      if (this.slice(iterator)
          .length !== 0) {
        chunks.push(this.slice(iterator));
      }
      return chunks;
    },
  });
}

async function filterAndChunk(dir, chunkSize) {
  logger.info(`Processing directory: ${dir}`);
  const filesPromise = new Promise((resolve, reject) => {
    filesystem.readdir(dir, (error, files) => {
      if (error) return reject(error);
      return resolve(files);
    });
  });
  const files = await filesPromise;
  logger.info(`Total number of files = ${files.filter(isValidXml).length}`);
  return files
    .filter(isValidXml)
    .chunk(chunkSize)
    .map(chunk => chunk.map(file => path.join(dir, file)));
}

async function filter(dir) {
  logger.info(`Processing directory: ${dir}`);
  const filesPromise = new Promise((resolve, reject) => {
    filesystem.readdir(dir, (error, files) => {
      if (error) return reject(error);
      return resolve(files);
    });
  });
  const files = await filesPromise;
  logger.info(`Total number of files = ${files.filter(isValidXml).length}`);
  return files
    .filter(isValidXml)
    .map(file => path.join(dir, file));
}

export default {
  filterAndChunk,
  filter,
};
