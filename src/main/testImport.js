'use strict';

const _ = require('lodash');
var FastSet = require('collections/fast-set');

const LexUnit = require('./lexUnit/model/lexUnitModel');
const Sentence = require('./sentence/model/sentenceModel');
const AnnotationSet = require('./annotationSet/model/annotationSetModel');
const Label = require('./label/model/labelModel');
const Pattern = require('./pattern/model/patternModel');
const ValenceUnit = require('./valenceUnit/model/valenceUnitModel');
const logger = require('./logger');

const frameNetLayers = ['FE', 'PT', 'GF']; //TODO: externalize?

var duration = function(startTime){
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(startTime)[1] / 1000000; // divide by a million to get nano to milli
    return process.hrtime(startTime)[0] + 's';
};

var lexUnits = [];
//var sentences = [];
var sentenceSet = new FastSet(null, function (a, b) {
    return a.fn_id === b.fn_id;
}, function (object) {
    return object.fn_id.toString();
});
var annotationSets = [];
var labels = [];
var patterns = [];
var valenceUnits =[];

var valenceUnitSet = new FastSet(null, function (a, b) {
    return a.FE === b.FE
        && a.PT === b.PT
        && a.GF === b.GF;
}, function (object) {
    var result = object.FE != null ? object.FE.hashCode() : 0;
    result = 31 * result + (object.PT != null ? object.PT.hashCode() : 0);
    result = 31 * result + (object.GF != null ? object.GF.hashCode() : 0);
    return result.toString();
});

function* importAll(jsonixLexUnits, startTime){
    _init(jsonixLexUnits);
    logger.info('Initialization of arrays completed in: '+ duration(startTime));
    logger.info('LexUnits = '+lexUnits.length);
    //logger.info('Sentences = '+sentences.length);
    logger.info('Sentences = '+sentenceSet.length);
    logger.info('AnnotationSets = '+annotationSets.length);
    logger.info('Labels = '+labels.length);
    logger.info('Patterns = '+patterns.length);
    //logger.info('ValenceUnits = '+valenceUnits.length);
    logger.info('ValenceUnits = '+valenceUnitSet.length);


    try{
        var theTime = process.hrtime();
        yield LexUnit.insertMany(lexUnits);
        //Sentence.insertMany(sentences),
        yield Sentence.insertMany(sentenceSet);
        yield Label.insertMany(labels);
        //ValenceUnit.insertMany(valenceUnits),
        yield ValenceUnit.insertMany(valenceUnitSet);
        yield Pattern.insertMany(patterns);
        yield AnnotationSet.insertMany(annotationSets);
        logger.info('Mongo insert collections completed in: '+duration(theTime));
    }catch(err){
        logger.error(err);
    }
    /*
     try{
     var queries = [
     LexUnit.insertMany(lexUnits),
     //Sentence.insertMany(sentences),
     Sentence.insertMany(sentenceSet),
     Label.insertMany(labels),
     //ValenceUnit.insertMany(valenceUnits),
     ValenceUnit.insertMany(valenceUnitSet),
     Pattern.insertMany(patterns),
     AnnotationSet.insertMany(annotationSets)
     ];
     var theTime = process.hrtime();
     yield queries;
     logger.info('Mongo insert collections completed in: '+ duration(theTime));
     }catch(err){
     logger.error(err);
     }*/
}

function _init(jsonixLexUnits){
    jsonixLexUnits.map((jsonixLexUnit) => {
        _initLexUnit(jsonixLexUnit);
    });
}

function _initLexUnit(jsonixLexUnit){
    logger.info('Processing lexUnit with fn_id = '+jsonixLexUnit.value.id+' and name = '+jsonixLexUnit.value.name);
    var lexUnit = new LexUnit({
        fn_id: jsonixLexUnit.value.id,
        name: jsonixLexUnit.value.name,
        pos: jsonixLexUnit.value.pos,
        status: jsonixLexUnit.value.status,
        frame: jsonixLexUnit.value.frame,
        frameId: jsonixLexUnit.value.frameId,
        totalAnnotated: jsonixLexUnit.value.totalAnnotated
    });
    lexUnits.push(lexUnit); // There should not be duplicates
    var annoSetPatternsMap = getPatternsMap(jsonixLexUnit);
    _initSentences(toJsonixSentenceArray(jsonixLexUnit), lexUnit, annoSetPatternsMap);
}

