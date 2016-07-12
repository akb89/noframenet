'use strict';

const logger = require('../src/main/logger');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const mockgoose = require('mockgoose');

const mochagen = require('mocha-generators');

const sinon = require('sinon-es6');
const sinonChai = require("sinon-chai");
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);

const should = chai.should();
const expect = chai.expect;

const unmarshaller = require('../mapping/Unmarshaller').Unmarshaller;

const InvalidArgumentException = require('../exception/valencerException').InvalidArgumentException;

const PropertiesReader = require('properties-reader');
const properties = PropertiesReader('properties.ini');
const testResourcesDir = properties.get('test.resources.directory');
const testLexUnitXmlDir = properties.get('test.resources.lexUnits.directory');
const testSentenceXmlDir = properties.get('test.resources.sentences.directory');

const path = require('path');

const fs = require('graceful-fs');

const AnnotationSet = require('../src/main/annotationSet/model/annotationSetModel');
const ValenceUnit = require('../src/main/valenceUnit/model/valenceUnitModel');
const Pattern = require('../src/main/pattern/model/patternModel');

const annoSetController = require('../src/main/annotationSet/controller/annotationSetController');
const lexUnitController = require('../src/main/lexUnit/controller/lexUnitController');
const labelController = require('../src/main/label/controller/labelController');
const patternController = require('../src/main/pattern/controller/patternController');
const sentenceController = require('../src/main/sentence/controller/sentenceController');
const valenceUnitController = require('../src/main/valenceUnit/controller/valenceUnitController');

module.exports = {
    logger,
    mongoose,
    mockgoose,
    mochagen,
    chai,
    sinon,
    should,
    expect,
    InvalidArgumentException,
    unmarshaller,
    AnnotationSet,
    Pattern,
    ValenceUnit,
    annoSetController,
    lexUnitController,
    patternController,
    sentenceController,
    valenceUnitController,
    labelController,
    testResourcesDir,
    testLexUnitXmlDir,
    testSentenceXmlDir,
    path,
    fs
};