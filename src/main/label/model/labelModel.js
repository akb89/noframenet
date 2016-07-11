'use strict';

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var labelSchema = mongoose.Schema({
    name:  {type: String, index:true}, // TODO : add fn_id for FE?
    type:  {type: String},
    startPos:   {type: Number},
    endPos:     {type: Number}
});

labelSchema.index({name: 1, type: 1, startPos: 1, endPos: 1}, {unique: true});

labelSchema.static('findLabel', function (label){
    return Label.findOne().where('name').equals(label.name).where('type').equals(label.type).where('startPos').equals(label.startPos).where('endPos').equals(label.endPos);
});


var Label = mongoose.model('Label', labelSchema);

module.exports = Label;