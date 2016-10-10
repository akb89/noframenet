'use strict';

import mongoose from 'mongoose';
import bluebird from 'bluebird';

mongoose.Promise = bluebird;

var documentSchema = mongoose.Schema({
    _id: {type: Number, unique: true},
    name: {type: String},
    description: {type: String},
    sentences: [{type: Number, ref: 'Sentence'}]
});

export default mongoose.model('Document', documentSchema);