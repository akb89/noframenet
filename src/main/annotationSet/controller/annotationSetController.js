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

function* importAnnotationSet(jsonixAnnotationSet){
    logger.verbose('Importing AnnotationSet with fn_id = '+jsonixAnnotationSet.id);
    var myAnnotationSet = yield findAnnotationSetByFNId(jsonixAnnotationSet.id);
    if(myAnnotationSet !== null){
        console.log('throwing error');
        throw new Error('AnnotationSet already exists in the database. AnnotationSets should not refer to multiple' +
            ' lexUnits.');
    }
    logger.silly('AnnotationSet not in database. Creating new entry.');
    myAnnotationSet = new AnnotationSet({fn_id: jsonixAnnotationSet.id});
    myAnnotationSet.labels = yield labelController.importLabels(
        toJsonixLayerArray(jsonixAnnotationSet)
    );
    return myAnnotationSet.save();
}

function findAnnotationSetByFNId(id){
    return AnnotationSet.findByFNId(id);
}

function updatePatternReferences(annotationSets, pattern){
    if(annotationSets.includes(null)){
        throw new InvalidArgumentException('Cannot update annotationSets\' pattern references: given array of annotationSets contains' +
            ' null entries.');
    }
    return annotationSets.map((annotationSet) => {
        return updatePatternReference(annotationSet, pattern);
    });
}

function updatePatternReference(annotationSet, pattern){
    if(annotationSet.pattern){
        throw new InvalidArgumentException('Cannot update AnnotationSet.Pattern reference. Specified annotationSet' +
            ' with id = '+annotationSet._id+' and fn_id = '+ annotationSet.fn_id + ' already has a pattern reference' +
            ' specified.');
    }
    annotationSet.pattern = pattern;
    return annotationSet.save();
}

function toJsonixLayerArray(jsonixAnnotationSet){
    logger.verbose('Getting all layers from jsonixAnnotationSet');
    var layers = [];
    var layerIterator = 0;
    if(jsonixAnnotationSet.hasOwnProperty('layer')){
        while(jsonixAnnotationSet.layer[layerIterator] !== undefined){
            /*if(isValidLayer(jsonixAnnotationSet.layer[layerIterator])){
                layers.push(jsonixAnnotationSet.layer[layerIterator]);
            }*/
            layers.push(jsonixAnnotationSet.layer[layerIterator]);
            layerIterator++;
        }
    }
    return layers;
}

//TODO keep or remove?
function isValidLayer(jsonixLayer){
    if(jsonixLayer.name === 'FE' || jsonixLayer.name === 'PT' || jsonixLayer.name === 'GF' || jsonixLayer.name === 'Target'){
        return true;
    }
    return false;
}

module.exports = {
    importAnnotationSets,
    importAnnotationSet,
    findAnnotationSetByFNId,
    updatePatternReferences,
    updatePatternReference,
    toJsonixLayerArray
};