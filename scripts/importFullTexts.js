/**
 * Standalone script to import the content of the fulltext directory to MongoDB
 */

import { AnnotationSet, Corpus, Document, Label, Pattern, Sentence, ValenceUnit } from 'noframenet-core';
import ProgressBar from 'ascii-progress';
import { toJsonixDocumentArray, toJsonixDocumentSentenceArray, toJsonixLabelArray, toJsonixLayerArray, toJsonixSentenceAnnoSetArray } from './../utils/jsonixUtils';
import config from './../config';
import driver from './../db/mongo';
import marshaller from './../marshalling/unmarshaller';
import utils from './../utils/utils';

const logger = config.default.logger;

/**
 * Theoretically (in header.xsd), maxOccurs="unbounded" for
 * document so it is processed as an array here
 */
function convertToDocuments(jsonixFullText) {
  return toJsonixDocumentArray(jsonixFullText.value.header.corpus[0])
    .map(jsonixDocument => new Document({
      _id: jsonixDocument.id,
      name: jsonixDocument.name,
      description: jsonixDocument.description,
      sentences: toJsonixDocumentSentenceArray(jsonixFullText)
        .map(jsonixSentence => jsonixSentence.id),
    })
      .toObject());
}

function processCorpus(jsonixFullText, documents, corpora) {
  const corpusId = jsonixFullText.value.header.corpus[0].id;
  let corpus;
  if (corpora.has(corpusId)) {
    corpus = corpora.get(corpusId);
  } else {
    corpus = new Corpus({
      _id: corpusId,
      name: jsonixFullText.value.header.corpus[0].name,
      description: jsonixFullText.value.header.corpus[0].description,
      documents: [],
    });
    corpora.set(corpusId, corpus.toObject());
  }
  convertToDocuments(jsonixFullText)
    .forEach((document) => {
      corpus.documents.push(document._id);
      documents.push(document);
    });
}

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

function addGFLabels(annoSetLabelMap) {
  if (!annoSetLabelMap.annoSet || annoSetLabelMap.labelMap.size === 0) {
    return annoSetLabelMap;
  }
  for (const jsonixLayer of toJsonixLayerArray(annoSetLabelMap.annoSet)) {
    if (jsonixLayer.name === 'GF') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start && jsonixLabel.end) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (!annoSetLabelMap.labelMap.has(key)) {
            // This is probably an annotation error
            logger.error(`annotation error: GF with no FE and/or PT on #${annoSetLabelMap.annoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return {
              annoSet: annoSetLabelMap.jsonixAnnoSet,
              labelMap: new Map(),
            };
          }
          annoSetLabelMap.labelMap.get(key).GF = jsonixLabel.name;
        }
      }
    }
  }
  return annoSetLabelMap;
}

function addPTLabels(annoSetLabelMap) {
  if (!annoSetLabelMap.annoSet || annoSetLabelMap.labelMap.size === 0) {
    return annoSetLabelMap;
  }
  for (const jsonixLayer of toJsonixLayerArray(annoSetLabelMap.annoSet)) {
    if (jsonixLayer.name === 'PT') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start && jsonixLabel.end) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (!annoSetLabelMap.labelMap.has(key)) {
            // This is probably an annotation error
            logger.error(`key = ${JSON.stringify(key)}`);
            logger.error(`labelMap = ${JSON.stringify(annoSetLabelMap.labelMap)}`);
            logger.error(`annotation error: PT with no FE on #${annoSetLabelMap.annoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return {
              annoSet: annoSetLabelMap.jsonixAnnoSet,
              labelMap: new Map(),
            };
          }
          annoSetLabelMap.labelMap.get(key).PT = jsonixLabel.name;
        }
      }
    }
  }
  return annoSetLabelMap;
}

