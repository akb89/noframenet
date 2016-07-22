'use strict';

const AnnotationSet = require('../../annotationSet/model/annotationSetModel');
const Pattern = require('../model/patternModel');
const annoSetController = require('../../annotationSet/controller/annotationSetController');
const valenceUnitController = require('../../valenceUnit/controller/valenceUnitController');
const logger = require('../../logger');
require('../../utils');

function importPatterns(jsonixPatterns){
    return jsonixPatterns.map((jsonixPattern) => {
        return importPattern(jsonixPattern);
    });
}

function* importPattern(jsonixPattern){
    var valenceUnits = yield valenceUnitController.importValenceUnits(toJsonixValenceUnitArray(jsonixPattern));
    var myPattern = new Pattern();
    myPattern.valenceUnits = valenceUnits.sort(); //TODO: remove sort?
    logger.verbose('Inserting pattern: '+valenceUnits);
    try{
        yield myPattern.save();
        try{
            var patternAnnoSets = yield findAnnotationSets(toJsonixAnnoSetArray(jsonixPattern));
            yield annoSetController.updatePatternReferences(patternAnnoSets, myPattern);
        }catch(err){
            logger.error(err);
        }
    }catch(err){
        logger.error(err);
    }
    return myPattern;
}

function* _importPattern(jsonixPattern){
    var valenceUnits = yield valenceUnitController.importValenceUnits(toJsonixValenceUnitArray(jsonixPattern));
    //logger.silly('Importing Pattern: '+valenceUnits);
    var myPattern = yield findPatternByValenceUnits(valenceUnits);
    var patternAnnoSets = yield findAnnotationSets(toJsonixAnnoSetArray(jsonixPattern));
    if(myPattern !== null){
        logger.verbose('Pattern: '+valenceUnits+' already in database. Updating annotationSets references');
        try{
            yield annoSetController.updatePatternReferences(patternAnnoSets, myPattern);
        }catch(err){
            logger.error(err);
        }
        return myPattern;
    }
    logger.verbose('Pattern: '+valenceUnits+' not in database. Creating new entry.');
    myPattern = new Pattern();
    myPattern.valenceUnits = valenceUnits.sort();
    try{
        yield myPattern.save(); //FIXME validation!!
        try{
            yield annoSetController.updatePatternReferences(patternAnnoSets, myPattern);
        }catch(err){
            logger.error(err);
        }
    }catch(err){
        logger.verbose('Pattern: '+valenceUnits+' was inserted to database during import process. Starting' +
            ' importPattern over again.');
        yield importPattern(jsonixPattern); //FIXME
    }
    return myPattern;
}

function findAnnotationSets(jsonixAnnotationSets){
    return jsonixAnnotationSets.map((jsonixAnnotationSet) => {
        return AnnotationSet.findByFNId(jsonixAnnotationSet.id);
    });
}

function findPatternByValenceUnits(valenceUnits){
    return Pattern.findByValenceUnits(valenceUnits);
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

module.exports = {
    importPatterns,
    importPattern,
    findPatternByValenceUnits,
    findAnnotationSets,
    toJsonixAnnoSetArray,
    toJsonixValenceUnitArray
};