function getPatternsMap(jsonixLexUnit){
    var map = new Map();
    toJsonixPatternArray(jsonixLexUnit).map((jsonixPattern) => {
        var patternVUs = toJsonixValenceUnitArray(jsonixPattern).map((jsonixValenceUnit) => {
            var _valenceUnit = new ValenceUnit({
                FE: jsonixValenceUnit.fe,
                PT: jsonixValenceUnit.pt,
                GF: jsonixValenceUnit.gf
            });

            //var valenceUnit = valenceUnits.findValenceUnit(_valenceUnit);
            var valenceUnit = valenceUnitSet.get(_valenceUnit);

            if(valenceUnit === undefined){
                //valenceUnits.push(_valenceUnit);
                valenceUnitSet.add(_valenceUnit);
                return _valenceUnit;
            }else{
                return valenceUnit;
            }
        });
        var pattern = new Pattern({
            valenceUnits: patternVUs
        });
        patterns.push(pattern);
        toJsonixAnnoSetArray(jsonixPattern).map((jsonixAnnoSet) => {
            if(map.has(jsonixAnnoSet.id)){
                logger.error('AnnoSet already exists');
            }
            map.set(jsonixAnnoSet.id, pattern);
        });
    });
    return map;
}

function _initSentences(jsonixSentences, lexUnit, annoSetPatternsMap){
    jsonixSentences.map((jsonixSentence) => {
        _initSentence(jsonixSentence, lexUnit, annoSetPatternsMap);
    });
}

function _initSentence(jsonixSentence, lexUnit, annoSetPatternsMap){
    var _sentence = new Sentence({
        fn_id: jsonixSentence.id,
        text: jsonixSentence.text
    });
    var sentence = sentenceSet.get(_sentence);
    if(sentence === undefined){
        sentenceSet.add(_sentence);
        _initAnnoSets(toJsonixAnnotationSetArray(jsonixSentence), lexUnit, _sentence, annoSetPatternsMap);
    }else{
        _initAnnoSets(toJsonixAnnotationSetArray(jsonixSentence), lexUnit, sentence, annoSetPatternsMap);
    }

    /*var sentence = sentences.findSentence(_sentence);
     if(sentence === undefined){
     sentences.push(_sentence);
     _initAnnoSets(toJsonixAnnotationSetArray(jsonixSentence), lexUnit, _sentence, annoSetPatternsMap);
     }else{
     _initAnnoSets(toJsonixAnnotationSetArray(jsonixSentence), lexUnit, sentence, annoSetPatternsMap);
     }*/

    /*
     // TODO finish this
     if(sentences.some((sentence) => {return sentence.fn_id === _sentence.fn_id ? sentence})){
     _initAnnoSets(toJsonixAnnotationSetArray(jsonixSentence), lexUnit, sentence, annoSetPatternsMap);
     }else{
     sentences.push(_sentence);
     _initAnnoSets(toJsonixAnnotationSetArray(jsonixSentence), lexUnit, _sentence, annoSetPatternsMap);
     }*/
}

function _initAnnoSets(jsonixAnnoSets, lexUnit, sentence, annoSetPatternsMap){
    jsonixAnnoSets.map((jsonixAnnoSet) => {
        if(isFrameNetSpecific(jsonixAnnoSet)){
            _initAnnoSet(jsonixAnnoSet, lexUnit, sentence, annoSetPatternsMap);
        }
    })
}

function isFrameNetSpecific(jsonixAnnoSet){
    for(let jsonixLayer of toJsonixLayerArray(jsonixAnnoSet)){
        if(frameNetLayers.includes(jsonixLayer.name)){
            return true;
        }
    }
    return false;
}

function _initAnnoSet(jsonixAnnoSet, lexUnit, sentence, annoSetPatternsMap){
    var annoSet = new AnnotationSet({
        fn_id: jsonixAnnoSet.id,
        sentence: sentence,
        lexUnit: lexUnit,
        labels: getLabels(jsonixAnnoSet),
        patterns: annoSetPatternsMap.get(jsonixAnnoSet.id)
    });
    annotationSets.push(annoSet); // there should not be duplicates
}

function getLabels(jsonixAnnoSet){
    // AnnoSet is already filtered: it's already FrameNet-specific (i.e. only FE/PT/GF/Target)
    return toJsonixLayerArray(jsonixAnnoSet).map((jsonixLayer) => {
        return toJsonixLabelArray(jsonixLayer).map((jsonixLabel) => {
            var label = new Label({
                name: jsonixLabel.name,
                type: jsonixLayer.name,
                startPos: jsonixLabel.start,
                endPos: jsonixLabel.end
            });
            labels.push(label); // There will be duplicates but we don't care
            return label;
        });
    }).flatten();
}

