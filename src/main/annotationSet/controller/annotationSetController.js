'use strict';

const AnnotationSet = require('../model/annotationSetModel');
const labelController = require('../../label/controller/labelController');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException;
const logger = require('../../logger');

const frameNetLayers = ['FE', 'PT', 'GF']; //TODO: externalize?

function* importAnnotationSets(jsonixAnnotationSets, dbSentence, dbLexUnit){
    logger.verbose('Importing annotationSets');
    var annoSets = [];
    for(let jsonixAnnoSet of jsonixAnnotationSets){
        var annoSet = yield importAnnotationSet(jsonixAnnoSet, dbSentence, dbLexUnit);
        annoSets.push(annoSet);
    }
    return annoSets;
    /*
    return jsonixAnnotationSets.map((jsonixAnnotationSet) => {
        return importAnnotationSet(jsonixAnnotationSet, dbSentence, dbLexUnit);
    });*/
}

function* importAnnotationSet(jsonixAnnotationSet, dbSentence, dbLexUnit){
    logger.verbose('Importing AnnotationSet with fn_id = '+jsonixAnnotationSet.id);
    var myAnnotationSet = yield findAnnotationSetByFNId(jsonixAnnotationSet.id);
    if(myAnnotationSet !== null){
        // The AnnotationSet is not FrameNet-related. The AnnotationSet.LexUnit reference is irrelevant
        return myAnnotationSet;
    }
    logger.silly('AnnotationSet not in database. Creating new entry.');
    myAnnotationSet = new AnnotationSet({fn_id: jsonixAnnotationSet.id});
    myAnnotationSet.sentence = dbSentence;
    var jsonixLayers = toJsonixLayerArray(jsonixAnnotationSet);
    myAnnotationSet.labels = yield labelController.importLabelsFromLayers(jsonixLayers);
    if(isFrameNetSpecific(jsonixLayers)){
        myAnnotationSet.lexUnit = dbLexUnit;
    }
    // myAnnotationSet.pattern is updated during import of patterns
    return myAnnotationSet.save();
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
        logger.warn('Careful: given array of annotationSets contains null entries. Not all pattern references will' +
            ' be updated.');
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
                ' specified.');
        }
        annotationSet.pattern = pattern;
        return annotationSet.save();
    }
}

function toJsonixLayerArray(jsonixAnnotationSet){
    logger.verbose('Getting all layers from jsonixAnnotationSet');
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