/**
 * Standalone script to import FrameNet lexical units data to MongoDB.
 */
'use strict';

import async from "async";
import path from "path";
import jsonix from "jsonix";
import preProcessor from "./preProcessor";
import lexUnitSchema from "./mapping/LexUnitSchema";
import AnnotationSet from "./model/annotationSetModel";
import Label from "./model/labelModel";
import LexUnit from "./model/lexUnitModel";
import Pattern from "./model/patternModel";
import Sentence from "./model/sentenceModel";
import ValenceUnit from "./model/valenceUnitModel";
import jsonixUtils from "./utils/jsonixUtils";
import Promise from "bluebird";
import {AnnotationSetSet, PatternSet, SentenceSet, ValenceUnitSet} from "./utils/fnUtils";
import "./utils/utils";
import config from "./config";

const Jsonix = jsonix.Jsonix;
const LexUnitSchema = lexUnitSchema.LexUnitSchema;
const context = new Jsonix.Context([LexUnitSchema]);
const unmarshaller = context.createUnmarshaller();
const logger = config.logger;
const startTime = process.hrtime();

if (require.main === module) {
    importLexUnits(config.lexUnitDir, config.dbUri, config.lexUnitChunkSize, config.validLayers);
}

// TODO add error and exit on invalid directory
// FIXME: breaks on bulk size of 1 or 2
async function importLexUnits(lexUnitDir, dbUri, chunkSize, validLayers) {
    var batchSet = await preProcessor.getFilteredArrayOfFiles(lexUnitDir, chunkSize);
    var db = await preProcessor.connectToDatabase(dbUri);
    var annoSetSet = new AnnotationSetSet();
    var patterns = new PatternSet();
    //var sentenceSet = new SentenceSet();
    var sentenceIdSet = new Set();
    var valenceUnitSet = new ValenceUnitSet();
    var counter = {
        batch: 1,
        annoSet: 0,
        label: 0,
        pattern: 0,
        sentence: 0
    };
    for (let batch of batchSet) {
        var annotationSets = []; // TODO: move to unique
        var labels = [];
       //var patterns = []; // TODO: move to unique patterns
        var sentences = []; // TODO: move to unique sentences
        logger.info(`Importing lexUnit batch ${counter.batch} out of ${batchSet.length}...`);
        counter.batch++;

        //await db.createCollection('sentences');

        await importAll(
            batch,
            db,
            lexUnitDir,
            sentenceIdSet,
            annotationSets,
            labels,
            patterns,
            sentences,
            valenceUnitSet,
            validLayers,
            counter
        );
    }
    await saveSetToDb(db, patterns, valenceUnitSet);
    logOutputStats(sentences, valenceUnitSet, counter);
}

async function saveSetToDb(db, patterns, valenceUnitSet) {
    await db.collection('patterns').insertMany(patterns.map((pattern) => {
        return pattern.toObject();
    }), {w: 0, j: false, ordered: false});
    await db.collection('valenceunits').insertMany(valenceUnitSet.map((valenceUnit) => {
        return valenceUnit.toObject();
    }), {writeConcern: 0, j: false, ordered: false});
}

