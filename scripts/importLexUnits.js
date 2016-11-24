/**
 * Standalone script to import FrameNet lexical units to MongoDB.
 */

import {
  AnnotationSet,
  Label,
  LexUnit,
  Pattern,
  Sentence,
  ValenceUnit,
} from 'noframenet-core';
import {
  toJsonixLabelArray,
  toJsonixLayerArray,
  toJsonixLexUnitSentenceArray,
  toJsonixPatternAnnoSetArray,
  toJsonixPatternArray,
  toJsonixSemTypeArray,
  toJsonixSentenceAnnoSetArray,
  toJsonixValenceUnitArray,
} from './../utils/jsonixUtils';
import config from './../config';
import driver from './../db/mongo';
import marshaller from './../marshalling/unmarshaller';
import utils from './../utils/utils';

const logger = config.logger;

function convertToValenceUnits(jsonixPattern, valenceUnitsMap) {
  return toJsonixValenceUnitArray(jsonixPattern).map((jsonixValenceUnit) => {
    const key = jsonixValenceUnit.fe + jsonixValenceUnit.pt + jsonixValenceUnit.gf;
    let valenceUnit;
    if (!valenceUnitsMap.has(key)) {
      valenceUnit = new ValenceUnit({
        FE: jsonixValenceUnit.fe,
        PT: jsonixValenceUnit.pt,
        GF: jsonixValenceUnit.gf,
      });
      valenceUnitsMap.set(key, valenceUnit.toObject());
    } else {
      valenceUnit = valenceUnitsMap.get(key);
    }
    return valenceUnit;
  });
}

function processPatterns(jsonixLexUnit, annoSet2PatternMap, patternsMap, valenceUnitsMap) {
  // Import patterns and valenceUnits.
  // Add all info regading patterns and lexUnits to AnnoSet objects
  toJsonixPatternArray(jsonixLexUnit).forEach((jsonixPattern) => {
    const vus = convertToValenceUnits(jsonixPattern, valenceUnitsMap);
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

// TODO: filter valid layers?
function convertToLabels(jsonixAnnoSet) {
  return toJsonixLayerArray(jsonixAnnoSet)
    .map(jsonixLayer =>
      toJsonixLabelArray(jsonixLayer)
      .map((jsonixLabel) => {
        const label = new Label({
          name: jsonixLabel.name,
          type: jsonixLayer.name,
          startPos: jsonixLabel.start,
          endPos: jsonixLabel.end,
        });
        return label.toObject();
      }))
    .reduce((a, b) => a.concat(b));
}

function convertToAnnoSets(jsonixSentence, lexUnitId, labels) {
  return toJsonixSentenceAnnoSetArray(jsonixSentence).map((jsonixAnnoSet) => {
    const annoSet = new AnnotationSet({
      _id: jsonixAnnoSet.id,
      lexUnit: lexUnitId,
      sentence: jsonixSentence.id,
    });
    const annoLabels = convertToLabels(jsonixAnnoSet);
    annoSet.labels = annoLabels.map(label => label._id);
    labels.push(...annoLabels);
    return annoSet.toObject();
  });
}

function convertToSentences(jsonixLexUnit, annotationSets, labels) {
  return toJsonixLexUnitSentenceArray(jsonixLexUnit).map((jsonixSentence) => {
    const sentence = new Sentence({
      _id: jsonixSentence.id,
      text: jsonixSentence.text,
      paragraphNumber: jsonixSentence.paragNo,
      sentenceNumber: jsonixSentence.sentNo,
      aPos: jsonixSentence.aPos,
    });
    annotationSets.push(...convertToAnnoSets(jsonixSentence, jsonixLexUnit.value.id, labels));
    return sentence.toObject();
  });
}

// Lemma and Lexeme information is updated via importLemmasAndLemexes script
function convertToLexUnit(
  jsonixLexUnit,
  annoSet2PatternMap,
  annotationSets,
  labels,
  patternsMap,
  sentences,
  valenceUnitsMap) {
  const lexUnit = new LexUnit({
    _id: jsonixLexUnit.value.id,
    name: jsonixLexUnit.value.name,
    pos: jsonixLexUnit.value.pos,
    definition: jsonixLexUnit.value.definition,
    frame: jsonixLexUnit.value.frameID,
    status: jsonixLexUnit.value.status,
    totalAnnotated: jsonixLexUnit.value.totalAnnotated,
  });
  // SemTypes are imported via a separate script
  lexUnit.semTypes = toJsonixSemTypeArray(jsonixLexUnit).map(jsonixSemType => jsonixSemType.id);
  sentences.push(...convertToSentences(jsonixLexUnit, annotationSets, labels));
  processPatterns(jsonixLexUnit, annoSet2PatternMap, patternsMap, valenceUnitsMap);
  return lexUnit.toObject();
}

async function convertToObjects(batch, uniques) {
  const data = {
    annotationSets: [],
    labels: [],
    lexUnits: [],
    sentences: [],
  };
  await Promise.all(batch.map(async(file) => {
    const jsonixLexUnit = await marshaller.unmarshall(file);
    data.lexUnits.push(
      convertToLexUnit(
        jsonixLexUnit,
        uniques.annoSet2PatternMap,
        data.annotationSets,
        data.labels,
        uniques.patternsMap,
        data.sentences,
        uniques.valenceUnitsMap,
      ));
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
  await mongodb.collection('lexunits').insertMany(data.lexUnits, {
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
  // update pattern references in annotationSets
  /*
  await mongodb.collection('annotationsets').updateMany({
    _id: {
      $in: maps.annoSet2PatternMap.keys,
    },
  }, {
    $set: {
      pattern: maps.annoSet2PatternMap.get(_id),
    }
  }, {
    upsert: false,
  })
  */
  maps.annoSet2PatternMap.forEach(async(patternId, annoSetId) => {
    await mongodb.collection('annotationsets').update({
      _id: annoSetId,
    }, {
      $set: {
        pattern: patternId,
      },
    });
  });
}

async function importBatchSet(batchSet, db) {
  let counter = 1;
  const uniques = {
    annoSet2PatternMap: new Map(),
    patternsMap: new Map(),
    valenceUnitsMap: new Map(),
  };
  for (const batch of batchSet) {
    logger.info(`Importing lexUnit batch ${counter} out of ${batchSet.length}...`);
    const data = await convertToObjects(batch, uniques);
    try {
      await saveArraysToDb(db.mongo, data);
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
    counter += 1;
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
  importLexUnits(config.lexUnitDir, config.lexUnitChunkSize, config.dbUri).then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}
