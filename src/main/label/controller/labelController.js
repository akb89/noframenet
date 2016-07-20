'use strict';

const Label = require('../model/labelModel');
const logger = require('../../logger');
require('../../utils'); // for .flatten()

function* importLabelsFromLayers(jsonixLayers){
    logger.verbose('Importing layers and labels');
    var labels = yield importLayers(jsonixLayers);
    return labels.flatten();
}

function* importLayers(jsonixLayers){
    var layers = [];
    for(let jsonixLayer of jsonixLayers){
        var layer = yield importLayer(jsonixLayer);
        layers.push(layer);
    }
    return layers;
    /*
    return jsonixLayers.map((jsonixLayer) => {
        return importLayer(jsonixLayer); // Layer name is needed to fill in Label.type.
    });*/
}

function* importLayer(jsonixLayer){
    logger.verbose('Importing all labels from layer with name = '+jsonixLayer.name);
    var myLabelArray = yield importLabels(jsonixLayer);
    return myLabelArray;
}

// Array calling generator functions
function* importLabels(jsonixLayer){
    var labels = [];
    var jsonixLabels = toJsonixLabelArray(jsonixLayer);
    for(let jsonixLabel of jsonixLabels){
        var label = yield importLabel(jsonixLabel, jsonixLayer);
        labels.push(label);
    }
    return labels;
    /*
    return toJsonixLabelArray(jsonixLayer).map((jsonixLabel) => {
        return importLabel(jsonixLabel, jsonixLayer);
    });*/
}

function* importLabel(jsonixLabel, jsonixLayer){
    var myLabel = new Label({
        name: jsonixLabel.name,
        type: jsonixLayer.name,
        startPos: jsonixLabel.start,
        endPos: jsonixLabel.end
    });
    var dbLabel = yield findLabel(myLabel);
    if(dbLabel !== null){
        logger.silly('Label already exists in the database');
        return dbLabel;
    }
    logger.silly('Label not in database. Creating new entry.');
    return myLabel.save();
}

function findLabel(label){
    return Label.findLabel(label.name, label.type, label.startPos, label.endPos);
}

function toJsonixLabelArray(jsonixLayer){
    logger.verbose('Getting all labels from jsonixLayer');
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
    importLayer,
    importLabels,
    importLabel,
    findLabel,
    toJsonixLabelArray
};
