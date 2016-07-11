'use strict';

const ValenceUnit = require('../model/valenceUnitModel');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException
const logger = require('../../logger');

function importValenceUnits(jsonixValenceUnits){
    logger.silly('Importing valence units');
    return jsonixValenceUnits.map((jsonixValenceUnit) => {
        return importValenceUnit(jsonixValenceUnit);
    });
}

function* importValenceUnit(jsonixValenceUnit){
    if(!jsonixValenceUnit){
        throw new InvalidArgumentException('Cannot import valence unit. Input jsonixValenceUnit is null or undefined.');
    }
    logger.verbose('Importing valence unit FE = '+jsonixValenceUnit.fe+' PT = '+jsonixValenceUnit.pt+' GF = '+jsonixValenceUnit.gf);
    try{
        var myValenceUnit = yield toValenceUnit(jsonixValenceUnit);
        return myValenceUnit;
    }catch(err){
        logger.error(err);
    }
}

function* toValenceUnit(jsonixValenceUnit){
    var myValenceUnit = yield toValenceUnitPromise(jsonixValenceUnit);
    if(myValenceUnit !== null){
        logger.silly('ValenceUnit already exists in the database.');
        return myValenceUnit
    }else{
        logger.silly('ValenceUnit not in database. Creating new entry.');
        myValenceUnit = new ValenceUnit({
            FE: jsonixValenceUnit.fe,
            PT: jsonixValenceUnit.pt,
            GF: jsonixValenceUnit.gf
        });
        try{
            yield myValenceUnit.save();
            return myValenceUnit
        }catch(err){
            logger.error(err);
        }
    }
}

function toValenceUnitPromise(jsonixValenceUnit){
    return ValenceUnit.findOne().where('FE').equals(jsonixValenceUnit.fe).where('PT').equals(jsonixValenceUnit.pt).where('GF').equals(jsonixValenceUnit.gf);
}

module.exports = {
    importValenceUnits,
    importValenceUnit,
    toValenceUnit,
    toValenceUnitPromise
};