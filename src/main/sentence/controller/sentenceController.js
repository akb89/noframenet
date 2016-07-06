'use strict';

const Sentence = require('../model/sentenceModel');
const annotationSetController = require('../../annotationSet/controller/annotationSetController');
const InvalidArgumentException = require('../../../../exceptions/valencerException').InvalidArgumentException;
const InconsistentDataException = require('../../../../exceptions/valencerException').InconsistentDataException;
const logger = require('../../logger');

function importSentences(jsonixSentences){
    logger.info('Importing sentences');
    return jsonixSentences.map((jsonixSentence) => {
        try{
            return importSentence(jsonixSentence);
        }catch(err){
            // TODO: propagate error? 
        }
    });
}

function* importSentence(jsonixSentence){
    if(!jsonixSentence){
        throw new InvalidArgumentException('Cannot import sentence. Input is null or undefined.');
    }
    logger.verbose('Importing sentence with fn_id = '+jsonixSentence.id+' and text = '+jsonixSentence.text);
    try{
        var mySentencePromise = Sentence.findByFNId(jsonixSentence.id);
        var mySentence = yield _toSentence(mySentencePromise, jsonixSentence);
        var annotationSets = annotationSetController.importAnnotationSets(
            annotationSetController.toJsonixAnnotationSetSubArray(jsonixSentence)
        );
        mySentence.annotationSets = annotationSets;
        yield mySentence.save();
        return mySentence;
    }catch(err){
        throw new Error(err);
    }
}

function* _toSentence(sentencePromise, jsonixSentence){
    var mySentence = yield sentencePromise;
    if(mySentence !== null){
        logger.silly('Sentence already exists in database. Comparing text values.');
        if(mySentence.text !== jsonixSentence.text){
            throw new InconsistentDataException('FrameNet database inconsistency detected: sentences with same ID do' +
                ' not have same text');
        }else{
            logger.silly('Text values match. Proceeding.');
            return mySentence;
        }
    }else{
        logger.silly('Sentence not in database. Creating new entry.');
        mySentence = new Sentence({
            fn_id: jsonixSentence.id,
            text: jsonixSentence.text
        });
        try{
            yield mySentence.save();
            return mySentence;
        }catch(err){
            throw new Error(err);   
        }
    }
}

function* mergeAnnotationSetObjectIdSetAndSave(jsonixSentence, mongooseSentence){
    /*if(!mongooseSentence && !jsonixSentence){

    }else{
        return Promise.reject('Cannot merge annotationSetObjectIdSet: input jsonixSentence and/or mongooseSentence' +
            ' are null or undefined.');
    }*/
     var annotationSetObjectIdSet = yield annotationSetController.getAnnoSetObjectIdSetFromSentence(jsonixSentence);
     mongooseSentence.annotationSets.merge(annotationSetObjectIdSet);
     return mongooseSentence.save(); // This is a promise
}

function toJsonixSentenceArray(jsonixLexUnit){
    if(!jsonixLexUnit){
        throw new InvalidArgumentException('Cannot get sentences. Input lexUnit is null or undefined.')
    }
    // Catching errors thrown by Jsonix
    try{
        logger.verbose('Getting all sentences from lexUnit');
        var sentences = [];
        var subCorpusIterator = 0;
        if(jsonixLexUnit.value.hasOwnProperty('subCorpus')){
            while(jsonixLexUnit.value.subCorpus[subCorpusIterator] !== undefined){
                var subCorpus = jsonixLexUnit.value.subCorpus[subCorpusIterator];
                logger.silly('Processing subCorpus: '+subCorpus.name);
                var sentenceIterator = 0;
                if(subCorpus.hasOwnProperty('sentence')){
                    while(subCorpus.sentence[sentenceIterator] !== undefined) {
                        var sentence = subCorpus.sentence[sentenceIterator];
                        logger.silly('Processing sentence: fn_id = '+ sentence.id + ' text = ' + sentence.text);
                        sentences.push(sentence);
                        sentenceIterator++;
                    }
                }
                subCorpusIterator++;
            }
        }
        return sentences;
    }catch(err){
        throw new Error(err);
    }
}

module.exports = {
    toJsonixSentenceArray,
    importSentence,
    importSentences
};