/**
 * Standalone script to import the content of the fulltext directory to MongoDB
 * This script is different from the other import scripts: it imports
 * everything synchronously as it first checks everything already in the
 * database
 */
const Corpus = require('noframenet-core').Corpus;
const Document = require('noframenet-core').Document;
const Sentence = require('noframenet-core').Sentence;
const ProgressBar = require('ascii-progress');
const toJsonixDocumentArray = require('./../../utils/jsonixUtils').toJsonixDocumentArray;
const toJsonixDocumentSentenceArray = require('./../../utils/jsonixUtils').toJsonixDocumentSentenceArray;
const annoSetsImport = require('./annoSets');
const config = require('./../../config');
const marshaller = require('./../../marshalling/unmarshaller');
const utils = require('./../../utils/utils');

const logger = config.logger;

function getSentenceIDs(jsonixFullText, annoSetsMap, labels, patternsMap,
                        sentencesMap, valenceUnitsMap) {
  return toJsonixDocumentSentenceArray(jsonixFullText).map((jsonixSentence) => {
    annoSetsImport.processAnnotationSets(jsonixSentence, annoSetsMap, labels,
                                         null, patternsMap, valenceUnitsMap);
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
    return sentenceID;
  });
}

/**
 * Theoretically (in header.xsd), maxOccurs="unbounded" for
 * document so it is processed as an array here
 */
function getDocumentIDs(jsonixFullText, annoSetsMap, documentsMap, labels,
                        patternsMap, sentencesMap, valenceUnitsMap) {
  return toJsonixDocumentArray(jsonixFullText.value.header.corpus[0]).map((jsonixDocument) => {
    const documentID = Number(jsonixDocument.id);
    if (!documentsMap.has(documentID)) {
      documentsMap.set(documentID, new Document({
        _id: jsonixDocument.id,
        name: jsonixDocument.name,
        description: jsonixDocument.description,
        sentences: getSentenceIDs(jsonixFullText, annoSetsMap, labels,
                                  patternsMap, sentencesMap, valenceUnitsMap),
      }).toObject());
    }
    return documentID;
  });
}

function extractCorpus(jsonixFullText, annoSetsMap, corporaMap, documentsMap,
                       labels, patternsMap, sentencesMap, valenceUnitsMap) {
  const corpusID = Number(jsonixFullText.value.header.corpus[0].id);
  if (!corporaMap.has(corpusID)) {
    corporaMap.set(corpusID, new Corpus({
      _id: corpusID,
      name: jsonixFullText.value.header.corpus[0].name,
      description: jsonixFullText.value.header.corpus[0].description,
      documents: [],
    }).toObject());
  }
  corporaMap.get(corpusID).documents.push(...getDocumentIDs(jsonixFullText,
                                                            annoSetsMap,
                                                            documentsMap,
                                                            labels,
                                                            patternsMap,
                                                            sentencesMap,
                                                            valenceUnitsMap));
}

async function extractFullText(file, annoSetsMap, corporaMap, documentsMap,
                               labels, patternsMap, sentencesMap,
                               valenceUnitsMap) {
  logger.debug(`Extracting fulltext file ${file}...`);
  const jsonixFullText = await marshaller.unmarshall(file);
  extractCorpus(jsonixFullText, annoSetsMap, corporaMap, documentsMap,
                labels, patternsMap, sentencesMap, valenceUnitsMap);
}

/**
 * Sentences, AnnotationSets and Labels will be imported with the
 * importLexUnits script.
 */
async function extractFiles(files, annoSetsMap, corporaMap, documentsMap,
                            labels, patternsMap, sentencesMap, valenceUnitsMap) {
  logger.info('Extracting fulltext files...');
  const fulltextProgressBar = new ProgressBar({
    total: files.length,
    clean: true,
  });
  for (const file of files) {
    try {
      await extractFullText(file, annoSetsMap, corporaMap, documentsMap,
                            labels, patternsMap, sentencesMap, valenceUnitsMap);
    } catch (err) {
      logger.error(err);
      logger.info('Exiting NoFrameNet');
      process.exit(1);
    }
    fulltextProgressBar.tick();
  }
}

async function extractFullTexts(fullTextDir, annoSetsMap, corporaMap,
                                documentsMap, labels, patternsMap, sentencesMap,
                                valenceUnitsMap) {
  let files;
  try {
    files = await utils.filter(fullTextDir);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await extractFiles(files, annoSetsMap, corporaMap, documentsMap,
                     labels, patternsMap, sentencesMap, valenceUnitsMap);
}

module.exports = {
  extractFullTexts,
};
