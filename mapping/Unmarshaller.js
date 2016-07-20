'use strict';

const Jsonix = require('jsonix').Jsonix;
//const Jsonix = require('./Jsonix').Jsonix;
const filesystem = require('graceful-fs');
const LexUnitSchema = require('./LexUnitSchema').LexUnitSchema;
const FrameSchema = require('./FrameSchema').FrameSchema;
const SentenceSchema = require('./SentenceSchema').SentenceSchema;
const Unmarshaller = new Jsonix.Context([FrameSchema, LexUnitSchema, SentenceSchema]).createUnmarshaller();

module.exports = {
    Unmarshaller: Unmarshaller
};