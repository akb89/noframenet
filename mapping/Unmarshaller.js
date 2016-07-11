'use strict';

const Jsonix = require('jsonix').Jsonix;
const LexUnitSchema = require('./LexUnitSchema').LexUnitSchema;
const FrameSchema = require('./FrameSchema').FrameSchema;
const SentenceSchema = require('./SentenceSchema').SentenceSchema;
const Unmarshaller = new Jsonix.Context([FrameSchema, LexUnitSchema, SentenceSchema]).createUnmarshaller();

module.exports = {
    Unmarshaller: Unmarshaller
};