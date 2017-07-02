/**
 * Standalone script to import the content of the fulltext directory to MongoDB
 * This script is different from the other import scripts: it imports
 * everything synchronously as it first checks everything already in the
 * database
 */
const AnnotationSet = require('noframenet-core').AnnotationSet;
const Corpus = require('noframenet-core').Corpus;
const Document = require('noframenet-core').Document;
const Label = require('noframenet-core').Label;
const Pattern = require('noframenet-core').Pattern;
const Sentence = require('noframenet-core').Sentence;
const ValenceUnit = require('noframenet-core').ValenceUnit;
const ProgressBar = require('ascii-progress');
const toJsonixDocumentArray = require('./../../utils/jsonixUtils').toJsonixDocumentArray;
const toJsonixDocumentSentenceArray = require('./../../utils/jsonixUtils').toJsonixDocumentSentenceArray;
const toJsonixLabelArray = require('./../../utils/jsonixUtils').toJsonixLabelArray;
const toJsonixLayerArray = require('./../../utils/jsonixUtils').toJsonixLayerArray;
const toJsonixSentenceAnnoSetArray = require('./../../utils/jsonixUtils').toJsonixSentenceAnnoSetArray;
const config = require('./../../config');
const marshaller = require('./../../marshalling/unmarshaller');
const utils = require('./../../utils/utils');

const logger = config.logger;

function isValidFNAnnoSet(jsonixAnnoSet) {
  let isValidFELayer = false;
  let isValidPTLayer = false;
  let isValidGFLayer = false;
  toJsonixLayerArray(jsonixAnnoSet).forEach((jsonixLayer) => {
    if (jsonixLayer.name === 'FE' && jsonixLayer.label) {
      isValidFELayer = true;
    }
    if (jsonixLayer.name === 'PT' && jsonixLayer.label) {
      isValidPTLayer = true;
    }
    if (jsonixLayer.name === 'GF' && jsonixLayer.label) {
      isValidGFLayer = true;
    }
  });
  if (isValidFELayer && isValidPTLayer && isValidGFLayer) {
    return true;
  }
  return false;
}

function getLabelObjectsMap(jsonixAnnoSet) {
  const labelOmap = new Map();
  toJsonixLayerArray(jsonixAnnoSet).forEach((jsonixLayer) => {
    toJsonixLabelArray(jsonixLayer).forEach((jsonixLabel) => {
      if (jsonixLabel.start !== undefined && jsonixLabel.end !== undefined) {
        const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
        if (!labelOmap.has(key)) {
          labelOmap.set(key, {});
        }
        if (jsonixLayer.name === 'FE') {
          labelOmap.get(key).FE = jsonixLabel.feID;
        } else if (jsonixLabel.itype !== undefined) {
          // iType is PT. See lexUnits xml files.
          labelOmap.get(key).PT = jsonixLabel.itype;
        } else {
          labelOmap.get(key)[jsonixLayer.name] = jsonixLabel.name;
        }
      }
    });
  });
  return labelOmap;
}

function getPatternKey(vuIDs) {
  return vuIDs.map(vuID => vuID.toString()).sort().join('#');
}

function getVUids(jsonixAnnoSet, valenceUnitsMap) {
  return Array.from(getLabelObjectsMap(jsonixAnnoSet).values()).map((labelO) => {
    const key = `${labelO.FE}#${labelO.PT}#${labelO.GF}`;
    if (!valenceUnitsMap.has(key)) {
      valenceUnitsMap.set(key, new ValenceUnit({
        FE: labelO.FE,
        PT: labelO.PT,
        GF: labelO.GF,
      }).toObject());
    }
    return valenceUnitsMap.get(key)._id;
  });
}

