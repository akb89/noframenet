'use strict';

const Label = require('../model/labelModel');
const logger = require('../../logger');
require('../../utils'); // for .flatten()

function* importLabelsFromLayers(jsonixLayers){
    //TODO: cleanup this function. Return is not pretty
    try{
        var labels = yield Label.insertMany(importLayers(jsonixLayers).flatten());
        logger.verbose('Batch insert of labels: '+labels);
        return labels;
    }catch(err){
        logger.error(err);
    }
}

function importLayers(jsonixLayers){
    return jsonixLayers.map((jsonixLayer) => {
        return importLabels(jsonixLayer); // Layer name is needed to fill in Label.type.
    });
}

function importLabels(jsonixLayer){
    return toJsonixLabelArray(jsonixLayer).map((jsonixLabel) => {
        return importLabel(jsonixLabel, jsonixLayer);
    });
}

function importLabel(jsonixLabel, jsonixLayer){
    return new Label({
        name: jsonixLabel.name,
        type: jsonixLayer.name,
        startPos: jsonixLabel.start,
        endPos: jsonixLabel.end
    });
}

function* _importLabel(jsonixLabel, jsonixLayer){
    var myLabel = new Label({
        name: jsonixLabel.name,
        type: jsonixLayer.name,
        startPos: jsonixLabel.start,
        endPos: jsonixLabel.end
    });
    var dbLabel = yield findLabel(myLabel);
    if(dbLabel !== null){
        logger.silly('Label name = '+jsonixLabel.name+' type = '+jsonixLayer.name+' startPos = '+jsonixLabel.start+' endPos = '+jsonixLabel.end+' already in database');
        return dbLabel;
    }
    logger.silly('Label name = '+jsonixLabel.name+' type = '+jsonixLayer.name+' startPos = '+jsonixLabel.start+' endPos = '+jsonixLabel.end+' not in database.' +
    ' Creating new entry.');
    try{
        yield myLabel.save();
    }catch(err){
        //logger.error(err);
        logger.silly('Label name = '+jsonixLabel.name+' type = '+jsonixLayer.name+' startPos = '+jsonixLabel.start+' endPos = '+jsonixLabel.end+' was inserted to database during import process. Starting label import once again.');
        yield importLabel(jsonixLabel, jsonixLayer);
    }
    return myLabel;
}

function findLabel(label){
    return Label.findLabel(label.name, label.type, label.startPos, label.endPos);
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

module.exports = {
    importLabelsFromLayers,
    importLayers,
    importLabels,
    importLabel,
    findLabel,
    toJsonixLabelArray
};
