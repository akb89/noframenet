'use strict';

import path from "path";
import jsonix from "jsonix";
import preProcessor from "./preProcessor";
import fullTextSchema from "./mapping/FullTextSchema.js";
import Corpus from "./model/corpusModel";
import Document from "./model/documentModel";
import jsonixUtils from "./utils/jsonixUtils";
import config from "./config";
import "./utils/utils";

const Jsonix = jsonix.Jsonix;
const FullTextSchema = fullTextSchema.FullTextSchema;
const context = new Jsonix.Context([FullTextSchema]);
const unmarshaller = context.createUnmarshaller();
const logger = config.logger;
const startTime = process.hrtime();

if (require.main === module) {
    importFullText(config.fullTextDir, config.dbUri, config.fullTextChunkSize);
}

async function importFullText(fullTextDir, dbUri, chunkSize) {
    var batchSet = await preProcessor.getFilteredArrayOfFiles(fullTextDir, chunkSize);
    var db = await preProcessor.connectToDatabase(dbUri);
    var counter = {
        batch: 1
    };
    for (let batch of batchSet) {
        var corpora = [];
        var documents = [];
        logger.info(`Importing fullText batch ${counter.batch} out of ${batchSet.length}...`);
        counter.batch++;
        await importAll(batch, fullTextDir, db, corpora, documents);
    }
    logOutputStats(corpora, documents, counter);
}

function logOutputStats(corpora, documents, counter) {
    logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`);

}

async function importAll(files, fullTextDir, db, corpora, documents) {
    await Promise.all(files.map(async(file) => {
        var unmarshalledFile = await initFile(file, fullTextDir, db, corpora, documents);
        await initFullText(unmarshalledFile, db);
    }));
}

function initFile(file, fullTextDir, db, corpora, documents) {
    return new Promise((resolve, reject) => {
        try {
            unmarshaller.unmarshalFile(path.join(fullTextDir, file), (unmarshalledFile) => {
                return resolve(unmarshalledFile);
            });
        } catch (err) {
            return reject(err);
        }
    });
}

async function initFullText(jsonixFullText, db) {
    logger.info(
        `Processing fullText with id = ${jsonixFullText.value.header.corpus[0].id} and name = ${jsonixFullText.value.header.corpus[0].name}`);
    var corpus = await db.collection('corpus').findOne({_id: jsonixFullText.value.header.corpus[0].id});
    if (corpus !== null) {
        corpus.documents.push(await getDocuments(jsonixFullText, db));
    } else {
        corpus = new Corpus({
            _id: jsonixFullText.value.header.corpus[0].id,
            name: jsonixFullText.value.header.corpus[0].name,
            description: jsonixFullText.value.header.corpus[0].description,
            documents: await getDocuments(jsonixFullText, db)
        });
    }
};

async function getDocuments(jsonixFullText, db) {
    var documents = [];
    for (let jsonixDocument of jsonixUtils.toJsonixDocumentArray(jsonixFullText.value.header.corpus[0])) {
        var document = new Document({
            _id: jsonixDocument.id,
            name: jsonixDocument.name,
            description: jsonixDocument.description,
        });
        document.sentences = await getSentences(jsonixFullText, db);
        documents.push(document);
    }
    return documents;
}

async function getSentences(jsonixFullText, db) {
    var sentences = [];
    for (let jsonixSentence of jsonixUtils.toJsonixDocumentSentenceArray(jsonixFullText)) {
        var sentence = await db.collection('sentences').findOne({_id: jsonixSentence.id});
        if (sentence !== null) {
            //logger.error(`Sentence found: ${jsonixSentence.id}`);
            for (let jsonixAnnoSet of jsonixUtils.toJsonixSentenceAnnoSetArray(jsonixSentence)) {
                var annoSet = await db.collection('annotationsets').findOne({_id: jsonixAnnoSet.id});
                if (annoSet === null) {
                    logger.error(`AnnotationSet not found: ${jsonixAnnoSet.id}`);
                } else {
                    //logger.error('AnnoSet is found');
                }
            }
        } else {
            //logger.error(`Sentence NOT found: ${jsonixSentence.id}`);

            /*
             sentence = new Sentence({
             _id: jsonixSentence.id,
             text: jsonixSentence.text,
             paragraphNumber: jsonixSentence.paragNo,
             sentenceNumber: jsonixSentence.sentNo,
             aPos: jsonixSentence.aPos
             });
             */
        }
        /*
        for (let jsonixAnnoSet of jsonixUtils.toJsonixSentenceAnnoSetArray(jsonixSentence)) {
            var annoSet = await db.collection('annotationsets').findOne({_id: jsonixAnnoSet.id});
            if (annoSet === null) {
                //logger.error(`AnnotationSet not found: ${jsonixAnnoSet.id}`);
            } else {
                //logger.error('AnnoSet is found');
            }
        }
        sentences.push(sentence);
        */
    }
    return sentences;
}