if(!String.prototype.hashCode){
    String.prototype.hashCode = function() {
        var hash = 0, i, chr, len;
        if (this.length === 0) return hash;
        for (i = 0, len = this.length; i < len; i++) {
            chr   = this.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };
}

// TODO: remove this?
if(!Array.prototype.findLabel){
    Array.prototype.findLabel = function(label){
        return _.find(this, function(o){
            return o.name === label.name
                && o.type === label.type
                && o.startPos === label.startPos
                && o.endPos === label.endPos;
        });
    };
}

// TODO: remove this?
if(!Array.prototype.findSentence){
    Array.prototype.findSentence = function(sentence){
        return _.find(this, function(o){
            return o.fn_id === sentence.fn_id; //fn_id is a unique identifier (FK of MySQL database table)
        });
    };
}

if(!Array.prototype.findValenceUnit){
    Array.prototype.findValenceUnit = function(valenceUnit){
        return _.find(this, function(o){
            return o.FE === valenceUnit.FE
                && o.PT === valenceUnit.PT
                && o.GF === valenceUnit.GF;
        });
    };
}

function valenceUnitEquals(a, b){
    return a.FE === b.FE && a.PT === b.PT && a.GF === b.GF;
}

function valenceUnitHash(object){
    return object.FE + object.PT + object.GF; //TODO check...
}
//labels.findLabel(label);

function toJsonixSentenceArray(jsonixLexUnit){
    var sentences = [];
    var subCorpusIterator = 0;
    if(jsonixLexUnit.value.hasOwnProperty('subCorpus')){
        while(jsonixLexUnit.value.subCorpus[subCorpusIterator] !== undefined){
            var subCorpus = jsonixLexUnit.value.subCorpus[subCorpusIterator];
            var sentenceIterator = 0;
            if(subCorpus.hasOwnProperty('sentence')){
                while(subCorpus.sentence[sentenceIterator] !== undefined) {
                    var sentence = subCorpus.sentence[sentenceIterator];
                    sentences.push(sentence);
                    sentenceIterator++;
                }
            }
            subCorpusIterator++;
        }
    }
    return sentences;
}

function toJsonixAnnotationSetArray(jsonixSentence){
    var annotationSets = [];
    var annoSetIterator = 0;
    if(jsonixSentence.hasOwnProperty('annotationSet')){
        while(jsonixSentence.annotationSet[annoSetIterator] !== undefined){
            let annotationSet = jsonixSentence.annotationSet[annoSetIterator];
            annotationSets.push(annotationSet);
            annoSetIterator ++;
        }
    }
    return annotationSets;
}

function toJsonixLayerArray(jsonixAnnotationSet){
    var layers = [];
    var layerIterator = 0;
    if(jsonixAnnotationSet.hasOwnProperty('layer')){
        while(jsonixAnnotationSet.layer[layerIterator] !== undefined){
            layers.push(jsonixAnnotationSet.layer[layerIterator]);
            layerIterator++;
        }
    }
    return layers;
}

function toJsonixLabelArray(jsonixLayer){
    var labels = [];
    var labelIterator = 0;
    if(jsonixLayer.hasOwnProperty('label')){
        while(jsonixLayer.label[labelIterator] !== undefined){
            var label = jsonixLayer.label[labelIterator];
            labels.push(label);
            labelIterator++;
        }
    }
    return labels;
}

function toJsonixPatternArray(jsonixLexUnit){
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

function toJsonixValenceUnitArray(jsonixPattern){
    var valenceUnits = [];
    var valenceUnitsIterator = 0;
    if(jsonixPattern.hasOwnProperty('valenceUnit')){
        while(jsonixPattern.valenceUnit[valenceUnitsIterator] !== undefined ){
            valenceUnits.push(jsonixPattern.valenceUnit[valenceUnitsIterator]);
            valenceUnitsIterator++;
        }
    }
    return valenceUnits;
}

function toJsonixAnnoSetArray(jsonixPattern){
    var annotationSets = [];
    var annotationSetIterator = 0;
    if(jsonixPattern.hasOwnProperty('annoSet')){
        while(jsonixPattern.annoSet[annotationSetIterator] !== undefined){
            annotationSets.push(jsonixPattern.annoSet[annotationSetIterator]);
            annotationSetIterator++;
        }
    }
    return annotationSets;
}

module.exports = {
    importAll
};