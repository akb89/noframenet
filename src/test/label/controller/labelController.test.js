'use strict';

const config = require('../../../../config/test');

const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const unmarshaller = config.unmarshaller;

const annoSetController = config.annoSetController;
const labelController = config.labelController;
const lexUnitController = config.lexUnitController;
const sentenceController = config.sentenceController;

const InvalidArgumentException = config.InvalidArgumentException;

const lexUnitXmlPath = config.path.join(config.testLexUnitXmlDir, 'lu9080.xml');

var lexUnitPromise = new Promise((resolve, reject) => {
    try{
        unmarshaller.unmarshalFile(lexUnitXmlPath, (unmarshalledFile) => {
            return resolve(unmarshalledFile);
        });
    }catch(err){
        return reject(err);
    }
});

var jsonixLexUnit;
var jsonixSentenceArray;
var jsonixAnnotationSetArray_0;
var jsonixLayerArray_0_0;
var jsonixLayerArray_0_1;
var jsonixLabelArray_0_1_0;

describe('labelController', () => {
    before(function*(done){
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonixLexUnit = yield lexUnitPromise;
        jsonixSentenceArray = lexUnitController.toJsonixSentenceArray(
            jsonixLexUnit
        );
        jsonixAnnotationSetArray_0 = sentenceController.toJsonixAnnoSetArray(
            jsonixSentenceArray[0]
        );
        jsonixLayerArray_0_0 = annoSetController.toJsonixLayerArray(
            jsonixAnnotationSetArray_0[0]
        );
        jsonixLayerArray_0_1 = annoSetController.toJsonixLayerArray(
            jsonixAnnotationSetArray_0[1]
        );
        jsonixLabelArray_0_1_0 = labelController.toJsonixLabelArray(
            jsonixLayerArray_0_1[0]
        );
        return done;
    });
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('#toJsonixLabelArray should return a valid array', () => {
        var jsonixLabelArray_0_0_0 = labelController.toJsonixLabelArray(
            jsonixLayerArray_0_0[0]
        );
        jsonixLabelArray_0_0_0.length.should.equal(31);
        jsonixLabelArray_0_0_0[0].name.should.equal('ITJ');
        jsonixLabelArray_0_0_0[0].start.should.equal(0);
        jsonixLabelArray_0_0_0[0].end.should.equal(3);
    });
    it('#toLabelArray should return a valid array', () => {
        jsonixLabelArray_0_1_0.length.should.equal(2);
        jsonixLabelArray_0_1_0[1].name.should.equal('Victim');
    });
    it('#toLabel should throw an InvalidArgumentException when given an undefined input', () => {
        return (() => {labelController.toLabel(undefined, undefined).should.throw(InvalidArgumentException)});
        // TODO : check that. It's weird that it passes like this. 
    });
    it('#toLabel should throw an InvalidArgumentException when given an empty input', () => {
        return (() => {labelController.toLabel(emptyLabelArray[0], undefined).should.throw(InvalidArgumentException)});
        // TODO : check that. It's weird that it passes like this.
    });
    it('#toLabel should return a valid label', function *() {
        var label_0_1_0_0 = yield labelController.toLabel(
            jsonixLabelArray_0_1_0[0], jsonixLayerArray_0_1[0]
        );
        label_0_1_0_0.name.should.equal('Killer');
        label_0_1_0_0.type.should.equal('FE');
        label_0_1_0_0.startPos.should.equal(85);
        label_0_1_0_0.endPos.should.equal(104);
    });

    it('#importLayer should return a valid array of labels', function *() {
        var importedLayer = yield labelController.importLayer(
            jsonixLayerArray_0_1[0]
        );
        importedLayer.length.should.equal(2);
        importedLayer[0].name.should.equal('Killer');
        importedLayer[1].type.should.equal('FE');
    });
    it('#importLabels should return a valid array of labels', function *() {
        var importedLabels = yield labelController.importLabels(
            jsonixLayerArray_0_1
        );
        importedLabels.length.should.equal(6);
        importedLabels[5].name.should.equal('Target');
        importedLabels[5].type.should.equal('Target');
    });
});