/**
 * Standalone script to import the content of the fulltext directory to MongoDB
 */

import {
  Set,
  Corpus,
  Document,
} from 'noframenet-core';
import {
  filterAndChunk,
} from './../utils/filesUtils';
import {
  toJsonixDocumentArray,
  toJsonixDocumentSentenceArray,
} from './../utils/jsonixUtils';
import {
  connectToDatabase,
} from './../db/mongo';
import {
  unmarshall,
} from './../marshalling/unmarshaller';
import config from './../config';

const logger = config.logger;
const startTime = process.hrtime();

/**
 * Theoretically (in header.xsd), maxOccurs="unbounded" for
 *  document so it is processed as an array here
 */
function convertToDocuments(jsonixFullText) {
  return toJsonixDocumentArray(jsonixFullText.value.header.corpus[0]).map((jsonixDocument) => {
    const document = new Document({
      _id: jsonixDocument.id,
      name: jsonixDocument.name,
      description: jsonixDocument.description,
    });
    document.sentences = toJsonixDocumentSentenceArray(jsonixFullText).map((jsonixSentence) => {
      return jsonixSentence.id;
    });
    return document.toObject();
  })
}

function processCorpus(jsonixFullText, documents, sets) {
  //logger.info(
  //  `Processing fullText with id = ${jsonixFullText.value.header.corpus[0].id} and name =
  // ${jsonixFullText.value.header.corpus[0].name}`);
  let corpus = new Corpus({
    _id: jsonixFullText.value.header.corpus[0].id,
  });
  if (sets.corpora.get(corpus) == undefined) {
    corpus.name = jsonixFullText.value.header.corpus[0].name;
    corpus.description = jsonixFullText.value.header.corpus[0].description;
    corpus.documents = [];
  } else {
    corpus = sets.corpora.get(corpus);
  }
  corpus.documents.push(jsonixFullText.value.header.corpus[0].document[0].id);
  documents.push(...convertToDocuments(jsonixFullText));
}

async function convertToObjects(batch, sets) {
  let data = {
    documents: [],
  };
  await Promise.all(batch.map(async(file) => {
    const jsonixFullText = await unmarshall(file);
    processCorpus(jsonixFullText, data.documents, sets);
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

async function saveSetsToDb(mongodb, sets) {
  await mongodb.collection('corpus').insertMany(sets.corpora.map((corpus) => {
    return corpus.toObject()
  }), {
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
  let sets = {
    corpora: new Set(),
  }
  for (let batch of batchSet) {
    logger.info(`Importing fullText batch ${counter} out of ${batchSet.length}...`);
    const data = await convertToObjects(batch, sets);
    try {
      await saveArraysToDb(db.mongo, data);
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
    counter += 1;
  }
  try {
    //await saveSetsToDb(db.mongo, sets);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

function logOutputStats() {
  logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`);
}

async function importFullTextOnceConnectedToDb(fullTextDir, chunkSize, db) {
  const batchSet = await filterAndChunk(fullTextDir, chunkSize);
  await importBatchSet(batchSet, db);
  logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`);
}

async function importFullText(fullTextDir, chunkSize, dbUri) {
  const db = await connectToDatabase(dbUri);
  await importFullTextOnceConnectedToDb(fullTextDir, chunkSize, db);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  importFullText(config.fullTextDir, config.fullTextChunkSize, config.dbUri);
}
