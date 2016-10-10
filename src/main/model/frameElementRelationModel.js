'use strict';

import mongoose from 'mongoose';
import bluebird from 'bluebird';

mongoose.Promise = bluebird;

var frameElementRelationSchema = mongoose.Schema({
    type: {type: String},
    frameElements: [{type: Number, ref: 'FrameElement'}]
});

export default mongoose.model('FERelation', frameElementRelationSchema);