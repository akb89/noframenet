'use strict';

const ValenceUnit = require('../model/valenceUnitModel');
const logger = require('../../logger');

function importValenceUnits(jsonixValenceUnits){
<<<<<<< HEAD
=======
    //logger.silly('Importing valence units');
    /*var valenceUnits = [];
    for(let jsonixValenceUnit of jsonixValenceUnits){
        var valenceUnit = yield importValenceUnit(jsonixValenceUnit);
        valenceUnits.push(valenceUnit);
    }
    return valenceUnits;*/

>>>>>>> 5e06e03b4ffc4606f99c2fc27823d02587314a5b
    return jsonixValenceUnits.map((jsonixValenceUnit) => {
        return importValenceUnit(jsonixValenceUnit);
    });
}

function* importValenceUnit(jsonixValenceUnit){
    //logger.verbose('Importing valence unit FE = '+jsonixValenceUnit.fe+' PT = '+jsonixValenceUnit.pt+' GF =
    // '+jsonixValenceUnit.gf);
    var myValenceUnit = yield findValenceUnitByLabels(jsonixValenceUnit.fe, jsonixValenceUnit.pt, jsonixValenceUnit.gf);
    if(myValenceUnit !== null){
        logger.verbose('ValenceUnit FE.PT.GF = '+jsonixValenceUnit.fe+'.'+jsonixValenceUnit.pt+'.'+jsonixValenceUnit.gf+ ' already in database.');
        return myValenceUnit
    }
    logger.verbose('ValenceUnit FE.PT.GF = '+jsonixValenceUnit.fe+'.'+jsonixValenceUnit.pt+'.'+jsonixValenceUnit.gf+' not in database. Creating new entry.');
    myValenceUnit = new ValenceUnit({
        FE: jsonixValenceUnit.fe,
        PT: jsonixValenceUnit.pt,
        GF: jsonixValenceUnit.gf
    });
    try{
        yield myValenceUnit.save();
    }catch(err){
        logger.verbose('ValenceUnit FE.PT.GF = '+jsonixValenceUnit.fe+'.'+jsonixValenceUnit.pt+'.'+jsonixValenceUnit.gf+' was inserted to database during import process. Starting importValenceUnit over again.');
        yield importValenceUnit(jsonixValenceUnit); //FIXME
    }
    return myValenceUnit;
}

function findValenceUnitByLabels(feLabel, ptLabel, gfLabel){
    return ValenceUnit.findByLabels(feLabel, ptLabel, gfLabel);
}

module.exports = {
    importValenceUnits,
    importValenceUnit,
    findValenceUnitByLabels
};