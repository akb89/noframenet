'use strict';

const AnnotationSet = require('../model/annotationSetModel');
const sentenceController = require('../../sentence/controller/sentenceController');
const InvalidArgumentException = require('../../../../exceptions/valencerException').InvalidArgumentException;
const logger = require('../../logger');

require('../../utils');

function* importAnnotationSets(jsonixAnnotationSets){
    logger.info('Importing annotationSets');
    return jsonixAnnotationSets.map((jsonixAnnotationSet) => {
        try{
            return yield importAnnotationSet(jsonixAnnotationSet);
        }catch(err){
            //TODO: propagate error? 
        }
    });
}

// Returns a promise!
function* importAnnotationSet(jsonixAnnotationSet){
    if(!jsonixAnnotationSet){
        throw new InvalidArgumentException('Cannot import annotationSet. Input is null or undefined.');
    }
    logger.verbose('Importing annotationSet with fn_id = '+jsonixAnnotationSet.id);
    try{
        var myAnnotationSetPromise = AnnotationSet.findByFnId(jsonixAnnotationSet.id);
        var myAnnotationSet = _toAnnotationSet(myAnnotationSetPromise, jsonixAnnotationSet);
        var labels = labelController.importLabels(
            labelController.toJsonixLabelArray(jsonixAnnotationSet)
        );
        myAnnotationSet.labels = labels;
        yield myAnnotationSet.save();
        return myAnnotationSet;
    }catch(err){
        throw new Error(err);
    }
}

function* _toAnnotationSet(annotationSetPromise, jsonixAnnotationSet){
    var myAnnotationSet = yield annotationSetPromise;
    if(myAnnotationSet !== null){
        logger.silly('AnnotationSet already exists in the database.');
        return myAnnotationSet;
    }else{
        logger.silly('AnnotationSet not in database. Creating new entry.');
        myAnnotationSet = new AnnotationSet({fn_id: jsonixAnnotationSet.id});
        try{
            yield myAnnotationSet.save();
            return myAnnotationSet;
        }catch(err){
            throw new Error(err);
        }
    }
}

function toJsonixAnnotationSetArray(jsonixLexUnit){
    if(!jsonixLexUnit){
        throw new InvalidArgumentException('Cannot get annotationSets. Input lexUnit is null or undefined.')
    }
    logger.verbose('Getting all annotationSets from lexUnit');
    try{
        var sentences = sentenceController.toJsonixSentenceArray(jsonixLexUnit);
        return sentences.map((sentence) => {
            return toJsonixAnnotationSetSubArray(sentence);
        }).flatten();
    }catch(err){
        throw new Error(err);
    }
}

function toJsonixAnnotationSetSubArray(jsonixSentence){
    if(!jsonixSentence){
        throw new InvalidArgumentException('Cannot get annotationSets. Input sentence is null or undefined.')
    }
    logger.verbose('Getting all annotationSets from jsonixSentence');
    try{
        var annotationSets = [];
        var annoSetIterator = 0;
        if(jsonixSentence.hasOwnProperty('annotationSet')){
            while(jsonixSentence.annotationSet[annoSetIterator] !== undefined){
                let annotationSet = jsonixSentence.annotationSet[annoSetIterator];
                logger.silly('Processing annotationSet: fn_id = ' + annotationSet.id);
                annotationSets.push(annotationSet);
                annoSetIterator ++;
            }
        }else if(jsonixSentence.value.hasOwnProperty('annotationSet')){
            while(jsonixSentence.value.annotationSet[annoSetIterator] !== undefined){
                let annotationSet = jsonixSentence.value.annotationSet[annoSetIterator];
                logger.silly('Processing annotationSet: fn_id = ' + annotationSet.id);
                annotationSets.push(annotationSet);
                annoSetIterator ++;
            }
        }
        return annotationSets;
    }catch(err){
        throw new Error(err);
    }
}

function* getAnnoSetObjectIdSetFromSentence(jsonixSentence){
    if(!jsonixSentence){
        throw new InvalidArgumentException('Cannot get annoSetObjectIdSet. Input sentence is null or undefined.');
    }
    var annotationSets = toJsonixAnnotationSetSubArray(jsonixSentence);
    var annoSetObjectIdSet = yield getAnnoSetObjectIdSetFromAnnoSets(annotationSets);
    return annoSetObjectIdSet;
}

function* getAnnoSetObjectIdSetFromAnnoSets(jsonixAnnotationSets){
    if(!jsonixAnnotationSets){
        throw new InvalidArgumentException('Cannot get annoSetObjectIdSet. Input array of unmarshalled' +
            ' jsonixAnnotationSets is null or undefined.');
    }
    logger.silly('Getting all ObjectId from array of jsonixAnnotationSets');
    var mySet = new Set();
    for (let i = 0; i < jsonixAnnotationSets.length; i++){
        var annotationSet = jsonixAnnotationSets[i];
        var dbAnnotationSet = yield AnnotationSet.findByFnId(annotationSet.id);
        if(dbAnnotationSet !== null){
            mySet.add(dbAnnotationSet._id);
        }else{
            dbAnnotationSet = new AnnotationSet({fn_id: annotationSet.id});
            mySet.add(this.saveAndReturnId(dbAnnotationSet)); // this here is for testing with sinonjs spy
        }
    }
    return mySet;
}

// This function is created for simplifying behavior testing
function* saveAndReturnId(dbAnnotationSet){
    logger.silly('Saving new AnnotationSet to db with fn_id = '+dbAnnotationSet.fn_id);
    var newAnnoSet = yield dbAnnotationSet.save();
    return newAnnoSet._id;
}

function findOrCreateAnnotationSetsFromSentence(jsonixSentence){

}

module.exports = {
    importAnnotationSets: importAnnotationSets,
    toJsonixAnnotationSetArray: toJsonixAnnotationSetArray,
    toJsonixAnnotationSetSubArray: toJsonixAnnotationSetSubArray,
    saveAndReturnId: saveAndReturnId,
    getAnnoSetObjectIdSetFromSentence: getAnnoSetObjectIdSetFromSentence
};