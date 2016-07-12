'use strict';

const ValenceUnit = require('../model/valenceUnitModel');
const logger = require('../../logger');

function importValenceUnits(jsonixValenceUnits){
    logger.silly('Importing valence units');
    return jsonixValenceUnits.map((jsonixValenceUnit) => {
        return importValenceUnit(jsonixValenceUnit);
    });
}

function* importValenceUnit(jsonixValenceUnit){
    logger.verbose('Importing valence unit FE = '+jsonixValenceUnit.fe+' PT = '+jsonixValenceUnit.pt+' GF = '+jsonixValenceUnit.gf);
    var myValenceUnit = yield findValenceUnitByLabels(jsonixValenceUnit.fe, jsonixValenceUnit.pt, jsonixValenceUnit.gf);
    if(myValenceUnit !== null){
        logger.silly('ValenceUnit already exists in the database.');
        return myValenceUnit
    }
    logger.silly('ValenceUnit not in database. Creating new entry.');
    myValenceUnit = new ValenceUnit({
        FE: jsonixValenceUnit.fe,
        PT: jsonixValenceUnit.pt,
        GF: jsonixValenceUnit.gf
    });
    return myValenceUnit.save();
}

function findValenceUnitByLabels(feLabel, ptLabel, gfLabel){
    return ValenceUnit.findByLabels(feLabel, ptLabel, gfLabel);
}

module.exports = {
    importValenceUnits,
    importValenceUnit,
    findValenceUnitByLabels
};