/**
 * Standalone script to import FrameNet lexical units to MongoDB.
 */
const AnnotationSet = require('noframenet-core').AnnotationSet;
const Label = require('noframenet-core').Label;
const Pattern = require('noframenet-core').Pattern;
const Sentence = require('noframenet-core').Sentence;
const ValenceUnit = require('noframenet-core').ValenceUnit;
const ProgressBar = require('ascii-progress');
const toJsonixLabelArray = require('./../../utils/jsonixUtils').toJsonixLabelArray;
const toJsonixLayerArray = require('./../../utils/jsonixUtils').toJsonixLayerArray;
const toJsonixLexUnitSentenceArray = require('./../../utils/jsonixUtils').toJsonixLexUnitSentenceArray;
const toJsonixPatternAnnoSetArray = require('./../../utils/jsonixUtils').toJsonixPatternAnnoSetArray;
const toJsonixPatternArray = require('./../../utils/jsonixUtils').toJsonixPatternArray;
const toJsonixSentenceAnnoSetArray = require('./../../utils/jsonixUtils').toJsonixSentenceAnnoSetArray;
const toJsonixValenceUnitArray = require('./../../utils/jsonixUtils').toJsonixValenceUnitArray;
const config = require('./../../config');
const marshaller = require('./../../marshalling/unmarshaller');
const utils = require('./../../utils/utils');

const logger = config.logger;

function assignPatternIDtoAnnoSets(jsonixPattern, patternID, annoSetsMap) {
  toJsonixPatternAnnoSetArray(jsonixPattern).forEach((jsonixAnnoSet) => {
    if (!patternID) {
      logger.error(`patternID = ${patternID}`);
    }
    if (!annoSetsMap.get(Number(jsonixAnnoSet.id))) {
      logger.error(`Could not find annoSet.id = ${jsonixAnnoSet.id} in lexunit #`);
    }
    annoSetsMap.get(Number(jsonixAnnoSet.id)).pattern = patternID;
  });
}

function getValenceUnitKey(feID, pt, gf) {
  return `${feID}#${pt}#${gf}`;
}

function getPatternKey(vuIDs) {
  return vuIDs.map(vuID => vuID.toString()).sort().join('#');
}

function getVUids(jsonixPattern, valenceUnitsMap, feName2IDmap) {
  return toJsonixValenceUnitArray(jsonixPattern).map((jsonixValenceUnit) => {
    const feID = feName2IDmap.get(jsonixValenceUnit.fe);
    if (feID === undefined) {
      logger.error(`feID = ${feID}`);
      throw new Error(`FE '${jsonixValenceUnit.fe}' is undefined`);
    }
    const key = getValenceUnitKey(feID, jsonixValenceUnit.pt, jsonixValenceUnit.gf);
    if (!valenceUnitsMap.has(key)) {
      valenceUnitsMap.set(key, new ValenceUnit({
        FE: feID,
        PT: jsonixValenceUnit.pt,
        GF: jsonixValenceUnit.gf,
      }).toObject());
    }
    return valenceUnitsMap.get(key)._id;
  });
}

