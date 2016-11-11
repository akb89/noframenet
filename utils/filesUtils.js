import filesystem from 'fs';
import path from 'path';
import config from './../config';
import './utils'; // For chunk()

const logger = config.logger;

function isValidXml(file) {
  return file.endsWith('.xml');
}

export async function filterAndChunk(dir, chunkSize) {
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
