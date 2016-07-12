'use strict';

const Sentence = require('../model/sentenceModel');
const annoSetController = require('../../annotationSet/controller/annotationSetController');
const logger = require('../../logger');

function importSentences(jsonixSentences, dbLexUnit){
    logger.info('Importing sentences');
    return jsonixSentences.map((jsonixSentence) => {
        return importSentence(jsonixSentence, dbLexUnit);
    });
}

function* importSentence(jsonixSentence, dbLexUnit){
    logger.verbose('Importing sentence with fn_id = '+jsonixSentence.id+' and text = '+jsonixSentence.text);
    var mySentence = yield findSentenceByFNId(jsonixSentence.id);
    if(mySentence !== null){
        logger.silly('Sentence already exists in database. Comparing text values.');
        yield annoSetController.importAnnotationSets(toJsonixAnnoSetArray(jsonixSentence), mySentence, dbLexUnit);
        return mySentence;
    }
    logger.silly('Sentence not in database. Creating new entry.');
    mySentence = new Sentence({
        fn_id: jsonixSentence.id,
        text: jsonixSentence.text
    });
    yield annoSetController.importAnnotationSets(toJsonixAnnoSetArray(jsonixSentence), mySentence, dbLexUnit);
    return mySentence.save();
}

function findSentenceByFNId(fn_id){
    return Sentence.findByFNId(fn_id);
}

function toJsonixAnnoSetArray(jsonixSentence){
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
}

module.exports = {
    importSentences,
    importSentence,
    findSentenceByFNId,
    toJsonixAnnoSetArray
};