'use strict';

import filesystem from "fs";
import config from "./../config";

const logger = config.logger;

function isValidXml(file) {
  return file.endsWith('.xml');
}

async function filterAndChunk(dir, chunkSize) {
  logger.info('Processing directory: ' + dir);
  var filesPromise = new Promise((resolve, reject) => {
    filesystem.readdir(dir, (error, files) => {
      if (error) return reject(error);
      return resolve(files);
    })
  });
  var files = await filesPromise;
  logger.debug(`Unfiltered files count = ${files.length}`);
  logger.info(`Total number of files = ${files.filter(isValidXml).length}`);
  var slicedFileArray = files.filter(isValidXml).chunk(chunkSize);
  logger.debug(`Slice count = ${slicedFileArray.length}`);
  return slicedFileArray;
}

export default {
  filterAndChunk,
}
