'use strict';

import mongoose from 'mongoose';
import bluebird from 'bluebird';

mongoose.Promise = bluebird;

var lexUnitSchema = mongoose.Schema({
    _id: {type: Number, unique: true},
    name: {type: String, index: true},
    pos: {type: String},
    definition: {type: String},
    frame: {type: Number, ref: 'Frame'},
    status: {type: String},
    totalAnnotated: {type: Number},
    lemma_id: {type: Number},
    lexemes: [{type: mongoose.Schema.Types.ObjectId, ref: 'Lexeme'}],
    semTypes: [{type: Number, ref: 'SemType'}]
});

export default mongoose.model('LexUnit', lexUnitSchema);