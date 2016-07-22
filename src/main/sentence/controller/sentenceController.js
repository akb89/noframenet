'use strict';

const Sentence = require('../model/sentenceModel');
const annoSetController = require('../../annotationSet/controller/annotationSetController');
const logger = require('../../logger');

function importSentences(jsonixSentences, dbLexUnit){
<<<<<<< HEAD
=======
    //logger.verbose('Importing sentences');
    /*var sentences = [];
    for(let jsonixSentence of jsonixSentences){
        var sentence = yield importSentence(jsonixSentence, dbLexUnit);
        sentences.push(sentence);
    }
    return sentences;*/

>>>>>>> 5e06e03b4ffc4606f99c2fc27823d02587314a5b
    return jsonixSentences.map((jsonixSentence) => {
        return importSentence(jsonixSentence, dbLexUnit);
    });
}

function* importSentence(jsonixSentence, dbLexUnit){
    //logger.verbose('Importing sentence with fn_id = '+jsonixSentence.id+' and text = \''+jsonixSentence.text+'\'');
    var mySentence = yield findSentenceByFNId(jsonixSentence.id);
    if(mySentence !== null){
        logger.verbose('Sentence with fn_id = '+jsonixSentence.id+' and text = \''+jsonixSentence.text+'\' already in' +
            ' database.');
        yield annoSetController.importAnnotationSets(toJsonixAnnoSetArray(jsonixSentence), mySentence, dbLexUnit);
        return mySentence;
    }
    logger.verbose('Sentence with fn_id = '+jsonixSentence.id+' and text = \''+jsonixSentence.text+'\' not in' +
        ' database. Creating new entry.');
    mySentence = new Sentence({
        fn_id: jsonixSentence.id,
        text: jsonixSentence.text
    });
    try{
        yield mySentence.save();
        yield annoSetController.importAnnotationSets(toJsonixAnnoSetArray(jsonixSentence), mySentence, dbLexUnit);
    }catch(err){
        logger.verbose('Sentence with fn_id = '+jsonixSentence.id+' and text = \''+jsonixSentence.text+'\' was' +
            ' inserted to database during import process. Starting importSentence over again.');
        yield importSentence(jsonixSentence, dbLexUnit);
    }
    return mySentence;
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
            //logger.silly('Processing AnnotationSet: fn_id = ' + annotationSet.id);
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