'use strict';

import mongoose from 'mongoose';
import bluebird from 'bluebird';

mongoose.Promise = bluebird;

var semTypeModelSchema = mongoose.Schema({
    _id: {type: Number, unique: true},
    name: {type: String}
});

export default mongoose.model('SemType', semTypeModelSchema);