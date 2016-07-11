'use strict';

const config = require('../../../../config/test');

const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const unmarshaller = config.unmarshaller;

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

describe('sentenceController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonixLexUnit = yield lexUnitPromise;
        jsonixSentenceArray = lexUnitController.toJsonixSentenceArray(
            jsonixLexUnit
        );
        return done;
    });
    
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    
    it('#toJsonixAnnoSetArray should return a valid array', () => {
        sentenceController.toJsonixAnnoSetArray(jsonixSentenceArray[0]).length.should.equal(2);
        sentenceController.toJsonixAnnoSetArray(jsonixSentenceArray[0])[0].id.should.equal(79946);
    });
    it('#findSentenceByFNId should return a valid promise when expected ', () => {
        return sentenceController.findSentenceByFNId(jsonixSentenceArray[0].id).should.be.fulfilled;
    });
    it('#findSentenceByFNId should fail when expected ', () => {
        return sentenceController.findSentenceByFNId(jsonixSentenceArray[4].id).should.eventually.equal(null);
    });
    it('#toSentence should return a sentence with valid fn_id', function *() {
        var sentence_0 = yield sentenceController.toSentence(
            jsonixSentenceArray[0]
        );
        sentence_0.fn_id.should.equal(216683);
    });
    it('#toSentence should return a sentence with valid text', function *() {
        var sentence_0 = yield sentenceController.toSentence(
            jsonixSentenceArray[0]
        );
        sentence_0.text.should.equal('Well aware that most workers were indifferent to foreign' +
            ' affairs , he fully expected the majority of them to be swept into fratricide by patriotic propaganda' +
            ' if war actually came . ');
    });
    //TODO test when pushing annoSets on pre-existing ones
    it('#importSentence should return a sentence with valid annotationSets', function *() {
        var importedSentence = yield sentenceController.importSentence(
            jsonixSentenceArray[0]
        );
        importedSentence.annotationSets.length.should.equal(2);
        importedSentence.annotationSets[0].fn_id.should.equal(79946);
        importedSentence.annotationSets[1].fn_id.should.equal(79947);
    });
    it('#importSentences should return a valid array of sentences', function *() {
        var importedSentences = yield sentenceController.importSentences(
            jsonixSentenceArray
        );
        importedSentences.length.should.equal(5);
        importedSentences[0].fn_id.should.equal(216683);
        importedSentences[1].fn_id.should.equal(216684);
        importedSentences[2].fn_id.should.equal(216685);
        importedSentences[3].fn_id.should.equal(1304134);
        importedSentences[4].fn_id.should.equal(1304135);
    });
});