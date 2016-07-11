'use strict';

const logger = require('../src/main/logger');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const InconsistentDataException = require('../exception/valencerException').InconsistentDataException;
const InvalidArgumentException = require('../exception/valencerException').InvalidArgumentException;

const AnnotationSet = require('../src/main/annotationSet/model/annotationSetModel');
const Label = require('../src/main/label/model/labelModel');
const LexUnit = require('../src/main/lexUnit/model/lexUnitModel');
const Pattern = require('../src/main/pattern/model/patternModel');
const Sentence = require('../src/main/sentence/model/sentenceModel');
const ValenceUnit = require('../src/main/valenceUnit/model/valenceUnitModel');

const annoSetController = require('../src/main/annotationSet/controller/annotationSetController');
const lexUnitController = require('../src/main/lexUnit/controller/lexUnitController');
const labelController = require('../src/main/label/controller/labelController');
const patternController = require('../src/main/pattern/controller/patternController');
const sentenceController = require('../src/main/sentence/controller/sentenceController');
const valenceUnitController = require('../src/main/valenceUnit/controller/valenceUnitController');

const utils = require('../src/main/utils');