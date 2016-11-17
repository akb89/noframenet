/**
 * Standalone script to import FrameNet lexical units to MongoDB.
 */

// TODO: ADD info regarding lexemes/lemmas of lexUnit found in frame files
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
import {
  filterAndChunk,
} from './../utils/filesUtils';
import {
  connectToDatabase,
} from './../db/mongo';
import {
  unmarshall,
} from './../marshalling/unmarshaller';
import config from './../config';
import './../utils/utils'; // For .flatten()

const logger = config.logger;

function convertToValenceUnits(jsonixPattern, valenceUnits) {
  return toJsonixValenceUnitArray(jsonixPattern).map((jsonixValenceUnit) => {
    const key = jsonixValenceUnit.fe + jsonixValenceUnit.pt + jsonixValenceUnit.gf;
    let valenceUnit;
    if (!valenceUnits.has(key)) {
      valenceUnit = new ValenceUnit({
        FE: jsonixValenceUnit.fe,
        PT: jsonixValenceUnit.pt,
        GF: jsonixValenceUnit.gf,
      });
      valenceUnits.set(key, valenceUnit.toObject());
    } else {
      valenceUnit = valenceUnits.get(key);
    }
    return valenceUnit;
  });
}

function processPatterns(jsonixLexUnit, annotationSets, patterns, valenceUnits) {
  // Import patterns and valenceUnits.
  // Add all info regading patterns and lexUnits to AnnoSet objects
  toJsonixPatternArray(jsonixLexUnit).forEach((jsonixPattern) => {
    const vus = convertToValenceUnits(jsonixPattern, valenceUnits);
    const key = vus.map(vu => vu._id).sort().join(''); // TODO check this
    let pattern;
    if (!patterns.has(key)) {
      pattern = new Pattern({
        valenceUnits: vus,
      });
      patterns.set(key, pattern.toObject());
    } else {
      pattern = patterns.get(key);
    }
    toJsonixPatternAnnoSetArray(jsonixPattern).forEach((jsonixAnnoSet) => {
      if (annotationSets.has(jsonixAnnoSet.id)) {
        const annoSet = annotationSets.get(jsonixAnnoSet.id);
        annoSet.lexUnit = jsonixLexUnit.value.id;
        annoSet.pattern = pattern._id;
        //annotationSets.set(jsonixAnnoSet.id, annoSet);
      }
    });
  });
}

// TODO: filter valid layers?
function convertToLabels(jsonixAnnoSet) {
  return toJsonixLayerArray(jsonixAnnoSet).map((jsonixLayer) => {
    return toJsonixLabelArray(jsonixLayer).map((jsonixLabel) => {
      const label = new Label({
        name: jsonixLabel.name,
        type: jsonixLayer.name,
        startPos: jsonixLabel.start,
        endPos: jsonixLabel.end,
      });
      return label.toObject();
    });
  }).flatten();
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
    addToMap(annotationSets, convertToAnnoSets(jsonixSentence, jsonixLexUnit.value.id, labels));
    //annotationSets.push(...convertToAnnoSets(jsonixSentence, labels));
    return sentence.toObject();
  });
}

function addToMap(map, array) {
  array.forEach((item) => {
    if (!map.has(item._id)) {
      map.set(item._id, item);
    }
  });
}

// Lemma and Lexeme information is updated via importLemmasAndLemexes script
function convertToLexUnit(
  jsonixLexUnit,
  annotationSets,
  labels,
  patterns,
  sentences,
  valenceUnits) {
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
  addToMap(sentences, convertToSentences(jsonixLexUnit, annotationSets, labels));
  processPatterns(jsonixLexUnit, annotationSets, patterns, valenceUnits);
  return lexUnit.toObject();
}

async function convertToObjects(batch, uniques) {
  const data = {
    labels: [],
    lexUnits: [],
  };
  await Promise.all(batch.map(async(file) => {
    const jsonixLexUnit = await unmarshall(file);
    data.lexUnits.push(
      convertToLexUnit(
        jsonixLexUnit,
        uniques.annotationSets,
        data.labels,
        uniques.patterns,
        uniques.sentences,
        uniques.valenceUnits,
      ));
  }));
  return data;
}

async function saveArraysToDb(mongodb, data) {
  await mongodb.collection('labels').insertMany(data.labels, {
    w: 0,
    j: false,
    ordered: false,
  });
  await mongodb.collection('lexUnits').insertMany(data.lexUnits, {
    w: 0,
    j: false,
    ordered: false,
  });
}

async function saveMapsToDb(mongodb, maps) {
  // TODO Check: annotationSets Map may be too big
  await mongodb.collection('annotationsets')
    .insertMany(Array.from(maps.annotationSets), {
      w: 0,
      j: false,
      ordered: false,
    });
  await mongodb.collection('patterns')
    .insertMany(Array.from(maps.patterns), {
      w: 0,
      j: false,
      ordered: false,
    });
  // TODO Check: sentences Map may be too big
  await mongodb.collection('sentences')
    .insertMany(Array.from(maps.sentences), {
      w: 0,
      j: false,
      ordered: false,
    });
  await mongodb.collection('valenceunits')
    .insertMany(Array.from(maps.valenceUnits), {
      w: 0,
      j: false,
      ordered: false,
    });
}

async function importBatchSet(batchSet, db) {
  let counter = 1;
  const uniques = {
    annotationSets: new Map(),
    patterns: new Map(),
    sentences: new Map(), // Try with a Map first. If too big, use set of ids like before
    valenceUnits: new Map(),
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
  const batchSet = await filterAndChunk(lexUnitDir, chunkSize);
  await importBatchSet(batchSet, db);
}

async function importLexUnits(lexUnitDir, chunkSize, dbUri) {
  const db = await connectToDatabase(dbUri);
  await importLexUnitsOnceConnectedToDb(lexUnitDir, chunkSize, db);
  await db.mongo.close();
  await db.mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  importLexUnits(config.lexUnitDir, config.lexUnitChunkSize, config.dbUri).then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}