function getPatternID(jsonixAnnoSet, patternsMap, valenceUnitsMap) {
  const vuIDs = getVUids(jsonixAnnoSet, valenceUnitsMap);
  if (vuIDs.length === 0) {
    logger.error(`vuIDs.length === 0 in annoationSet.id = ${jsonixAnnoSet.id}`);
  }
  const key = getPatternKey(vuIDs);
  if (!patternsMap.has(key)) {
    patternsMap.set(key, new Pattern({
      valenceUnits: vuIDs,
    }).toObject());
  }
  return patternsMap.get(key)._id;
}

function getLabelIDs(jsonixAnnoSet, labels) {
  return toJsonixLayerArray(jsonixAnnoSet)
    .map(jsonixLayer => toJsonixLabelArray(jsonixLayer)
      .map((jsonixLabel) => {
        const label = new Label({
          name: jsonixLabel.name,
          type: jsonixLayer.name,
          rank: jsonixLayer.rank,
          startPos: jsonixLabel.start,
          endPos: jsonixLabel.end,
        }).toObject();
        labels.push(label);
        return label._id;
      })).reduce((a, b) => a.concat(b));
}

function processAnnotationSets(jsonixSentence, annoSetsMap, labels,
                               patternsMap, valenceUnitsMap) {
  toJsonixSentenceAnnoSetArray(jsonixSentence).forEach((jsonixAnnoSet) => {
    // In FrameNet 1.5 there are collisions in AnnotationSet IDs. When a
    // collision is detected, replace by the fulltext reference
    const annoSet = new AnnotationSet({
      _id: jsonixAnnoSet.id,
      lexUnit: jsonixAnnoSet.luID,
      sentence: jsonixSentence.id,
      labels: getLabelIDs(jsonixAnnoSet, labels),
    }).toObject();
    if (isValidFNAnnoSet(jsonixAnnoSet)) {
      const patternID = getPatternID(jsonixAnnoSet, patternsMap, valenceUnitsMap);
      if (!patternID) {
        logger.error(`patternID = ${patternID}`);
      }
      annoSet.pattern = getPatternID(jsonixAnnoSet, patternsMap, valenceUnitsMap);
    }
    annoSetsMap.set(Number(jsonixAnnoSet.id), annoSet); // Replace if found
  });
}

function getSentenceIDs(jsonixFullText, annoSetsMap, labels, patternsMap,
                        sentencesMap, valenceUnitsMap) {
  return toJsonixDocumentSentenceArray(jsonixFullText).map((jsonixSentence) => {
    processAnnotationSets(jsonixSentence, annoSetsMap, labels, patternsMap,
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

function processCorpus(jsonixFullText, annoSetsMap, corporaMap, documentsMap,
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

async function importFullText(file, annoSetsMap, corporaMap, documentsMap,
                              labels, patternsMap, sentencesMap,
                              valenceUnitsMap) {
  logger.debug(`Importing fulltext file ${file}...`);
  const jsonixFullText = await marshaller.unmarshall(file);
  processCorpus(jsonixFullText, annoSetsMap, corporaMap, documentsMap,
                labels, patternsMap, sentencesMap, valenceUnitsMap);
}

/**
 * Sentences, AnnotationSets and Labels will be imported with the
 * importLexUnits script.
 */
async function importFiles(files, annoSetsMap, corporaMap, documentsMap,
                           labels, patternsMap, sentencesMap, valenceUnitsMap) {
  logger.info('Importing fulltext files...');
  const fulltextProgressBar = new ProgressBar({
    total: files.length,
    clean: true,
  });
  for (const file of files) {
    try {
      await importFullText(file, annoSetsMap, corporaMap, documentsMap,
                           labels, patternsMap, sentencesMap, valenceUnitsMap);
    } catch (err) {
      logger.error(err);
      logger.info('Exiting NoFrameNet');
      process.exit(1);
    }
    fulltextProgressBar.tick();
  }
}

async function importFullTexts(fullTextDir, annoSetsMap, corporaMap,
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
  await importFiles(files, annoSetsMap, corporaMap, documentsMap,
                    labels, patternsMap, sentencesMap, valenceUnitsMap);
}

module.exports = {
  importFullTexts,
};
