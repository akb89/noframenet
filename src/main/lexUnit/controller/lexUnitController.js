'use strict';

const patternController = require('../../pattern/controller/patternController');
const sentenceController = require('../../sentence/controller/sentenceController');
const LexUnit = require('../model/lexUnitModel');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException;
const logger = require('../../logger');

function importLexUnits(jsonixLexUnits){
<<<<<<< HEAD
=======
    /*var lexUnits = [];
    for(let jsonixLexUnit of jsonixLexUnits){
        try{
            var lexUnit = yield importLexUnit(jsonixLexUnit);
            lexUnits.push(lexUnit);
        }catch(err){
            logger.error(err);
        }
    }
    return lexUnits;*/

>>>>>>> 5e06e03b4ffc4606f99c2fc27823d02587314a5b
    return jsonixLexUnits.map((jsonixLexUnit) => {
        return importLexUnit(jsonixLexUnit);
    });
}

function* importLexUnit(jsonixLexUnit){
    if(!jsonixLexUnit){
        throw new InvalidArgumentException('Cannot import lexUnit. Input is null or undefined.');
    }
    //logger.info('Importing lexUnit with fn_id = '+jsonixLexUnit.value.id+' and name = '+jsonixLexUnit.value.name);
    var myLexUnit = yield findLexUnitByFNId(jsonixLexUnit.value.id);
    if(myLexUnit !== null){
        logger.error('LexUnit with fn_id = '+jsonixLexUnit.value.id+' and name = '+jsonixLexUnit.value.name+' already' +
            ' in database.');
        yield sentenceController.importSentences(toJsonixSentenceArray(jsonixLexUnit), myLexUnit);
        yield patternController.importPatterns(toJsonixPatternArray(jsonixLexUnit));
        return myLexUnit
    }
    logger.info('LexUnit with fn_id = '+jsonixLexUnit.value.id+' and name = '+jsonixLexUnit.value.name+' not in' +
        ' database. Creating new entry.');
    myLexUnit = new LexUnit({
        fn_id: jsonixLexUnit.value.id,
        name: jsonixLexUnit.value.name,
        pos: jsonixLexUnit.value.pos,
        status: jsonixLexUnit.value.status,
        frame: jsonixLexUnit.value.frame,
        frameId: jsonixLexUnit.value.frameId,
        totalAnnotated: jsonixLexUnit.value.totalAnnotated
    });
    //console.log('almost3 fn_id = '+jsonixLexUnit.value.id+' and name = '+jsonixLexUnit.value.name);
    try{
        yield myLexUnit.save();
        yield sentenceController.importSentences(toJsonixSentenceArray(jsonixLexUnit), myLexUnit);
        yield patternController.importPatterns(toJsonixPatternArray(jsonixLexUnit));
    }catch(err){
        logger.error(err);
    }
    return myLexUnit;
}

function findLexUnitByFNId(id){
    return LexUnit.findByFNId(id);
}

function toJsonixPatternArray(jsonixLexUnit){
    //logger.verbose('Getting all valence patterns from jsonixLexUnit');
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
    //logger.verbose('Getting all sentences from jsonixLexUnit');
    var sentences = [];
    var subCorpusIterator = 0;
    if(jsonixLexUnit.value.hasOwnProperty('subCorpus')){
        while(jsonixLexUnit.value.subCorpus[subCorpusIterator] !== undefined){
            var subCorpus = jsonixLexUnit.value.subCorpus[subCorpusIterator];
            //logger.silly('Processing subCorpus: '+subCorpus.name);
            var sentenceIterator = 0;
            if(subCorpus.hasOwnProperty('sentence')){
                while(subCorpus.sentence[sentenceIterator] !== undefined) {
                    var sentence = subCorpus.sentence[sentenceIterator];
                    //logger.silly('Processing sentence: fn_id = '+ sentence.id + ' text = ' + sentence.text);
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
    importLexUnits,
    importLexUnit,
    toJsonixPatternArray,
    toJsonixSentenceArray
};