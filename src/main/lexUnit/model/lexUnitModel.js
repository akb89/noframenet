'use strict';

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var lexUnitSchema = mongoose.Schema({
    fn_id: {type: Number},
    name: {type: String},
    pos: {type: String},
    status: {type: String},
    frame: {type: String},
    frameId: {type: Number},
    totalAnnotated: {type: Number}
});

lexUnitSchema.index({fn_id: 1}, {unique: true});

lexUnitSchema.static('findByFNId', function(fnId){
    return this.findOne().where('fn_id').equals(fnId);
});

var LexUnit = mongoose.model('LexUnit', lexUnitSchema);

module.exports = LexUnit;