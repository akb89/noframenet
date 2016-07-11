'use strict';

const Sentence = require('../model/sentenceModel');
const annoSetController = require('../../annotationSet/controller/annotationSetController');
const InconsistentDataException = require('../../../../exception/valencerException').InconsistentDataException
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException
const logger = require('../../logger');

function importSentences(jsonixSentences){
    logger.info('Importing sentences');
    return jsonixSentences.map((jsonixSentence) => {
        return importSentence(jsonixSentence);
    });
}

function* importSentence(jsonixSentence){
    if(!jsonixSentence){
        throw new InvalidArgumentException('Cannot import sentence. Input is null or undefined.');
    }
    logger.verbose('Importing sentence with fn_id = '+jsonixSentence.id+' and text = '+jsonixSentence.text);
    var sentenceAnnoSets =  yield annoSetController.importAnnotationSets(toJsonixAnnoSetArray(jsonixSentence));
    var mySentence = yield findSentenceByFNId(jsonixSentence.id);
    if(mySentence !== null){
        logger.silly('Sentence already exists in database. Comparing text values.');
        if(mySentence.text !== jsonixSentence.text){
            throw new InconsistentDataException('FrameNet database inconsistency detected: sentences with same ID do' +
                ' not have same text');
        }else{
            logger.silly('Text values match. Proceeding.');
            mySentence.annotationSets = mergeAnnotationSets(mySentence.annotationSets, sentenceAnnoSets);
        }
    }else{
        logger.silly('Sentence not in database. Creating new entry.');
        mySentence = new Sentence({
            fn_id: jsonixSentence.id,
            text: jsonixSentence.text
        });
        mySentence.annotationSets = sentenceAnnoSets;
        try{
            yield mySentence.save();
        }catch(err){
            logger.error(err);
        }
    }
    
    try{
        yield mySentence.save();
        return mySentence;
    }catch(err){
        logger.error(err);
    }
}

function* toSentence(jsonixSentence){
    var mySentence = yield findSentenceByFNId(jsonixSentence.id);
    if(mySentence !== null){
        logger.silly('Sentence already exists in database. Comparing text values.');
        if(mySentence.text !== jsonixSentence.text){
            throw new InconsistentDataException('FrameNet database inconsistency detected: sentences with same ID do' +
                ' not have same text');
        }else{
            logger.silly('Text values match. Proceeding.');
        }
    }else{
        logger.silly('Sentence not in database. Creating new entry.');
        mySentence = new Sentence({
            fn_id: jsonixSentence.id,
            text: jsonixSentence.text
        });
        try{
            yield mySentence.save();
        }catch(err){
            logger.error(err);
        }
    }
    return mySentence;
}

function findSentenceByFNId(fn_id){
    return Sentence.findByFNId(fn_id);
}

function toJsonixAnnoSetArray(jsonixSentence){
    if(!jsonixSentence){
        throw new InvalidArgumentException('Cannot get annotationSets. Input jsonixSentence is null or undefined.')
    }
    logger.verbose('Getting all annotationSets from jsonixSentence');
    try{
        var annotationSets = [];
        var annoSetIterator = 0;
        if(jsonixSentence.hasOwnProperty('annotationSet')){
            while(jsonixSentence.annotationSet[annoSetIterator] !== undefined){
                let annotationSet = jsonixSentence.annotationSet[annoSetIterator];
                logger.silly('Processing AnnotationSet: fn_id = ' + annotationSet.id);
                annotationSets.push(annotationSet);
                annoSetIterator ++;
            }
        }
        return annotationSets;
    }catch(err){
        logger.error(err);
    }
}

module.exports = {
    importSentences,
    importSentence,
    toSentence,
    findSentenceByFNId,
    toJsonixAnnoSetArray
};