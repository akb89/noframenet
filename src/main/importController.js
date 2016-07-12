'use strict';

const importController = module.exports = {};
const filesystem = require('fs');
const Jsonix = require('jsonix').Jsonix;
const co = require('co');
const PropertiesReader = require('properties-reader');
const properties = PropertiesReader('../../properties.ini');
const FrameSchema = require('.././FrameSchema.js').FrameSchema;
const LexUnitSchema = require('.././LexUnitSchema').LexUnitSchema;
const context = new Jsonix.Context([FrameSchema, LexUnitSchema]);
const unmarshaller = context.createUnmarshaller();
const LexUnit = require('./lexUnit/model/lexUnitModel');
const Sentence = require('./sentence/model/sentenceModel');
const Label = require('./label/model/labelModel');
const logger = require('./logger');
const OPEN_FILES_LIMIT = 500; //TODO externalize
const path = require('path');

//const annoSetController = require('./AnnotationSet/controller/annoSetController');
//const sentenceController = require('./sentence/controller/sentenceController');

importController.importData = function*(next){
    saveFNXmlLexUnitToDB();
    yield next;
};

saveFNXmlLexUnitToDB(properties.get('main.lexUnit.directory')).then((ok) => {console.log(ok)});

// TODO must be yielded for call: yield saveTest() which returns, e.g. an array of true/false
function saveFNXmlLexUnitToDB(lexUnitDir){
    logger.info('Processing directory: '+lexUnitDir);
    var filesPromise = new Promise( (resolve, reject) => {
        filesystem.readdir(lexUnitDir, (error, files) => {
            if(error) return reject(error);
            return resolve(files);
        })
    });

    return co(function*() {
        var files = yield filesPromise;
        var unmarshalledLexUnits = yield files.map( (file) => {return processFile(lexUnitDir, file)} );
        return yield unmarshalledLexUnits.map((unmarshalledLexUnit) => {
            return importXmlLexUnitContent(unmarshalledLexUnit)
        });
    })
}

function processFile(__directory, file) {
    var filePath = path.join(__directory, file);
    logger.info('Path = ' + filePath);
    if(!filePath.endsWith('.xml')){
        logger.error('Invalid xml file: '+file);
        return;
    }

    logger.info('Processing file: ' + file);
    return new Promise((resolve, reject) => {
        unmarshaller.unmarshalFile(filePath, (unmarshalledFile) => {
            return resolve(unmarshalledFile);
        });
    });
}

// Rename that in getAnnotationSetObjectIdSet?
function importAnnotationSet(annotationSet){
    let layers = getLayers(annotationSet);
    if(layers.length == 0 || layers == null){
        logger.error('Cannot import AnnotationSet. Layers array is empty, null of undefined.');
    }else{
        logger.debug('Importing AnnotationSet');
        let labelObjectIdSet = getLabelObjectIdSet(layers);
        if(labelObjectIdSet.length === 0 || labelObjectIdSet == null){
            logger.error('Cannot import AnnotationSet with fn_id = '+annotationSet.ID+'. LabelObjectIdSet is empty,' +
                ' null or undefined.');
        }else{
            let myAnnotationSet = new AnnotationSet();
            myAnnotationSet.fn_id = annotationSet.ID;
            myAnnotationSet.labels = labelObjectIdSet;
            myAnnotationSet.save(function(err){
               logger.error(err);
            });
        }
    }
}

function getLabelObjectIdSet(layers){
    let labelObjectIdSet = [];
    if(layers.length === 0 || layers == null){
        logger.error('Cannot get labelObjectIdSet. Input layers array is empty, null or undefined'); // TODO check
    }else{
        for(let i = 0; i < layers.length; i++){
            if(isValidLayer(layers[i].name)){
                let labels = getLabels(layers[i]);
                if(labels.length === 0 || labels == null){
                    logger.error('')
                }else{
                    for(let j = 0; j < labels.length; j++){
                        let myLabel = new Label();
                        myLabel.name = labels[j].name;
                        myLabel.type = layers[i].name;
                        myLabel.startPos = labels[j].start;
                        myLabel.endPos = labels[j].end;

                        let findLabel = Label.findLabel(myLabel);
                        if(findLabel !== null){
                            labelObjectIdSet.push(findLabel._id);
                        }else{
                            myLabel.save(function(err){
                                logger.error(err);
                            });
                            labelObjectIdSet.push(myLabel._id);
                        }
                    }
                }
            }
        }
    }
    return labelObjectIdSet;
}

function getLayers(annotationSet){
    let layers = [];
    if(annotationSet == null){
        logger.error('Cannot get layers. Input AnnotationSet is null or undefined.'); // TODO Check
    }else{
        let layerIterator = 0;
        while(annotationSet.layer[layerIterator] !== undefined){
            layers.push(annotationSet.layer[layerIterator]);
            layerIterator++;
        }
    }
    return layers;
}

function isValidLayer(layerName){
    // TODO externalize parameters in this function as import config.
    if(layerName === 'FE' || layerName === 'PT' || layerName === 'GF'){
        return true;
    }
    return false;
}

function getLabels (layer){
    let labels = [];
    if(layer == null){
        logger.error('Cannot get labels. Input layer is null or undefined.'); // TODO check
    }else{
        let labelIterator = 0;
        while(layer.label[labelIterator] !== undefined){
            labels.push(layer.label[labelIterator]);
            labelIterator++;
        }
    }
    return labels;
}

/**
 * Save the content of a given FrameNet lu.xml file to a Mongo database.
 * @param jsonixLexUnit The content of a FrameNet lu.xml file unmarshalled by Jsonix
 */
function* importXmlLexUnitContent(jsonixLexUnit){
    logger.info('Importing content of lu.xml file for LexUnit with ID = '+jsonixLexUnit.value.ID+' and name = ' + jsonixLexUnit.value.name);
    // Should be done asynchronously (all methods are independent):

    // import Sentences
    return sentenceController.importSentences(sentenceController.toJsonixSentenceArray(jsonixLexUnit));

    /*
    try{

        // import AnnotationSets
        yield annoSetController.importAnnotationSets(annoSetController.toJsonixAnnoSetArray(jsonixLexUnit));

        // import labels
        importLabelsFromLayers(getLabels(jsonixLexUnit));

        // import patterns
        importPatterns(getPatterns(jsonixLexUnit));

        // import valenceUnits
        importValenceUnits(getValenceUnits(jsonixLexUnit));

        // import labelSets
        importLabelSets(getLabelSets(jsonixLexUnit));

        // import lexUnits
        importLexUnits(getLexUnits(jsonixLexUnit));
    }catch(err){

    }
    */
}

