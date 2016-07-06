'use strict';

const mongoose = require('mongoose');

var SentenceSchema = mongoose.Schema({
    fn_id: {type: Number},
    text: {type: String},
    annotationSets: [{type: mongoose.Schema.Types.ObjectId, ref: 'AnnotationSet'}]
});

SentenceSchema.index({fn_id: 1}, {unique: true});

SentenceSchema.static('findByFNId', function(fnId){
    return this.findOne().where('fn_id').equals(fnId);
});

var Sentence = mongoose.model('Sentence', SentenceSchema);

module.exports = Sentence;