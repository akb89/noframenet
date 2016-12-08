/**
 * Standalone script to import the content of the fulltext directory to MongoDB
 */

import { Corpus, Document } from 'noframenet-core';
import { toJsonixDocumentArray, toJsonixDocumentSentenceArray } from './../utils/jsonixUtils';
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
    }).toObject());
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
  convertToDocuments(jsonixFullText).forEach((document) => {
    corpus.documents.push(document._id);
    documents.push(document);
  });
}

async function convertToObjects(batch, uniques) {
  const data = {
    documents: [],
  };
  await Promise.all(batch.map(async (file) => {
    const jsonixFullText = await marshaller.unmarshall(file);
    processCorpus(jsonixFullText, data.documents, uniques.corpora);
  }));
  return data;
}

async function saveArraysToDb(mongodb, data) {
  await mongodb.collection('documents').insertMany(data.documents, {
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
  const uniques = {
    corpora: new Map(),
  };
  for (const batch of batchSet) {
    logger.info(`Importing fullText batch ${counter} out of ${batchSet.length}...`);
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
  importFullText(fullTextDir, fullTextChunkSize, dbUri).then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}

export default {
  importFullTextOnceConnectedToDb,
};
