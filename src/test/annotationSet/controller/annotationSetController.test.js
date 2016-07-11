'use strict';

const config = require('../../../../config/test');

const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const unmarshaller = config.unmarshaller;

const annoSetController = config.annoSetController;
const lexUnitController = config.lexUnitController;
const sentenceController = config.sentenceController;

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
var jsonixAnnoSetArray_0;
var jsonixAnnoSetArray_1;

describe('annotationSetController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonixLexUnit = yield lexUnitPromise;
        jsonixSentenceArray = lexUnitController.toJsonixSentenceArray(
            jsonixLexUnit
        );
        jsonixAnnoSetArray_0 = sentenceController.toJsonixAnnoSetArray(
            jsonixSentenceArray[0]
        );
        jsonixAnnoSetArray_1 = sentenceController.toJsonixAnnoSetArray(
            jsonixSentenceArray[1]
        );
        return done;
    });
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('#toJsonixLayerArray should return a valid array', () => {
        var jsonixLayerArray_0_1 = annoSetController.toJsonixLayerArray(
            jsonixAnnoSetArray_0[1]
        );
        jsonixLayerArray_0_1.length.should.equal(7);
        jsonixLayerArray_0_1[0].rank.should.equal(1);
        jsonixLayerArray_0_1[0].name.should.equal('FE');
    });
    it('#toAnnotationSetPromise should return a valid promise when expected', () => {
        return annoSetController.toAnnotationSetPromise(jsonixAnnoSetArray_0[0]).should.be.fulfilled;
    });
    it('#toAnnotationSetPromise should fail when expected', () => {
        return annoSetController.toAnnotationSetPromise(jsonixAnnoSetArray_1[1]).should.eventually.equal(null);
    });
    it('#toAnnotationSet should return an AnnotationSet with a valid fn_id', function *() {
        var annotationSet_0_0 = yield annoSetController.toAnnotationSet(
            jsonixAnnoSetArray_0[0]
        );
        annotationSet_0_0.fn_id.should.equal(79946);
    });
    it('#importAnnotationSet should return a valid AnnotationSet', function *() {
        var importedAnnoSet_1_0 = yield annoSetController.importAnnotationSet(
            jsonixAnnoSetArray_1[0]
        );
        importedAnnoSet_1_0.should.not.equal(null);
        importedAnnoSet_1_0.fn_id.should.equal(79948);
    });
    // TODO: test when labels are added (pushed) to an existing AnnotationSet with non-empty labels
    it('#importAnnotationSet should return an AnnotationSet with valid labels', function *() {
        var importedAnnoSet_0_1 = yield annoSetController.importAnnotationSet(
            jsonixAnnoSetArray_0[1]
        );
        importedAnnoSet_0_1.labels.length.should.equal(6);
        importedAnnoSet_0_1.labels[0].type.should.equal('FE');
        importedAnnoSet_0_1.labels[0].name.should.equal('Killer');
    });
    it('#importAnnotationSets should return a valid array of annotationSets', function *() {
        var importedAnnotationSets = yield annoSetController.importAnnotationSets(
            jsonixAnnoSetArray_0
        );
        importedAnnotationSets.length.should.equal(2);
        importedAnnotationSets[0].fn_id.should.equal(79946);
    });
});