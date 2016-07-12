'use strict';

const config = require('../../../../config/test');
const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const unmarshaller = config.unmarshaller;
const AnnotationSet = config.AnnotationSet;
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

var jsonix = {
    lexUnit: null,
    sentences: []
};


describe('sentenceController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonix.lexUnit = yield lexUnitPromise;
        jsonix.sentences = lexUnitController.toJsonixSentenceArray(
            jsonix.lexUnit
        );
        return done;
    });
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('#toJsonixAnnoSetArray should return a valid array', () => {
        sentenceController.toJsonixAnnoSetArray(jsonix.sentences[0]).length.should.equal(2);
        sentenceController.toJsonixAnnoSetArray(jsonix.sentences[0])[0].id.should.equal(79946);
    });
    it('#findSentenceByFNId should return a valid promise when expected ', () => {
        return sentenceController.findSentenceByFNId(jsonix.sentences[0].id).should.be.fulfilled;
    });
    it('#findSentenceByFNId should return null when expected ', () => {
        return sentenceController.findSentenceByFNId(jsonix.sentences[4].id).should.eventually.equal(null);
    });
    it('#importSentence should return a sentence with valid fn_id', function *() {
        mockgoose.reset();
        var importedSentence = yield sentenceController.importSentence(
            jsonix.sentences[0]
        );
        importedSentence.fn_id.should.equal(216683);
    });
    it('#importSentence should return a sentence with valid text', function *() {
        mockgoose.reset();
        var importedSentence = yield sentenceController.importSentence(
            jsonix.sentences[0]
        );
        importedSentence.text.should.equal('Well aware that most workers were indifferent to foreign' +
            ' affairs , he fully expected the majority of them to be swept into fratricide by patriotic propaganda' +
            ' if war actually came . ');
    });
    it('#importSentence should insert all annotationSets referring to the specified sentence', function *() {
        mockgoose.reset();
        var importedSentence = yield sentenceController.importSentence(
            jsonix.sentences[0]
        );
        var annotationSets = yield AnnotationSet.find().where('sentence').equals(importedSentence);
        annotationSets.length.should.equal(2);
        annotationSets[0].fn_id.should.equal(79946);
        annotationSets[1].fn_id.should.equal(79947);
    });
    it('#importSentences should return a valid array of sentences', function *() {
        mockgoose.reset();
        var importedSentences = yield sentenceController.importSentences(
            jsonix.sentences
        );
        importedSentences.length.should.equal(5);
        importedSentences[0].fn_id.should.equal(216683);
        importedSentences[3].fn_id.should.equal(1304134);
        importedSentences[4].fn_id.should.equal(1304135);
    });
});