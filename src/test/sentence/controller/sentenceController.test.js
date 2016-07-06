'use strict';

const config = require('../../.././test');

const mongoose = config.mongoose;
const mockgoose = config.mockgoose;

config.mochagen.install();

const sinon = config.sinon;
const should = config.should;
const logger = config.logger;
const unmarshaller = config.unmarshaller;

const sentenceController = require('../../../main/sentence/controller/sentenceController');

const InvalidArgumentException = require('../../.././valencerException').InvalidArgumentException;

const testResourcesDir = config.testResourcesDir;
const lexUnitXmlPath = config.path.join(testResourcesDir, 'lu9080.xml');

var lexUnitPromise = new Promise((resolve, reject) => {
    try{
        unmarshaller.unmarshalFile(lexUnitXmlPath, (unmarshalledFile) => {
            return resolve(unmarshalledFile);
        });
    }catch(err){
        return reject(err);
    }
});

var lexUnit;
var savedSentence;

describe('sentenceController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        lexUnit = yield lexUnitPromise;
        savedSentence = yield sentenceController.importSentence(sentenceController.toJsonixSentenceArray(lexUnit)[0]);
        return done;
    });
    
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    
    it('lexUnitPromise should be fulfilled', (done) => {
        lexUnitPromise.should.be.fulfilled.notify(done);
    });
    it('#toJsonixSentenceArray should throw InvalidArgumentException on null, undefined or false input', () => {
        (() => {sentenceController.toJsonixSentenceArray(null)}).should.throw(InvalidArgumentException);
        (() => {sentenceController.toJsonixSentenceArray(undefined)}).should.throw(InvalidArgumentException);
        (() => {sentenceController.toJsonixSentenceArray(false)}).should.throw(InvalidArgumentException);
    });
    it('#toJsonixSentenceArray should throw Error on invalid input', () => {
        (() => {sentenceController.toJsonixSentenceArray('InvalidInput')}).should.throw(Error);
    });
    it('#toJsonixSentenceArray should return a valid array', () => {
        sentenceController.toJsonixSentenceArray(lexUnit).length.should.equal(5);
        sentenceController.toJsonixSentenceArray(lexUnit)[0].text.should.equal('Well aware that most workers were indifferent' +
            ' to foreign affairs , he fully' +
            ' expected the majority of them to be swept into fratricide by patriotic propaganda if war actually came' +
            ' . ');
        sentenceController.toJsonixSentenceArray(lexUnit)[4].id.should.equal(1304135);
    });
    it('#importSentence should return a valid promise', () => {
        savedSentence.should.have.property('fn_id', 216683);
        savedSentence.should.have.property('text', 'Well aware that most workers were indifferent to foreign affairs , he fully' +
            ' expected the majority of them to be swept into fratricide by patriotic propaganda if war actually came' +
            ' . ');
    });
    it('#importSentence should throw an InconsistentDataException when ', () => {
        
    });

});