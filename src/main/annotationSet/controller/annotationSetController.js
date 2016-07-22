'use strict';

const AnnotationSet = require('../model/annotationSetModel');
const labelController = require('../../label/controller/labelController');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException;
const logger = require('../../logger');

const frameNetLayers = ['FE', 'PT', 'GF']; //TODO: externalize?

function importAnnotationSets(jsonixAnnotationSets, dbSentence, dbLexUnit){
    return jsonixAnnotationSets.map((jsonixAnnotationSet) => {
        return importAnnotationSet(jsonixAnnotationSet, dbSentence, dbLexUnit);
    });
}

//TODO revise corresponding tests
function* importAnnotationSet(jsonixAnnotationSet, dbSentence, dbLexUnit){
    var jsonixLayers = toJsonixLayerArray(jsonixAnnotationSet);
    if(!isFrameNetSpecific(jsonixLayers)){
        logger.silly('Skipping non-FrameNet-specific AnnotationSet with fn_id = '+jsonixAnnotationSet.id);
        return;
    }
    var myAnnotationSet = yield findAnnotationSetByFNId(jsonixAnnotationSet.id);
    if(myAnnotationSet !== null){
        logger.error('AnnotationSet with fn_id = '+jsonixAnnotationSet.id+' already in database.');
        // The AnnotationSet is not FrameNet-related. The AnnotationSet.LexUnit reference is irrelevant
        // ^ is no longer accurate
        // This should never happen with FrameNet AnnotationSets //TODO throw error
        return myAnnotationSet;
    }
    logger.verbose('AnnotationSet with fn_id = '+jsonixAnnotationSet.id+' not in database. Creating new entry.');
    myAnnotationSet = new AnnotationSet({fn_id: jsonixAnnotationSet.id});
    myAnnotationSet.sentence = dbSentence;
    myAnnotationSet.labels = yield labelController.importLabelsFromLayers(jsonixLayers);
    myAnnotationSet.lexUnit = dbLexUnit;
    // myAnnotationSet.pattern is updated during import of patterns
    try{
        yield myAnnotationSet.save();
    }catch(err){
        logger.error(err);
    }
    return myAnnotationSet;
}

function isFrameNetSpecific(jsonixLayers){
    for(let jsonixLayer of jsonixLayers){
        if(frameNetLayers.includes(jsonixLayer.name)){
            return true;
        }
    }
    return false;
}

function findAnnotationSetByFNId(id){
    return AnnotationSet.findByFNId(id);
}

function updatePatternReferences(annotationSets, pattern){
    if(annotationSets.includes(null)){
        logger.warn('Careful: given array of annotationSets contains null entries: '+annotationSets+'\n Not all' +
            ' pattern references will be updated. Pattern: '+pattern);
    }
    return annotationSets.map((annotationSet) => {
        return updatePatternReference(annotationSet, pattern);
    });
}

function updatePatternReference(annotationSet, pattern){
    if(annotationSet){
        if(annotationSet.pattern){
            throw new InvalidArgumentException('Cannot update AnnotationSet.Pattern reference. Specified annotationSet' +
                ' with id = '+annotationSet._id+' and fn_id = '+ annotationSet.fn_id + ' already has a pattern reference' +
                ' specified: '+annotationSet.pattern);
        }
        annotationSet.pattern = pattern;
        try{
            annotationSet.save();
        }catch(err){
            logger.error(err);
        }
        return annotationSet;
    }
}

function toJsonixLayerArray(jsonixAnnotationSet){
    //logger.verbose('Getting all layers from jsonixAnnotationSet');
    var layers = [];
    var layerIterator = 0;
    if(jsonixAnnotationSet.hasOwnProperty('layer')){
        while(jsonixAnnotationSet.layer[layerIterator] !== undefined){
            layers.push(jsonixAnnotationSet.layer[layerIterator]);
            layerIterator++;
        }
    }
    return layers;
}

module.exports = {
    importAnnotationSets,
    importAnnotationSet,
    findAnnotationSetByFNId,
    updatePatternReferences,
    updatePatternReference,
    toJsonixLayerArray
};