function logOutputStats(sentenceSet, valenceUnitSet, counter) {
    logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`);
    logger.info('Total inserted to MongoDB: ');
    logger.info(`AnnotationSets = ${counter.annoSet}`);
    logger.info(`Labels = ${counter.label}`);
    logger.info(`Patterns = ${counter.pattern}`);
    logger.info(`Sentences = ${counter.sentence}`);
    //logger.info(`Sentences = ${sentenceSet.length}`);
    logger.info(`ValenceUnits = ${valenceUnitSet.length}`);
}

async function importAll(files, db, lexUnitDir, sentenceIdSet, annotationSets, labels, patterns, sentences, valenceUnitSet,
                         validLayers, counter) {

    await Promise.all(files.map(async(file) => {
            var unmarshalledFile = await initFile(file, lexUnitDir, annotationSets, labels, patterns, sentences,
                valenceUnitSet);
            await initLexUnit(unmarshalledFile, sentenceIdSet, annotationSets, labels, patterns, sentences, valenceUnitSet,
                validLayers);
        }
    ));

    counter.annoSet += annotationSets.length;
    counter.label += labels.length;
    counter.pattern += patterns.length;
    counter.sentence += sentences.length;

    await saveArraysToDb(db, annotationSets, labels, patterns, sentences);
}

async function saveArraysToDb(db, annotationSets, labels, patterns, sentences) {
    await db.collection('annotationsets').insertMany(annotationSets, {w: 0, j: false, ordered: false});
    await db.collection('labels').insertMany(labels, {w: 0, j: false, ordered: false});
    //await db.collection('patterns').insertMany(patterns, {w: 0, j: false, ordered: false});
    await db.collection('sentences').insertMany(sentences, {w: 0, j: false, ordered: false});
}

function initFile(file, lexUnitDir) {
    return new Promise((resolve, reject) => {
        try {
            unmarshaller.unmarshalFile(path.join(lexUnitDir, file), (unmarshalledFile) => {
                return resolve(unmarshalledFile);
            });
        } catch (err) {
            return reject(err);
        }
    });
}

async function initLexUnit(jsonixLexUnit, sentenceIdSet, annotationSets, labels, patterns, sentences, valenceUnitSet,
                           validLayers) {
    logger.debug(
        `Processing lexUnit with id = ${jsonixLexUnit.value.id} and name = ${jsonixLexUnit.value.name}`);
    //var lexUnit = await db.collection('lexunits').findOne({_id: jsonixLexUnit.value.id});
    var lexUnitId = jsonixLexUnit.value.id;
    await initSentences(
        jsonixUtils.toJsonixLexUnitSentenceArray(jsonixLexUnit),
        sentenceIdSet,
        lexUnitId,
        getPatternsMap(jsonixLexUnit, patterns, valenceUnitSet),
        annotationSets,
        labels,
        sentences,
        validLayers
    );
}

function getPatternsMap(jsonixLexUnit, patterns, valenceUnitSet) {
    var map = new Map();
    jsonixUtils.toJsonixPatternArray(jsonixLexUnit).forEach((jsonixPattern) => {
        var valenceUnits = jsonixUtils.toJsonixValenceUnitArray(jsonixPattern).map((jsonixValenceUnit) => {
            var _valenceUnit = new ValenceUnit({
                FE: jsonixValenceUnit.fe,
                PT: jsonixValenceUnit.pt,
                GF: jsonixValenceUnit.gf
            });
            var valenceUnit = valenceUnitSet.get(_valenceUnit);
            if (valenceUnit !== undefined) {
                return valenceUnit;
            } else {
                valenceUnitSet.add(_valenceUnit);
                return _valenceUnit;
            }
        });
        var _pattern = new Pattern({
            valenceUnits: valenceUnits
        });
        //console.log(_pattern);
        //console.log(_pattern.toObject({depopulate: true}));
        var pattern = patterns.get(_pattern.toObject({depopulate: true}));
        if(pattern == undefined){
            pattern = _pattern;
            patterns.add(pattern);
        }
        console.log(patterns);
        //patterns.push(pattern.toObject({depopulate: true}));
        jsonixUtils.toJsonixPatternAnnoSetArray(jsonixPattern).forEach((jsonixAnnoSet) => {
            map.set(jsonixAnnoSet.id, pattern);
        });
    });
    return map;
}

async function initSentences(jsonixSentences, sentenceIdSet, lexUnitId, annoSetPatternsMap, annotationSets, labels, sentences,
                       validLayers) {
    await Promise.all(jsonixSentences.map((jsonixSentence) => {
        initSentence(
            jsonixSentence,
            sentenceIdSet,
            lexUnitId,
            annoSetPatternsMap,
            annotationSets,
            labels,
            sentences,
            validLayers
        );
    }));
}

 async function initSentence(jsonixSentence, sentenceIdSet, lexUnitId, annoSetPatternsMap, annotationSets, labels, sentences, validLayers) {
    var sentenceId = jsonixSentence.id;
    if(!sentenceIdSet.has(sentenceId)){
        sentenceIdSet.add(sentenceId);
        sentences.push(new Sentence({
            _id: jsonixSentence.id,
            text: jsonixSentence.text,
            paragraphNumber: jsonixSentence.paragNo,
            sentenceNumber: jsonixSentence.sentNo,
            aPos: jsonixSentence.aPos
        }).toObject());
    }
    await initAnnoSets(
        jsonixUtils.toJsonixSentenceAnnoSetArray(jsonixSentence),
        lexUnitId,
        sentenceId,
        annoSetPatternsMap,
        annotationSets,
        labels,
        validLayers
    );
}

async function initAnnoSets(jsonixAnnoSets, lexUnitId, sentenceId, annoSetPatternsMap, annotationSets, labels, validLayers) {
    await Promise.all((jsonixAnnoSets.map((jsonixAnnoSet) => {
        if (isValidLayer(jsonixUtils.toJsonixLayerArray(jsonixAnnoSet), validLayers)) {
            var labelIds = getLabels(jsonixAnnoSet, labels).map(x => x._id);
            var pattern = annoSetPatternsMap.get(jsonixAnnoSet.id);
            var patternId = pattern !== undefined ? pattern._id : undefined;
            initAnnoSet(
                jsonixAnnoSet,
                annotationSets,
                lexUnitId,
                sentenceId,
                labelIds,
                patternId
            );
        }
    })));
}

function isValidLayer(jsonixLayers, validLayers) {
    for (let jsonixLayer of jsonixLayers) {
        if (validLayers.includes(jsonixLayer.name)) {
            return true;
        }
    }
    return false;
}

function initAnnoSet(jsonixAnnoSet, annotationSets, lexUnitId, sentenceId, labelIds, patternId) {
    var annoSet = new AnnotationSet({
        _id: jsonixAnnoSet.id,
        sentence: sentenceId,
        lexUnit: lexUnitId,
        labels: labelIds,
        pattern: patternId
    });
    annotationSets.push(annoSet.toObject()); // there should not be duplicates
}

function getLabels(jsonixAnnoSet, labels) {
    // AnnoSet is already filtered: it's already FrameNet-specific (i.e. only FE/PT/GF/Target)
    return jsonixUtils.toJsonixLayerArray(jsonixAnnoSet).map((jsonixLayer) => {
        return jsonixUtils.toJsonixLabelArray(jsonixLayer).map((jsonixLabel) => {
            var label = new Label({
                name: jsonixLabel.name,
                type: jsonixLayer.name,
                startPos: jsonixLabel.start,
                endPos: jsonixLabel.end
            });
            labels.push(label.toObject()); // There will be duplicates but we don't care
            return label;
        });
    }).flatten();
}
