'use strict';

import mongoose from 'mongoose';
import bluebird from 'bluebird';

mongoose.Promise = bluebird;

var frameElementRelationSchema = mongoose.Schema({
    type: {type: String, index: true},
    frameElements: [{type: Number, ref: 'FrameElement'}]
});

frameElementRelationSchema.index({frameElements: 1});

export default mongoose.model('FERelation', frameElementRelationSchema);