function addFELabels(annoSetLabelMap) {
  if (!annoSetLabelMap.annoSet) {
    return annoSetLabelMap;
  }
  for (const jsonixLayer of toJsonixLayerArray(annoSetLabelMap.annoSet)) {
    if (jsonixLayer.name === 'FE') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start && jsonixLabel.end) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (annoSetLabelMap.labelMap.has(key)) {
            // Do not process cases where multiple FE labels have
            // same start/end values
            logger.error(`annotation error: multiple FE labels with same start/end values on #${annoSetLabelMap.annoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return {
              annoSet: annoSetLabelMap.jsonixAnnoSet,
              labelMap: new Map(),
            };
          }
          const value = {
            FE: jsonixLabel.feID,
          };
          if (jsonixLabel.itype) {
            value.PT = jsonixLabel.itype;
          }
          annoSetLabelMap.labelMap.set(key, value);
        }
      }
    }
  }
  return annoSetLabelMap;
}

function getLabelMap(jsonixAnnoSet) {
  return addGFLabels(addPTLabels(addFELabels({
    annoSet: jsonixAnnoSet,
    labelMap: new Map(),
  }))).labelMap;
}

async function saveAnnoSets(jsonixSentence) {
  for (const jsonixAnnoSet of toJsonixSentenceAnnoSetArray(jsonixSentence)) {
    const dbAnnoSet = await AnnotationSet.findOne().where('_id').equals(jsonixAnnoSet.id);
    if (!dbAnnoSet) {
      logger.debug(`Could not find annotationSet #${jsonixAnnoSet.id} in database`);
      const nLabels = toJsonixLayerArray(jsonixAnnoSet)
        .map(jsonixLayer => toJsonixLabelArray(jsonixLayer)
          .map(jsonixLabel => new Label({
            name: jsonixLabel.name,
            type: jsonixLayer.name,
            rank: jsonixLayer.rank,
            startPos: jsonixLabel.start,
            endPos: jsonixLabel.end,
          })))
        .reduce((a, b) => a.concat(b));
      logger.debug(`nLabels = ${nLabels}`);
      await Label.insertMany(nLabels);
      const annoSet = new AnnotationSet({
        _id: jsonixAnnoSet.id,
        lexUnit: jsonixAnnoSet.luID,
        sentence: jsonixSentence.id,
        labels: nLabels,
      });
      logger.debug(`new annoSet = ${annoSet}`);
      if (isValidFNAnnoSet(jsonixAnnoSet)) {
        logger.debug(`isValidFNAnnoSet = ${jsonixAnnoSet.id}`);
        // Look for pattern and add to annoSet
        const labelMap = getLabelMap(jsonixAnnoSet);
        const vus = [];
        labelMap.forEach(async (value) => {
          const vu = await ValenceUnit.findOne(value);
          if (vu) {
            logger.debug(`vu exists = ${vu._id}`);
            vus.add(vu._id);
          } else {
            logger.debug(`vu not found = ${value}`);
            const newVu = new ValenceUnit(value);
            await newVu.save();
            vus.add(newVu._id);
          }
        });
        const pattern = await Pattern.findOne().where('valenceUnits').in(vus);
        if (pattern) {
          logger.debug(`pattern found = ${pattern._id} with vus = ${vus}`);
          annoSet.pattern = pattern._id;
        } else {
          logger.debug(`new pattern with vus = ${vus}`);
          const newPattern = new Pattern({
            valenceUnits: vus,
          });
          await newPattern.save();
          annoSet.pattern = newPattern._id;
        }
      }
      await annoSet.save();
    }
  }
}

async function saveSentences(jsonixSentences) {
  logger.debug('Saving sentences');
  for (const jsonixSentence of jsonixSentences) {
    const dbSentence = await Sentence.findOne().where('_id').equals(jsonixSentence.id);
    if (!dbSentence) {
      logger.debug(`Could not find sentence #${jsonixSentence.id} in database`);
      const sentence = new Sentence({
        _id: jsonixSentence.id,
        text: jsonixSentence.text,
        paragraphNumber: jsonixSentence.paragNo,
        sentenceNumber: jsonixSentence.sentNo,
        aPos: jsonixSentence.aPos,
      });
      await sentence.save();
    } else {
      logger.debug(`Sentence #${jsonixSentence.id} already in database`);
    }
    await saveAnnoSets(jsonixSentence);
  }
}

async function convertToObjects(batch, uniques) {
  const data = {
    documents: [],
  };
  await Promise.all(batch.map(async (file) => {
    const jsonixFullText = await marshaller.unmarshall(file);
    processCorpus(jsonixFullText, data.documents, uniques.corpora);
    await saveSentences(toJsonixDocumentSentenceArray(jsonixFullText));
  }));
  return data;
}

async function saveArraysToDb(mongodb, data) {
  await mongodb.collection('documents')
    .insertMany(data.documents, {
      w: 0,
      j: false,
      ordered: false,
    });
}

async function saveMapsToDb(mongodb, maps) {
  await mongodb.collection('corpus')
    .insertMany(Array.from(maps.corpora), {
      w: 0,
      j: false,
      ordered: false,
    });
}

/**
 * Sentences, AnnotationSets and Labels will be imported with the
 * importLexUnits script.
 */
async function importBatchSet(batchSet, db) {
  let counter = 1;
  const fulltextProgressBar = new ProgressBar({
    total: batchSet.length,
    clean: true,
  });
  logger.info('Importing fulltexts by batch...');
  const uniques = {
    corpora: new Map(),
  };
  for (const batch of batchSet) {
    logger.debug(`Importing fullText batch ${counter} out of ${batchSet.length}...`);
    try {
      const data = await convertToObjects(batch, uniques); // eslint-disable-line no-await-in-loop
      await saveArraysToDb(db.mongo, data); // eslint-disable-line no-await-in-loop
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
    counter += 1;
    fulltextProgressBar.tick();
  }
  try {
    await saveMapsToDb(db.mongo, uniques);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

async function importFullTextOnceConnectedToDb(fullTextDir, chunkSize, db) {
  const batchSet = await utils.filterAndChunk(fullTextDir, chunkSize);
  await importBatchSet(batchSet, db);
}

async function importFullText(fullTextDir, chunkSize, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  await importFullTextOnceConnectedToDb(fullTextDir, chunkSize, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.default.dbUri;
  const fullTextDir = config.default.frameNetDir.concat('fulltext');
  const fullTextChunkSize = config.default.fullTextChunkSize;
  importFullText(fullTextDir, fullTextChunkSize, dbUri)
    .then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}

export default {
  importFullTextOnceConnectedToDb,
};
