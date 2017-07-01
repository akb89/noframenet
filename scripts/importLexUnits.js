/**
 * Standalone script to import FrameNet lexical units to MongoDB.
 */
const AnnotationSet = require('noframenet-core').AnnotationSet;
const Frame = require('noframenet-core').Frame;
const FrameElement = require('noframenet-core').FrameElement;
const Label = require('noframenet-core').Label;
const Pattern = require('noframenet-core').Pattern;
const Sentence = require('noframenet-core').Sentence;
const ValenceUnit = require('noframenet-core').ValenceUnit;
const ProgressBar = require('ascii-progress');
const toJsonixLabelArray = require('./../utils/jsonixUtils').toJsonixLabelArray;
const toJsonixLayerArray = require('./../utils/jsonixUtils').toJsonixLayerArray;
const toJsonixLexUnitSentenceArray = require('./../utils/jsonixUtils').toJsonixLexUnitSentenceArray;
const toJsonixPatternAnnoSetArray = require('./../utils/jsonixUtils').toJsonixPatternAnnoSetArray;
const toJsonixPatternArray = require('./../utils/jsonixUtils').toJsonixPatternArray;
const toJsonixSentenceAnnoSetArray = require('./../utils/jsonixUtils').toJsonixSentenceAnnoSetArray;
const toJsonixValenceUnitArray = require('./../utils/jsonixUtils').toJsonixValenceUnitArray;
const config = require('./../config');
const driver = require('./../db/mongoose');
const marshaller = require('./../marshalling/unmarshaller');
const utils = require('./../utils/utils');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const logger = config.logger;

function convertToValenceUnits(jsonixPattern, valenceUnitsMap,
                               feName2IDmap) {
  return toJsonixValenceUnitArray(jsonixPattern).map((jsonixValenceUnit) => {
    const feID = feName2IDmap.get(jsonixValenceUnit.fe);
    if (!feID) {
      throw new Error(`FE is undefined: ${jsonixValenceUnit.fe}`);
    } else {
      const key = `${feID}#${jsonixValenceUnit.pt}#${jsonixValenceUnit.gf}`;
      // Note that here feID is a Number as we are using the original
      // FrameNet id. So we don't need to stringify feID
      let valenceUnit;
      if (!valenceUnitsMap.has(key)) {
        valenceUnit = new ValenceUnit({
          FE: feID,
          PT: jsonixValenceUnit.pt,
          GF: jsonixValenceUnit.gf,
        });
        valenceUnitsMap.set(key, valenceUnit.toObject());
      } else {
        valenceUnit = valenceUnitsMap.get(key);
      }
      return valenceUnit;
    }
  });
}

function processPatterns(jsonixLexUnit, annoSetID2PatternIDmap, patternsMap,
                         valenceUnitsMap, feName2IDmap) {
  // Import patterns and valenceUnits.
  // Add all info regading patterns and lexUnits to AnnoSet objects
  toJsonixPatternArray(jsonixLexUnit).forEach((jsonixPattern) => {
    try {
      const vus = convertToValenceUnits(jsonixPattern, valenceUnitsMap,
                                        feName2IDmap);
      if (vus.length === 0) {
        logger.error('vus.length === 0');
      }
      vus.forEach((vu) => {
        //logger.info(`vu._id = ${vu._id}, vu.id = ${vu.id}`);
        if (!vu._id) {
          logger.error(`vu._id does not exist: ${vu._id}`);
        } else if (vu._id === null || vu._id === undefined) {
          logger.error(`vu._id is null or undefined: ${vu._id}`);
        }
      });
      if (vus.length === 0) {
        logger.error('vus.length === 0');
      }
      const key = vus.map(vu => vu._id.toString()).sort().join('#');
      let pattern;
      if (!patternsMap.has(key)) {
        pattern = new Pattern({
          valenceUnits: vus.map(vu => vu._id),
        });
        patternsMap.set(key, pattern.toObject());
      } else {
        pattern = patternsMap.get(key);
      }
      toJsonixPatternAnnoSetArray(jsonixPattern).forEach((jsonixAnnoSet) => {
        annoSetID2PatternIDmap.set(jsonixAnnoSet.id, pattern._id);
      });
    } catch (err) {
      logger.verbose(`${err.message} in lexUnit #${jsonixLexUnit.value.id}`);
    }
  });
}

function convertToLabels(jsonixAnnoSet) {
  return toJsonixLayerArray(jsonixAnnoSet)
    .map(jsonixLayer => toJsonixLabelArray(jsonixLayer)
      .map(jsonixLabel => new Label({
        name: jsonixLabel.name,
        type: jsonixLayer.name,
        rank: jsonixLayer.rank,
        startPos: jsonixLabel.start,
        endPos: jsonixLabel.end,
      }).toObject()))
    .reduce((a, b) => a.concat(b));
}

function convertToAnnoSets(jsonixSentence, lexUnitId, labels) {
  return toJsonixSentenceAnnoSetArray(jsonixSentence).map(jsonixAnnoSet => new AnnotationSet({
    _id: jsonixAnnoSet.id,
    lexUnit: lexUnitId,
    sentence: jsonixSentence.id,
    labels: convertToLabels(jsonixAnnoSet)
      .map((label) => {
        labels.push(label);
        return label._id;
      }),
  }).toObject());
}

