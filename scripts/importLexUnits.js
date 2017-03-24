/**
 * Standalone script to import FrameNet lexical units to MongoDB.
 */

import { AnnotationSet, Frame, FrameElement, Label, Pattern, Sentence, ValenceUnit } from 'noframenet-core';
import ProgressBar from 'ascii-progress';
import { toJsonixLabelArray, toJsonixLayerArray, toJsonixLexUnitSentenceArray, toJsonixPatternAnnoSetArray, toJsonixPatternArray, toJsonixSentenceAnnoSetArray, toJsonixValenceUnitArray } from './../utils/jsonixUtils';
import config from './../config';
import driver from './../db/mongo';
import marshaller from './../marshalling/unmarshaller';
import utils from './../utils/utils';

const logger = config.default.logger;

function convertToValenceUnits(jsonixPattern, valenceUnitsMap, frameElementsMap) {
  return toJsonixValenceUnitArray(jsonixPattern).map((jsonixValenceUnit) => {
    const fe = frameElementsMap.get(jsonixValenceUnit.fe);
    if (!fe) {
      logger.verbose(`FE is undefined: ${jsonixValenceUnit.fe}`);
    } else {
      const key = fe._id + jsonixValenceUnit.pt + jsonixValenceUnit.gf;
      let valenceUnit;
      if (!valenceUnitsMap.has(key)) {
        valenceUnit = new ValenceUnit({
          FE: fe,
          PT: jsonixValenceUnit.pt,
          GF: jsonixValenceUnit.gf,
        });
        valenceUnitsMap.set(key, valenceUnit.toObject({
          depopulate: true,
        }));
      } else {
        valenceUnit = valenceUnitsMap.get(key);
      }
      return valenceUnit;
    }
  });
}

function processPatterns(jsonixLexUnit, annoSet2PatternMap, patternsMap,
  valenceUnitsMap, frameElementsMap) {
  // Import patterns and valenceUnits.
  // Add all info regading patterns and lexUnits to AnnoSet objects
  toJsonixPatternArray(jsonixLexUnit).forEach((jsonixPattern) => {
    const vus = convertToValenceUnits(jsonixPattern, valenceUnitsMap, frameElementsMap);
    const key = vus.map(vu => vu._id).sort().join(''); // TODO test this
    let pattern;
    if (!patternsMap.has(key)) {
      pattern = new Pattern({
        valenceUnits: vus,
      });
      patternsMap.set(key, pattern.toObject({
        depopulate: true,
      }));
    } else {
      pattern = patternsMap.get(key);
    }
    toJsonixPatternAnnoSetArray(jsonixPattern).forEach((jsonixAnnoSet) => {
      annoSet2PatternMap.set(jsonixAnnoSet.id, pattern._id);
    });
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
function processLexUnit(jsonixLexUnit, annoSet2PatternMap,
  annotationSets, labels, patternsMap, sentences, valenceUnitsMap,
  frameElementsMap) {
  sentences.push(...convertToSentences(jsonixLexUnit,
    annotationSets, labels));
  processPatterns(jsonixLexUnit, annoSet2PatternMap, patternsMap,
    valenceUnitsMap, frameElementsMap);
}

// A Map of FEName -> full noframenet-core.FrameElement
async function getFEMap(frameID) {
  const feMap = new Map();
  const frame = await Frame.findOne().where('_id').equals(frameID);
  if (!frame) {
    logger.error(`frame is null for _id = ${frameID}`);
  }
  const fes = await FrameElement.find().where('_id').in(frame.frameElements);
  fes.forEach((fe) => {
    feMap.set(fe.name, fe);
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
    const frameElementsMap = await getFEMap(jsonixLexUnit.value.frameID);
    try {
      processLexUnit(
        jsonixLexUnit,
        uniques.annoSet2PatternMap,
        data.annotationSets,
        data.labels,
        uniques.patternsMap,
        data.sentences,
        uniques.valenceUnitsMap,
        frameElementsMap,
      );
    } catch (err) {
      logger.verbose(`Ill-formed lexUnit detected: ID = ${jsonixLexUnit.value.id}`);
      logger.debug(err);
    }
  }));
  return data;
}

async function saveArraysToDb(mongodb, data) {
  await mongodb.collection('annotationsets').insertMany(data.annotationSets, {
    w: 0,
    j: false,
    ordered: false,
  });
  await mongodb.collection('labels').insertMany(data.labels, {
    w: 0,
    j: false,
    ordered: false,
  });
  await mongodb.collection('sentences').insertMany(data.sentences, {
    w: 0,
    j: false,
    ordered: false,
  });
}

async function saveMapsToDb(mongodb, maps) {
  await mongodb.collection('patterns')
    .insertMany(Array.from(maps.patternsMap), {
      w: 0,
      j: false,
      ordered: false,
    });
  await mongodb.collection('valenceunits')
    .insertMany(Array.from(maps.valenceUnitsMap), {
      w: 0,
      j: false,
      ordered: false,
    });
  logger.info('Updating annotatioSets\' pattern references...');
  const annoSetProgressBar = new ProgressBar({
    total: maps.annoSet2PatternMap.size,
    clean: true,
  });
  for (const entry of maps.annoSet2PatternMap) {
    const annoSetId = entry[0];
    const patternId = entry[1];
    await mongodb.collection('annotationsets') // eslint-disable-line no-await-in-loop
      .update({
        _id: annoSetId,
      }, {
        $set: {
          pattern: patternId,
        },
      });
    annoSetProgressBar.tick(1000);
  }
}

async function importBatchSet(batchSet, db) {
  let counter = 1;
  const lexUnitProgressBar = new ProgressBar({
    total: batchSet.length,
    clean: true,
  });
  logger.info('Importing lexical units by batch...');
  const uniques = {
    annoSet2PatternMap: new Map(),
    patternsMap: new Map(),
    valenceUnitsMap: new Map(),
  };
  for (const batch of batchSet) {
    logger.debug(`Importing lexUnit batch ${counter} out of ${batchSet.length}...`);
    const data = await convertToObjects(batch, uniques); // eslint-disable-line no-await-in-loop
    try {
      await saveArraysToDb(db.mongo, data); // eslint-disable-line no-await-in-loop
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
    counter += 1;
    lexUnitProgressBar.tick();
  }
  try {
    await saveMapsToDb(db.mongo, uniques);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

async function importLexUnitsOnceConnectedToDb(lexUnitDir, chunkSize, db) {
  const batchSet = await utils.filterAndChunk(lexUnitDir, chunkSize);
  await importBatchSet(batchSet, db);
}

async function importLexUnits(lexUnitDir, chunkSize, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  await importLexUnitsOnceConnectedToDb(lexUnitDir, chunkSize, db);
  await db.mongo.close();
  await db.mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.default.dbUri;
  const lexUnitDir = config.default.frameNetDir.concat('lu');
  const lexUnitChunkSize = config.default.lexUnitChunkSize;
  importLexUnits(lexUnitDir, lexUnitChunkSize, dbUri).then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}

export default {
  importLexUnitsOnceConnectedToDb,
};
