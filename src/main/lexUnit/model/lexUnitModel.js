'use strict';

const mongoose = require('mongoose');

var lexUnitSchema = mongoose.Schema({
    fn_id: {type: Number},
    name: {type: String},
    sentences: [{type: mongoose.Schema.Types.ObjectId, ref: 'Sentence'}]
});

var LexUnit = mongoose.model('LexUnit', lexUnitSchema);

module.exports = LexUnit;