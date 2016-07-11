'use strict';

const patternController = require('../../pattern/controller/patternController');
const sentenceController = require('../../sentence/controller/sentenceController');
const LexUnit = require('../model/lexUnitModel');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException
const logger = require('../../logger');

function importLexUnit(jsonixLexUnit){
    if(!jsonixLexUnit){
        throw new InvalidArgumentException('Cannot import lexUnit. Input is null or undefined.');
    }
    logger.info('Importing lexUnit with fn_id = '+jsonixLexUnit.value.id+' and name = '+jsonixLexUnit.value.name);

    sentenceController.importSentences(toJsonixSentenceArray(jsonixLexUnit));

    // This needs to be done once all the annotationSets have been inserted in the database. 
    patternController.importPatterns(toJsonixPatternArray(jsonixLexUnit));
}

function* toLexUnit(jsonixLexUnit){
    var myLexUnit = yield toLexUnitPromise(jsonixLexUnit);
    if(myLexUnit !== null){
        logger.silly('LexUnit already exists in database.');
    }else{
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
        try{
            yield myLexUnit.save();
        }catch(err){
            logger.error(err);
        }
    }
    return myLexUnit;
}

function toLexUnitPromise(jsonixLexUnit){
    return LexUnit.findByFNId(jsonixLexUnit.id);
}

function toJsonixPatternArray(jsonixLexUnit){
    if(!jsonixLexUnit){
        throw new InvalidArgumentException('Cannot get valence patterns. Input jsonixLexUnit is null or undefined.')
    }
    logger.verbose('Getting all valence patterns from jsonixLexUnit');
    var patterns = [];
    try{
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
    }catch(err){
        logger.error(err);
    }
    return patterns;
}

function toJsonixSentenceArray(jsonixLexUnit){
    if(!jsonixLexUnit){
        throw new InvalidArgumentException('Cannot get sentences. Input jsonixLexUnit is null or undefined.')
    }
    // Catching errors thrown by Jsonix
    logger.verbose('Getting all sentences from jsonixLexUnit');
    try{
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
        logger.error(err);
    }
}

module.exports = {
    importLexUnit,
    toLexUnit,
    toJsonixPatternArray,
    toJsonixSentenceArray
};