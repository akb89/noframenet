'use strict';

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var annoSetSchema = mongoose.Schema({
    fn_id: {type: Number},
    lexUnit: {type: mongoose.Schema.Types.ObjectId, ref: 'LexUnit'},
    sentence: {type: mongoose.Schema.Types.ObjectId, ref: 'Sentence'}, // TODO: add only if annoSets removed in Sentence
    pattern: {type: mongoose.Schema.Types.ObjectId, ref: 'Pattern'},
    labels: [{type: mongoose.Schema.Types.ObjectId, ref: 'Label'}]
});

annoSetSchema.index({fn_id: 1}, {unique: true});

annoSetSchema.static('findByFNId', function(fnId){
   return AnnotationSet.findOne().where('fn_id').equals(fnId);
});

annoSetSchema.query.byFnId = ((fn_id) => {
    return AnnotationSet.findOne().where('fn_id').equals(fn_id);
});

var AnnotationSet = mongoose.model('AnnotationSet', annoSetSchema);

module.exports = AnnotationSet;