function processPatterns(jsonixLexUnit, annoSetsMap, patternsMap,
                         valenceUnitsMap, feName2IDmap) {
  // Import patterns and valenceUnits.
  // Add all info regading patterns and lexUnits to AnnoSet objects
  toJsonixPatternArray(jsonixLexUnit).forEach((jsonixPattern) => {
    try {
      const vuIDs = getVUids(jsonixPattern, valenceUnitsMap, feName2IDmap);
      if (vuIDs.length === 0) {
        logger.error(`vuIDs.length === 0 in lexUnit #${jsonixLexUnit.value.id}`);
      }
      const key = getPatternKey(vuIDs);
      if (!patternsMap.has(key)) {
        patternsMap.set(key, new Pattern({
          valenceUnits: vuIDs,
        }).toObject());
      }
      assignPatternIDtoAnnoSets(jsonixPattern, patternsMap.get(key)._id,
                                annoSetsMap);
    } catch (err) {
      logger.error(`${err.message} in lexUnit #${jsonixLexUnit.value.id}`);
    }
  });
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

function processAnnotationSets(jsonixSentence, annoSetsMap, lexUnitID, labels) {
  toJsonixSentenceAnnoSetArray(jsonixSentence).forEach((jsonixAnnoSet) => {
    const annoSetID = Number(jsonixAnnoSet.id);
    if (!annoSetsMap.has(annoSetID)) {
      annoSetsMap.set(annoSetID, new AnnotationSet({
        _id: jsonixAnnoSet.id,
        lexUnit: lexUnitID,
        sentence: jsonixSentence.id,
        labels: getLabelIDs(jsonixAnnoSet, labels),
      }).toObject());
    }
  });
}

function processSentences(jsonixLexUnit, annoSetsMap, sentencesMap, labels,
                          lexUnitID) {
  toJsonixLexUnitSentenceArray(jsonixLexUnit).forEach((jsonixSentence) => {
    processAnnotationSets(jsonixSentence, annoSetsMap, lexUnitID, labels);
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

function processLexUnit(jsonixLexUnit, annoSetsMap, patternsMap, sentencesMap,
                        valenceUnitsMap, labels, feName2IDmap) {
  processSentences(jsonixLexUnit, annoSetsMap, sentencesMap, labels,
                   jsonixLexUnit.value.id);
  /*processPatterns(jsonixLexUnit, annoSetsMap, patternsMap,
                  valenceUnitsMap, feName2IDmap);*/
}

// A Map of FEName -> full noframenet-core.FrameElement for a given Frame
function getFEName2IDmap(frameID, fesMap, framesMap) {
  const feName2IDmap = new Map();
  const frame = framesMap.get(frameID);
  frame.frameElements.forEach((feID) => {
    const fe = fesMap.get(Number(feID));
    feName2IDmap.set(fe.name, fe._id);
  });
  return feName2IDmap;
}

async function processBatch(batch, annoSetsMap, fesMap, framesMap, patternsMap,
                            sentencesMap, valenceUnitsMap, labels) {
  await Promise.all(batch.map(async (file) => {
    const jsonixLexUnit = await marshaller.unmarshall(file);
    const frameID = Number(jsonixLexUnit.value.frameID);
    const feName2IDmap = await getFEName2IDmap(frameID, fesMap, framesMap);
    processLexUnit(jsonixLexUnit, annoSetsMap, patternsMap, sentencesMap,
                   valenceUnitsMap, labels, feName2IDmap);
  }));
}

async function importBatchSet(batchSet, annoSetsMap, fesMap, framesMap,
                              patternsMap, sentencesMap, valenceUnitsMap,
                              labels) {
  let counter = 1;
  const lexUnitProgressBar = new ProgressBar({
    total: batchSet.length,
    clean: true,
  });
  logger.info('Importing lexical units by batch...');
  for (const batch of batchSet) {
    logger.debug(`Importing lexUnit batch ${counter} out of ${batchSet.length}...`);
    await processBatch(batch, annoSetsMap, fesMap, framesMap, patternsMap,
                       sentencesMap, valenceUnitsMap, labels);
    counter += 1;
    lexUnitProgressBar.tick();
  }
}

async function importLexUnits(lexUnitDir, chunkSize, annoSetsMap, fesMap,
                              framesMap, patternsMap, sentencesMap,
                              valenceUnitsMap, labels) {
  let batchSet;
  try {
    batchSet = await utils.filterAndChunk(lexUnitDir, chunkSize);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await importBatchSet(batchSet, annoSetsMap, fesMap, framesMap, patternsMap,
                       sentencesMap, valenceUnitsMap, labels);
}

module.exports = {
  importLexUnits,
};
