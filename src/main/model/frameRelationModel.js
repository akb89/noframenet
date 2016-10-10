'use strict';

import mongoose from 'mongoose';
import bluebird from 'bluebird';

mongoose.Promise = bluebird;

var frameRelationSchema = mongoose.Schema({
    type: {type: String},
    frames: [{type: Number, ref: 'Frame'}]
});

export default mongoose.model('FrameRelation', frameRelationSchema);