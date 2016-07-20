'use strict';

const AnnotationSet = require('../../annotationSet/model/annotationSetModel');
const Pattern = require('../model/patternModel');
const annoSetController = require('../../annotationSet/controller/annotationSetController');
const valenceUnitController = require('../../valenceUnit/controller/valenceUnitController');
const logger = require('../../logger');
require('../../utils');

function importPatterns(jsonixPatterns){
    logger.verbose('Importing patterns');
    /*var patterns = [];
    for(let jsonixPattern of jsonixPatterns){
        var pattern = yield importPattern(jsonixPattern);
        patterns.push(pattern);
    }
    return patterns;*/
    return jsonixPatterns.map((jsonixPattern) => {
        return importPattern(jsonixPattern);
    });
}
//FIXME
function* importPattern(jsonixPattern){
    logger.silly('Importing Pattern');
    var valenceUnits = yield valenceUnitController.importValenceUnits(toJsonixValenceUnitArray(jsonixPattern));
    var myPattern = yield findPatternByValenceUnits(valenceUnits);
    //var patternAnnoSets = yield findAnnotationSets(toJsonixAnnoSetArray(jsonixPattern));
    if(myPattern !== null){
        logger.silly('Pattern already exists in database. Updating annotationSets references');
        //yield annoSetController.updatePatternReferences(patternAnnoSets, myPattern);
        return myPattern;
    }
    logger.silly('Pattern does not exist in database. Creating new entry.');
    myPattern = new Pattern();
    myPattern.valenceUnits = valenceUnits.sort();
    //yield annoSetController.updatePatternReferences(patternAnnoSets, myPattern);
    console.log('test');
    return myPattern.save();
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