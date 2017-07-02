/**
 * Standalone script to import FrameNet lexical units to MongoDB.
 */
const Sentence = require('noframenet-core').Sentence;
const ProgressBar = require('ascii-progress');
const toJsonixLexUnitSentenceArray = require('./../../utils/jsonixUtils').toJsonixLexUnitSentenceArray;
const annoSetsImport = require('./annoSets');
const config = require('./../../config');
const marshaller = require('./../../marshalling/unmarshaller');
const utils = require('./../../utils/utils');

const logger = config.logger;

function processSentences(jsonixLexUnit, annoSetsMap, labels, lexUnitID,
                          patternsMap, sentencesMap, valenceUnitsMap) {
  toJsonixLexUnitSentenceArray(jsonixLexUnit).forEach((jsonixSentence) => {
    annoSetsImport.processAnnotationSets(jsonixSentence, annoSetsMap, labels,
                                         lexUnitID, patternsMap,
                                         valenceUnitsMap);
    const sentenceID = Number(jsonixSentence.id);
    if (!sentencesMap.has(sentenceID)) {
      sentencesMap.set(sentenceID, new Sentence({
        _id: jsonixSentence.id,
        text: jsonixSentence.text,
        paragraphNumber: jsonixSentence.paragNo,
        sentenceNumber: jsonixSentence.sentNo,
        aPos: jsonixSentence.aPos,
      }).toObject());
    }
  });
}

function processLexUnit(jsonixLexUnit, annoSetsMap, labels, patternsMap,
                        sentencesMap, valenceUnitsMap) {
  processSentences(jsonixLexUnit, annoSetsMap, labels, jsonixLexUnit.value.id,
                   patternsMap, sentencesMap, valenceUnitsMap);
}

async function processBatch(batch, annoSetsMap, labels, patternsMap,
                            sentencesMap, valenceUnitsMap) {
  await Promise.all(batch.map(async (file) => {
    const jsonixLexUnit = await marshaller.unmarshall(file);
    processLexUnit(jsonixLexUnit, annoSetsMap, labels, patternsMap, sentencesMap, valenceUnitsMap);
  }));
}

async function importBatchSet(batchSet, annoSetsMap, labels, patternsMap,
                              sentencesMap, valenceUnitsMap) {
  let counter = 1;
  const lexUnitProgressBar = new ProgressBar({
    total: batchSet.length,
    clean: true,
  });
  logger.info('Importing lexical units by batch...');
  for (const batch of batchSet) {
    logger.debug(`Importing lexUnit batch ${counter} out of ${batchSet.length}...`);
    await processBatch(batch, annoSetsMap, labels, patternsMap, sentencesMap,
                       valenceUnitsMap);
    counter += 1;
    lexUnitProgressBar.tick();
  }
}

async function importLexUnits(lexUnitDir, chunkSize, annoSetsMap, labels,
                              patternsMap, sentencesMap, valenceUnitsMap) {
  let batchSet;
  try {
    batchSet = await utils.filterAndChunk(lexUnitDir, chunkSize);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await importBatchSet(batchSet, annoSetsMap, labels, patternsMap,
                       sentencesMap, valenceUnitsMap);
}

module.exports = {
  importLexUnits,
};
