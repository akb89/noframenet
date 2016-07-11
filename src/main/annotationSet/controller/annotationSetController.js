'use strict';

const AnnotationSet = require('../model/annotationSetModel');
const labelController = require('../../label/controller/labelController');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException
const logger = require('../../logger');

function importAnnotationSets(jsonixAnnotationSets){
    logger.info('Importing annotationSets');
    return jsonixAnnotationSets.map((jsonixAnnotationSet) => {
        return importAnnotationSet(jsonixAnnotationSet);
    });
}

// Returns a promise!
function* importAnnotationSet(jsonixAnnotationSet){
    if(!jsonixAnnotationSet){
        throw new InvalidArgumentException('Cannot import AnnotationSet. Input is null or undefined.');
    }
    logger.verbose('Importing AnnotationSet with fn_id = '+jsonixAnnotationSet.id);
    try{
        var myAnnotationSet = yield toAnnotationSet(jsonixAnnotationSet);
        myAnnotationSet.labels = yield labelController.importLabels(
            toJsonixLayerArray(jsonixAnnotationSet)
        ); //TODO: push! Don't replace!!
        yield myAnnotationSet.save(); // only if different? 
        return myAnnotationSet;
    }catch(err){
        logger.error(err);
    }
}

function* toAnnotationSet(jsonixAnnotationSet){
    var myAnnotationSet = yield toAnnotationSetPromise(jsonixAnnotationSet);
    if(myAnnotationSet !== null){
        logger.silly('AnnotationSet already exists in the database.');
        return myAnnotationSet
    }else{
        logger.silly('AnnotationSet not in database. Creating new entry.');
        myAnnotationSet = new AnnotationSet({fn_id: jsonixAnnotationSet.id});
        try{
            yield myAnnotationSet.save();
            return myAnnotationSet
        }catch(err){
            logger.error(err);
        }
    }
}

function toAnnotationSetPromise(jsonixAnnotationSet){
    return AnnotationSet.findByFNId(jsonixAnnotationSet.id);
}

function toJsonixLayerArray(jsonixAnnotationSet){
    if(!jsonixAnnotationSet){
        throw new InvalidArgumentException('Cannot get layers. Input jsonixAnnotationSet is null or undefined.');
    }
    logger.verbose('Getting all layers from jsonixAnnotationSet');
    try{
        var layers = [];
        var layerIterator = 0;
        if(jsonixAnnotationSet.hasOwnProperty('layer')){
            while(jsonixAnnotationSet.layer[layerIterator] !== undefined){
                layers.push(jsonixAnnotationSet.layer[layerIterator]);
                layerIterator++;
            }
        }
        return layers;
    }catch(err){
        logger.error(err);
    }
}

module.exports = {
    importAnnotationSets,
    importAnnotationSet,
    toAnnotationSet,
    toAnnotationSetPromise,
    toJsonixLayerArray
};