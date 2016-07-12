'use strict';

const annoSetController = require('../../annotationSet/controller/annotationSetController');
const patternController = require('../../pattern/controller/patternController');
const sentenceController = require('../../sentence/controller/sentenceController');
const LexUnit = require('../model/lexUnitModel');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException
const logger = require('../../logger');

function* importLexUnit(jsonixLexUnit){
    if(!jsonixLexUnit){
        throw new InvalidArgumentException('Cannot import lexUnit. Input is null or undefined.');
    }
    logger.info('Importing lexUnit with fn_id = '+jsonixLexUnit.value.id+' and name = '+jsonixLexUnit.value.name);
    var myLexUnit = yield findLexUnitByFNId(jsonixLexUnit.value.id);
    if(myLexUnit !== null){
        logger.silly('LexUnit already exists in database.')
        yield sentenceController.importSentences(toJsonixSentenceArray(jsonixLexUnit));
        let annoSets = yield annoSetController.importAnnotationSets(toJsonixAnnoSetArray(jsonixLexUnit));
        yield annoSetController.updateLexUnitReferences(annoSets, myLexUnit);
        yield patternController.importPatterns(toJsonixPatternArray(jsonixLexUnit));
        return myLexUnit
    }
    logger.silly('LexUnit not in database. Creating new entry.');
    myLexUnit = new LexUnit({
        fn_id: jsonixLexUnit.value.id,
        name: jsonixLexUnit.value.name,
        pos: jsonixLexUnit.value.pos,
        status: jsonixLexUnit.value.status,
        frame: jsonixLexUnit.value.frame,
        frameId: jsonixLexUnit.value.frameId,
        totalAnnotated: jsonixLexUnit.value.totalAnnotated
    });
    yield sentenceController.importSentences(toJsonixSentenceArray(jsonixLexUnit));
    let annoSets = yield annoSetController.importAnnotationSets(toJsonixAnnoSetArray(jsonixLexUnit));
    yield annoSetController.updateLexUnitReferences(annoSets, myLexUnit);
    yield patternController.importPatterns(toJsonixPatternArray(jsonixLexUnit));
    return myLexUnit.save();
}

function findLexUnitByFNId(id){
    return LexUnit.findByFNId(id);
}

function toJsonixPatternArray(jsonixLexUnit){
    logger.verbose('Getting all valence patterns from jsonixLexUnit');
    var patterns = [];
    if(jsonixLexUnit.value.hasOwnProperty('valences')){
        var valences = jsonixLexUnit.value.valences;
        if(valences.hasOwnProperty(('feGroupRealization'))){
            var feGroupRealizationIterator = 0;
            while(valences.feGroupRealization[feGroupRealizationIterator] !== undefined){
                var feGRealization = valences.feGroupRealization[feGroupRealizationIterator];
                if(feGRealization.hasOwnProperty('pattern')){
                    var patternIterator = 0;
                    while(feGRealization.pattern[patternIterator] !== undefined){
                        patterns.push(feGRealization.pattern[patternIterator]);
                        patternIterator++;
                    }
                }
                feGroupRealizationIterator++;
            }
        }
    }
    return patterns;
}

function toJsonixSentenceArray(jsonixLexUnit){
    logger.verbose('Getting all sentences from jsonixLexUnit');
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
}

module.exports = {
    importLexUnit,
    toJsonixPatternArray,
    toJsonixSentenceArray
};