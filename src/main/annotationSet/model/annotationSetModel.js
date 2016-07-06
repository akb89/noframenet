'use strict';

const mongoose = require('mongoose');

var AnnoSetSchema = mongoose.Schema({
    fn_id: {type: Number},
    pattern: {type: mongoose.Schema.Types.ObjectId, ref: 'Pattern'},
    labels: [{type: mongoose.Schema.Types.ObjectId, ref: 'Label'}]
});

AnnoSetSchema.index({fn_id: 1}, {unique: true});

AnnoSetSchema.static('findByFnId', function(fnId){
   return AnnotationSet.findOne().where('fn_id').equals(fnId);
});

var AnnotationSet = mongoose.model('AnnotationSet', AnnoSetSchema);

module.exports = AnnotationSet;