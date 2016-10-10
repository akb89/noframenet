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
    importLexUnits(config.lexUnitDir, config.dbUri, config.lexUnitChunkSize, config.frameNetLayers);
}

// TODO add error and exit on invalid directory
// FIXME: breaks on bulk size of 1 or 2
async function importLexUnits(lexUnitDir, dbUri, chunkSize, frameNetLayers) {
    var batchSet = await preProcessor.getFilteredArrayOfFiles(lexUnitDir, chunkSize);
    var db = await preProcessor.connectToDatabase(dbUri);
    var annoSetSet = new AnnotationSetSet();
    var patternSet = new PatternSet();
    var sentenceSet = new SentenceSet();
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
        var patterns = []; // TODO: move to unique patterns
        //var sentences = []; // TODO: move to unique sentences
        logger.info(`Importing lexUnit batch ${counter.batch} out of ${batchSet.length}...`);
        counter.batch++;
        await importAll(
            batch,
            db,
            lexUnitDir,
            annotationSets,
            labels,
            patterns,
            sentenceSet,
            valenceUnitSet,
            frameNetLayers,
            counter
        );
    }
    await saveSetToDb(db, sentenceSet, valenceUnitSet);
    logOutputStats(sentenceSet, valenceUnitSet, counter);
}

async function saveSetToDb(db, sentenceSet, valenceUnitSet) {
    await db.collection('sentences').insertMany(sentenceSet.map((sentence) => {
        return sentence.toObject();
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
    //logger.info(`Sentences = ${counter.sentence}`);
    logger.info(`Sentences = ${sentenceSet.length}`);
    logger.info(`ValenceUnits = ${valenceUnitSet.length}`);
}

async function importAll(files, db, lexUnitDir, annotationSets, labels, patterns, sentenceSet, valenceUnitSet,
                         frameNetLayers, counter) {

    await Promise.all(files.map(async(file) => {
            var unmarshalledFile = await initFile(file, lexUnitDir, annotationSets, labels, patterns, sentenceSet,
                valenceUnitSet);
            await initLexUnit(unmarshalledFile, db, annotationSets, labels, patterns, sentenceSet, valenceUnitSet,
                frameNetLayers);
        }
    ));

    counter.annoSet += annotationSets.length;
    counter.label += labels.length;
    counter.pattern += patterns.length;
    //counter.sentence += sentences.length;

    await saveArraysToDb(db, annotationSets, labels, patterns);
}

async function saveArraysToDb(db, annotationSets, labels, patterns) {
    await db.collection('annotationsets').insertMany(annotationSets, {w: 0, j: false, ordered: false});
    await db.collection('labels').insertMany(labels, {w: 0, j: false, ordered: false});
    await db.collection('patterns').insertMany(patterns, {w: 0, j: false, ordered: false});
    //await db.collection('sentences').insertMany(sentences, {w: 0, j: false, ordered: false});
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

async function initLexUnit(jsonixLexUnit, db, annotationSets, labels, patterns, sentenceSet, valenceUnitSet,
                           frameNetLayers) {
    logger.debug(
        `Processing lexUnit with id = ${jsonixLexUnit.value.id} and name = ${jsonixLexUnit.value.name}`);
    var lexUnit = await db.collection('lexunits').findOne({_id: jsonixLexUnit.value.id});
    initSentences(
        jsonixUtils.toJsonixLexUnitSentenceArray(jsonixLexUnit),
        lexUnit,
        getPatternsMap(jsonixLexUnit, patterns, valenceUnitSet),
        annotationSets,
        labels,
        sentenceSet,
        frameNetLayers
    );
}

function getPatternsMap(jsonixLexUnit, patterns, valenceUnitSet) {
    var map = new Map();
    jsonixUtils.toJsonixPatternArray(jsonixLexUnit).forEach((jsonixPattern) => {
        var patternVUs = jsonixUtils.toJsonixValenceUnitArray(jsonixPattern).map((jsonixValenceUnit) => {
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
        var pattern = new Pattern({
            valenceUnits: patternVUs
        });
        patterns.push(pattern.toObject({depopulate: true}));
        jsonixUtils.toJsonixPatternAnnoSetArray(jsonixPattern).forEach((jsonixAnnoSet) => {
            if (map.has(jsonixAnnoSet.id)) {
                logger.error('AnnoSet already exists');
            }
            map.set(jsonixAnnoSet.id, pattern);
        });
    });
    return map;
}

function initSentences(jsonixSentences, lexUnit, annoSetPatternsMap, annotationSets, labels, sentenceSet,
                       frameNetLayers) {
    async.each(jsonixSentences, (jsonixSentence) => {
        initSentence(
            jsonixSentence,
            lexUnit,
            annoSetPatternsMap,
            annotationSets,
            labels,
            sentenceSet,
            frameNetLayers
        );
    });
}

function initSentence(jsonixSentence, lexUnit, annoSetPatternsMap, annotationSets, labels, sentenceSet, frameNetLayers) {
    var _sentence = new Sentence({
        _id: jsonixSentence.id
    });
    var sentence = sentenceSet.get(_sentence);
    if(sentence !== undefined){
        initAnnoSets(
            jsonixUtils.toJsonixSentenceAnnoSetArray(jsonixSentence),
            lexUnit,
            sentence,
            annoSetPatternsMap,
            annotationSets,
            labels,
            frameNetLayers
        );
    }else{
        _sentence.text = jsonixSentence.text;
        _sentence.paragraphNumber = jsonixSentence.paragNo;
        _sentence.sentenceNumber = jsonixSentence.sentNo;
        _sentence.aPos = jsonixSentence.aPos;
        sentenceSet.add(_sentence);
        initAnnoSets(
            jsonixUtils.toJsonixSentenceAnnoSetArray(jsonixSentence),
            lexUnit,
            _sentence,
            annoSetPatternsMap,
            annotationSets,
            labels,
            frameNetLayers
        );
    }
}

function initAnnoSets(jsonixAnnoSets, lexUnit, sentence, annoSetPatternsMap, annotationSets, labels, frameNetLayers) {
    async.each(jsonixAnnoSets, (jsonixAnnoSet) => {
        if (isFrameNetSpecific(jsonixUtils.toJsonixLayerArray(jsonixAnnoSet), frameNetLayers)) {
            initAnnoSet(
                jsonixAnnoSet,
                lexUnit,
                sentence,
                annoSetPatternsMap,
                annotationSets,
                labels
            );
        }
    });
}

function isFrameNetSpecific(jsonixLayers, frameNetLayers) {
    for (let jsonixLayer of jsonixLayers) {
        if (frameNetLayers.includes(jsonixLayer.name)) {
            return true;
        }
    }
    return false;
}

function initAnnoSet(jsonixAnnoSet, lexUnit, sentence, annoSetPatternsMap, annotationSets, labels) {
    var annoSet = new AnnotationSet({
        _id: jsonixAnnoSet.id,
        sentence: sentence,
        lexUnit: lexUnit,
        labels: getLabels(jsonixAnnoSet, labels),
        pattern: annoSetPatternsMap.get(jsonixAnnoSet.id)
    });
    annotationSets.push(annoSet.toObject({depopulate: true})); // there should not be duplicates
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
