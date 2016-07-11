'use strict';

const Label = require('../model/labelModel');
const InvalidArgumentException = require('../../../../exception/valencerException').InvalidArgumentException
const logger = require('../../logger');
require('../../utils');

function* importLabels(jsonixLayers){
    logger.info('Importing layers and labels');
    var labels = yield importLayers(jsonixLayers);
    return labels.flatten();
}

function importLayers(jsonixLayers){
    return jsonixLayers.map((jsonixLayer) => {
        try{
            return importLayer(jsonixLayer); // Layer name is needed to fill in Label.type.
        }catch(err){
            logger.error(err);
        }
    });
}

function* importLayer(jsonixLayer){
    if(!jsonixLayer){
        throw new InvalidArgumentException('Cannot import layers and labels. Input is null or undefined.');
    }
    logger.verbose('Importing all labels from layer with name = '+jsonixLayer.name);
    try{
        var myLabelArray = yield toLabelArray(jsonixLayer);
    }catch(err){
        logger.error(err);
    }
    return myLabelArray;
}

// Array calling generator functions
function toLabelArray(jsonixLayer){
    if(!jsonixLayer){
        throw new InvalidArgumentException('Cannot convert to LabelArray. Input jsonixLayer is null of undefined.');
    }else{
        var jsonixLabelArray = toJsonixLabelArray(jsonixLayer);
        if(!jsonixLabelArray){
            throw new InvalidArgumentException('Cannot convert to LabelArray. JsonixLabelArray is null or undefined.');
        }else{
            return jsonixLabelArray.map((jsonixLabel) => {
                try{
                    return toLabel(jsonixLabel, jsonixLayer);
                }catch(err){
                    logger.error(err);
                }
            });
        }
    }
}

function* toLabel(jsonixLabel, jsonixLayer){
    if(!jsonixLabel || !jsonixLayer){
        throw new InvalidArgumentException('Cannot convert to Label. Input jsonixLabel or jsonixLayer is' +
            ' null or undefined');
    }
    var myLabel = new Label({
        name: jsonixLabel.name, 
        type: jsonixLayer.name, 
        startPos: jsonixLabel.start, 
        endPos: jsonixLabel.end
    });
    var dbLabel = yield toLabelPromise(myLabel);
    if(dbLabel !== null){
        logger.silly('Label alredy exists in the database');
    }else{
        logger.silly('Label not in database. Creating new entry.');
        dbLabel = myLabel;
        try{
            yield save(dbLabel); // For testing with sinonjs
        }catch (err){
            logger.error(err);
        }
    }
    return dbLabel;
}

function save(label){
    return label.save();
}

function toLabelPromise(label){
    return Label.findLabel(label);
}

function toJsonixLabelArray(jsonixLayer){
    if(!jsonixLayer){
        throw new InvalidArgumentException('Cannot get labels. Input jsonixLayer is null or undefined.');
    }
    logger.verbose('Getting all labels from jsonixLayer');
    var labels = [];
    try{
        var labelIterator = 0;
        if(jsonixLayer.hasOwnProperty('label')){
            while(jsonixLayer.label[labelIterator] !== undefined){
                var label = jsonixLayer.label[labelIterator];
                labels.push(label);
                labelIterator++;
            }
        }
    }catch(err){
        logger.error(err);
    }
    return labels;
}

module.exports = {
    importLabels,
    importLayers,
    importLayer,
    toLabelArray,
    toLabel,
    toJsonixLabelArray
};
