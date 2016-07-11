'use strict';

const config = require('../../../../config/test');

const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const unmarshaller = config.unmarshaller;

const lexUnitController = config.lexUnitController;
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

describe('lexUnitController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonixLexUnit = yield lexUnitPromise;
        return done;
    });

    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });

    it('lexUnitPromise should be fulfilled', () => {
        return lexUnitPromise.should.be.fulfilled;
    });
    it('#toJsonixSentenceArray should throw InvalidArgumentException on null, undefined or false input', () => {
        (() => {lexUnitController.toJsonixSentenceArray(null)}).should.throw(InvalidArgumentException);
        (() => {lexUnitController.toJsonixSentenceArray(undefined)}).should.throw(InvalidArgumentException);
        (() => {lexUnitController.toJsonixSentenceArray(false)}).should.throw(InvalidArgumentException);
    });
    it('#toJsonixSentenceArray should return a valid array', () => {
        lexUnitController.toJsonixSentenceArray(jsonixLexUnit).length.should.equal(5);
        lexUnitController.toJsonixSentenceArray(jsonixLexUnit)[0].text.should.equal(
            'Well aware that most workers were indifferent to foreign affairs , he fully expected the majority of' +
            ' them to be swept into fratricide by patriotic propaganda if war actually came . ');
        lexUnitController.toJsonixSentenceArray(jsonixLexUnit)[4].id.should.equal(1304135);
    });
    it('#toJsonixPatternArray should return a valid array', () => {
        lexUnitController.toJsonixPatternArray(jsonixLexUnit).length.should.equal(4);
        lexUnitController.toJsonixPatternArray(jsonixLexUnit)[0].annoSet[0].id.should.equal(79951);
        lexUnitController.toJsonixPatternArray(jsonixLexUnit)[3].annoSet[0].id.should.equal(2056432);
    });
    it('#toLexUnit should return a valid lexUnit', function *(){
        var lexUnit = yield lexUnitController.toLexUnit(jsonixLexUnit);
        lexUnit.fn_id.should.equal(9080);
        lexUnit.name.should.equal('fratricide.n');
    });
    it('#importLexUnit should return a lexUnit with valid sentences', () => {
        //TODO finish
    });
    it('#importLexUnit should insert valid patterns to the relevant annotationSets', () => {
        //TODO finish
    });
});