'use strict';

const AnnotationSet = require('../../annotationSet/model/annotationSetModel');
const Pattern = require('../model/patternModel');
const valenceUnitController = require('../../valenceUnit/controller/valenceUnitController');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException
const logger = require('../../logger');
require('../../utils');

function importPatterns(jsonixPatterns){
    logger.verbose('Importing patterns');
    return jsonixPatterns.map((jsonixPattern) => {
        return importPattern(jsonixPattern);
    });
}

function* importPattern(jsonixPattern){
    if(!jsonixPattern){
        throw new InvalidArgumentException('Cannot import Pattern. Input jsonixPattern is null or undefined.');
    }
    logger.silly('Importing Pattern');
    var valenceUnits = yield valenceUnitController.importValenceUnits(toJsonixValenceUnitArray(jsonixPattern));
    var myPattern = yield findPatternByValenceUnits(valenceUnits);
    var patternAnnoSets = yield findAnnotationSets(toJsonixAnnoSetArray(jsonixPattern));
    var savedPattern = yield _importPattern(myPattern, patternAnnoSets, valenceUnits);
    return savedPattern;
}

function* _importPattern(myPattern, patternAnnoSets, valenceUnits){
    if(patternAnnoSets.includes(null)){
        throw new Error('Pattern contains AnnotationSet references not in the database.');
    }
    if(myPattern !== null){
        logger.silly('Pattern already exists in database. Updating annotationSets references.');
        myPattern.annotationSets = mergeAnnotationSets(myPattern.annotationSets, patternAnnoSets);
    }else{
        logger.silly('Pattern does not exist in database. Creating new entry.');
        myPattern = new Pattern();
        myPattern.annotationSets = patternAnnoSets;
    }
    try{
        myPattern.valenceUnits = valenceUnits;
        yield myPattern.save();
        return myPattern;
    }catch(err){
        logger.error(err);
    }
}

function findAnnotationSets(jsonixAnnotationSets){
    return jsonixAnnotationSets.map((jsonixAnnotationSet) => {
        return AnnotationSet.findByFNId(jsonixAnnotationSet.id);
    });
} 

function findPatternByValenceUnits(valenceUnits){
    return Pattern.findByValenceUnits(valenceUnits);
}

function mergeAnnotationSets(annoSetArray1, annoSetArray2){
    return annoSetArray1.merge(annoSetArray2).sort();
}

function toJsonixAnnoSetArray(jsonixPattern){
    if(!jsonixPattern){
        throw new InvalidArgumentException('Cannot get annotationSets. Input jsonixPattern is null or undefined.');
    }
    try{
        var annotationSets = [];
        var annotationSetIterator = 0;
        if(jsonixPattern.hasOwnProperty('annoSet')){
            while(jsonixPattern.annoSet[annotationSetIterator] !== undefined){
                annotationSets.push(jsonixPattern.annoSet[annotationSetIterator]);
                annotationSetIterator++;
            }
        }
        return annotationSets;
    }catch(err){
        logger.error(err);
    }
}

function toJsonixValenceUnitArray(jsonixPattern){
    if(!jsonixPattern){
        throw new InvalidArgumentException('Cannot get valence units. Input jsonixPattern is null or undefined.');
    }
    try{
        var valenceUnits = [];
        var valenceUnitsIterator = 0;
        if(jsonixPattern.hasOwnProperty('valenceUnit')){
            while(jsonixPattern.valenceUnit[valenceUnitsIterator] !== undefined ){
                valenceUnits.push(jsonixPattern.valenceUnit[valenceUnitsIterator]);
                valenceUnitsIterator++;
            }
        }
        return valenceUnits;
    }catch(err){
        logger.error(err);
    }
}

module.exports = {
    importPatterns,
    importPattern,
    _importPattern,
    findPatternByValenceUnits,
    mergeAnnotationSets,
    findAnnotationSets,
    toJsonixAnnoSetArray,
    toJsonixValenceUnitArray
};