function convertToSentences(jsonixLexUnit, annotationSets, labels) {
  return toJsonixLexUnitSentenceArray(jsonixLexUnit)
    .map((jsonixSentence) => {
      annotationSets.push(...convertToAnnoSets(jsonixSentence, jsonixLexUnit.value.id, labels));
      return new Sentence({
        _id: jsonixSentence.id,
        text: jsonixSentence.text,
        paragraphNumber: jsonixSentence.paragNo,
        sentenceNumber: jsonixSentence.sentNo,
        aPos: jsonixSentence.aPos,
      }).toObject();
    });
}

// Lemma and Lexeme information is updated via
// importLemmasAndLexemes script
function processLexUnit(jsonixLexUnit, annoSetID2PatternIDmap, annotationSets,
                        labels, patternsMap, sentences, valenceUnitsMap,
                        feName2IDmap) {
  sentences.push(...convertToSentences(jsonixLexUnit, annotationSets, labels));
  processPatterns(jsonixLexUnit, annoSetID2PatternIDmap, patternsMap,
                  valenceUnitsMap, feName2IDmap);
}

// A Map of FEName -> full noframenet-core.FrameElement for a given Frame
async function getFEName2IDmap(frameID) {
  const feMap = new Map();
  const frame = await Frame.findById(frameID);
  if (!frame) {
    logger.error(`frame is null for _id = ${frameID}`);
  }
  const fes = await FrameElement.find().where('_id').in(frame.frameElements);
  fes.forEach((fe) => {
    feMap.set(fe.name, fe._id);
  });
  return feMap;
}

async function convertToObjects(batch, uniques) {
  const data = {
    annotationSets: [],
    labels: [],
    sentences: [],
  };
  await Promise.all(batch.map(async (file) => {
    const jsonixLexUnit = await marshaller.unmarshall(file);
    const feName2IDmap = await getFEName2IDmap(jsonixLexUnit.value.frameID);
    try {
      processLexUnit(jsonixLexUnit, uniques.annoSetID2PatternIDmap,
                     data.annotationSets, data.labels, uniques.patternsMap,
                     data.sentences, uniques.valenceUnitsMap, feName2IDmap);
    } catch (err) {
      logger.verbose(`Ill-formed lexUnit detected: ID = ${jsonixLexUnit.value.id}`);
      logger.debug(err);
    }
  }));
  return data;
}

async function saveArraysToDb(data) {
  await AnnotationSet.collection.insertMany(data.annotationSets);
  await Label.collection.insertMany(data.labels);
  await Sentence.collection.insertMany(data.sentences);
}

async function saveMapsToDb(maps) {
  await Pattern.collection.insertMany(Array.from(maps.patternsMap.values()));
  await ValenceUnit.collection.insertMany(
    Array.from(maps.valenceUnitsMap.values()));
  logger.info('Updating annotatioSets\' pattern references...');
  const annoSetProgressBar = new ProgressBar({
    total: maps.annoSetID2PatternIDmap.size,
    clean: true,
  });
  let count = 0;
  let tickCount = 0;
  for (const entry of maps.annoSetID2PatternIDmap) {
    const annoSetId = entry[0];
    const patternId = entry[1];
    await AnnotationSet.collection.update({ _id: annoSetId },
                                          { $set: { pattern: patternId } });
    count += 1;
    if (count === 1000) {
      annoSetProgressBar.tick(1000);
      tickCount += 1000;
      count = 0;
    } if (count === maps.annoSetID2PatternIDmap.size) {
      annoSetProgressBar.tick(maps.annoSetID2PatternIDmap.size - tickCount);
    }
  }
}

async function importBatchSet(batchSet) {
  let counter = 1;
  const lexUnitProgressBar = new ProgressBar({
    total: batchSet.length,
    clean: true,
  });
  logger.info('Importing lexical units by batch...');
  const uniques = {
    annoSetID2PatternIDmap: new Map(),
    patternsMap: new Map(),
    valenceUnitsMap: new Map(),
  };
  for (const batch of batchSet) {
    logger.debug(`Importing lexUnit batch ${counter} out of ${batchSet.length}...`);
    const data = await convertToObjects(batch, uniques);
    try {
      await saveArraysToDb(data);
    } catch (err) {
      logger.error(err);
      logger.info('Exiting NoFrameNet');
      process.exit(1);
    }
    counter += 1;
    lexUnitProgressBar.tick();
  }
  try {
    await saveMapsToDb(uniques);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
}

async function importLexUnitsOnceConnectedToDb(lexUnitDir, chunkSize) {
  let batchSet;
  try {
    batchSet = await utils.filterAndChunk(lexUnitDir, chunkSize);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await importBatchSet(batchSet);
}

async function importLexUnits(lexUnitDir, chunkSize, dbUri) {
  await driver.connectToDatabase(dbUri);
  await importLexUnitsOnceConnectedToDb(lexUnitDir, chunkSize);
  await mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.dbUri;
  const lexUnitDir = config.frameNetDir.concat('lu');
  const lexUnitChunkSize = config.lexUnitChunkSize;
  importLexUnits(lexUnitDir, lexUnitChunkSize, dbUri).then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}

module.exports = {
  importLexUnitsOnceConnectedToDb,
};
