/**
 * A script to compare the set of lexical units under frame files and the set
 * of lexical units under the lu directory, as those two sets do no match.
 */
const utils = require('../utils/utils');
const toJsonixLexUnitArray = require('./../utils/jsonixUtils').toJsonixLexUnitArray;
const marshaller = require('./../marshalling/unmarshaller');
const config = require('./../config');

const logger = config.logger;

async function getLexUnitIDs(batch) {
  return Promise.all(batch.map(async file => parseInt(file.substring(file.lastIndexOf('lu') + 2, file.lastIndexOf('.xml')), 0)));
}

async function getLUIDs(batch) {
  return Promise.all(batch.map(async (file) => {
    const jsonixFrame = await marshaller.unmarshall(file);
    return toJsonixLexUnitArray(jsonixFrame)
      .map(jsonixLexUnit => jsonixLexUnit.id);
  }));
}

async function compare(frameDir, frameChunkSize, lexUnitDir, lexUnitChunkSize) {
  const frameBatchSet = await utils.filterAndChunk(frameDir, frameChunkSize);
  const lexUnitBatchSet = await utils.filterAndChunk(lexUnitDir, lexUnitChunkSize);
  const frameLUIDs = [];
  const lexUnitIDs = [];
  for (const batch of frameBatchSet) {
    const fluIDs = await getLUIDs(batch);
    const ffluIDs = fluIDs.reduce((a, b) => a.concat(b));
    frameLUIDs.push(...ffluIDs);
  }
  for (const batch of lexUnitBatchSet) {
    const luIDs = await getLexUnitIDs(batch);
    lexUnitIDs.push(...luIDs);
  }
  logger.info(`fLUSize = ${frameLUIDs.length}`);
  logger.info(`LUSize = ${lexUnitIDs.length}`);
  const notInLexUnitSet = frameLUIDs.filter(x => !lexUnitIDs.includes(x));
  const notInFrameLUSet = lexUnitIDs.filter(x => !frameLUIDs.includes(x));
  logger.info(`NotInLexUnitSet = ${notInLexUnitSet.length}`);
  logger.info(`NotInFrameLUSet = ${notInFrameLUSet.length}`);
}

if (require.main === module) {
  const lexUnitDir = config.frameNetDir.concat('lu');
  const lexUnitChunkSize = config.lexUnitChunkSize;
  const frameDir = config.frameNetDir.concat('frame');
  const frameChunkSize = config.frameChunkSize;
  compare(frameDir, frameChunkSize, lexUnitDir, lexUnitChunkSize);
}
