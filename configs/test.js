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

const unmarshaller = require('../mappings/Unmarshaller').Unmarshaller;

const PropertiesReader = require('properties-reader');
const properties = PropertiesReader('properties.ini');
const testResourcesDir = properties.get('test.resources.directory');
const testLexUnitXmlDir = properties.get('test.resources.lexUnits.directory');
const testSentenceXmlDir = properties.get('test.resources.sentences.directory');

const path = require('path');

const fs = require('graceful-fs');

const annotationSet = require('../src/main/annotationSet/model/annotationSetModel');
const annotationSetController = require('../src/main/annotationSet/controller/annotationSetController');
const sentenceController = require('../src/main/sentence/controller/sentenceController');

module.exports = {
    logger: logger,
    mongoose: mongoose,
    mockgoose: mockgoose,
    mochagen: mochagen,
    chai: chai,
    sinon: sinon,
    should: should,
    unmarshaller: unmarshaller,
    annotationSet: annotationSet,
    annotationSetController: annotationSetController,
    sentenceController: sentenceController,
    testResourcesDir: testResourcesDir,
    testLexUnitXmlDir: testLexUnitXmlDir,
    testSentenceXmlDir: testSentenceXmlDir,
    path: path,
    fs: fs
};