'use strict';

const Label = require('../model/labelModel');
const logger = require('../../logger');
require('../../utils'); // for .flatten()

function* importLabelsFromLayers(jsonixLayers){
<<<<<<< HEAD
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
=======
    //logger.verbose('Importing layers and labels');
    var labels = yield importLayers(jsonixLayers);
    return labels.flatten();
}

function importLayers(jsonixLayers){
    /*
    var layers = [];
    for(let jsonixLayer of jsonixLayers){
        var layer = yield importLayer(jsonixLayer);
        layers.push(layer);
    }
    return layers;*/

    return jsonixLayers.map((jsonixLayer) => {
        return importLayer(jsonixLayer); // Layer name is needed to fill in Label.type.
    });
}

function* importLayer(jsonixLayer){
    //logger.verbose('Importing all labels from layer with name = '+jsonixLayer.name);
    var myLabelArray = yield importLabels(jsonixLayer);
    return myLabelArray;
}

// Array calling generator functions
function importLabels(jsonixLayer){
    /*var labels = [];
    var jsonixLabels = toJsonixLabelArray(jsonixLayer);
    for(let jsonixLabel of jsonixLabels){
        var label = yield importLabel(jsonixLabel, jsonixLayer);
        labels.push(label);
    }
    return labels;*/

>>>>>>> 5e06e03b4ffc4606f99c2fc27823d02587314a5b
    return toJsonixLabelArray(jsonixLayer).map((jsonixLabel) => {
        return importLabel(jsonixLabel, jsonixLayer);
    });
}

<<<<<<< HEAD
function importLabel(jsonixLabel, jsonixLayer){
    return new Label({
        name: jsonixLabel.name,
        type: jsonixLayer.name,
        startPos: jsonixLabel.start,
        endPos: jsonixLabel.end
    });
}

function* _importLabel(jsonixLabel, jsonixLayer){
=======
// TODO: check this: revised version once removed unique index. This should speed up the import process
function* importLabel(jsonixLabel, jsonixLayer){
>>>>>>> 5e06e03b4ffc4606f99c2fc27823d02587314a5b
    var myLabel = new Label({
        name: jsonixLabel.name,
        type: jsonixLayer.name,
        startPos: jsonixLabel.start,
        endPos: jsonixLabel.end
    });
    logger.silly('Inserting label with name = '+jsonixLabel.name+' type = '+jsonixLayer.name+' startPos = '+jsonixLabel.start+' endPos = '+jsonixLabel.end);
    try{
        yield myLabel.save();
    }catch(err){
        logger.error(err);
        //logger.silly('Label name = '+jsonixLabel.name+' type = '+jsonixLayer.name+' startPos =
        // '+jsonixLabel.start+' endPos = '+jsonixLabel.end+' was inserted to database during import process. Starting label import once again.');
        //yield importLabel(jsonixLabel, jsonixLayer);
    }
    return myLabel;
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
<<<<<<< HEAD
        ' Creating new entry.');
=======
    ' Creating new entry.');
>>>>>>> 5e06e03b4ffc4606f99c2fc27823d02587314a5b
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
<<<<<<< HEAD
=======
    //logger.verbose('Getting all labels from jsonixLayer');
>>>>>>> 5e06e03b4ffc4606f99c2fc27823d02587314a5b
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
