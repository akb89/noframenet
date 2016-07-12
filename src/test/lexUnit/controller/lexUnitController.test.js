'use strict';

const config = require('../../../../config/test');

const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const expect = config.expect;
const unmarshaller = config.unmarshaller;
const AnnotationSet = config.AnnotationSet;
const lexUnitController = config.lexUnitController;
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
    lexUnit: null
};

describe('lexUnitController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonix.lexUnit = yield lexUnitPromise;
        return done;
    });
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('lexUnitPromise should be fulfilled', () => {
        return lexUnitPromise.should.be.fulfilled;
    });
    it('#toJsonixSentenceArray should return a valid array', function (){
        lexUnitController.toJsonixSentenceArray(jsonix.lexUnit).length.should.equal(5);
        lexUnitController.toJsonixSentenceArray(jsonix.lexUnit)[0].text.should.equal(
            'Well aware that most workers were indifferent to foreign affairs , he fully expected the majority of' +
            ' them to be swept into fratricide by patriotic propaganda if war actually came . ');
        lexUnitController.toJsonixSentenceArray(jsonix.lexUnit)[4].id.should.equal(1304135);
    });
    it('#toJsonixPatternArray should return a valid array', function (){
        lexUnitController.toJsonixPatternArray(jsonix.lexUnit).length.should.equal(4);
        lexUnitController.toJsonixPatternArray(jsonix.lexUnit)[0].annoSet[0].id.should.equal(79951);
        lexUnitController.toJsonixPatternArray(jsonix.lexUnit)[3].annoSet[0].id.should.equal(2056432);
    });
    it('#importLexUnit should return a valid lexUnit', function *(){
        mockgoose.reset();
        var lexUnit = yield lexUnitController.importLexUnit(jsonix.lexUnit);
        lexUnit.fn_id.should.equal(9080);
        lexUnit.name.should.equal('fratricide.n');
    });
    it('#importLexUnit should ultimately insert all annotationSets referring to the input lexUnit', function *(){
        mockgoose.reset();
        var lexUnit = yield lexUnitController.importLexUnit(jsonix.lexUnit);
        var annoSets = yield AnnotationSet.find().where('lexUnit').equals(lexUnit);
        annoSets.length.should.equal(10);
        annoSets[0].sentence.should.not.be.undefined;
        annoSets[9].sentence.should.not.be.undefined;
    });
    it('#importLexUnit should insert valid patterns to the relevant annotationSets', function *(){
        mockgoose.reset();
        var lexUnit = yield lexUnitController.importLexUnit(jsonix.lexUnit);
        var annoSets = yield AnnotationSet.find().where('lexUnit').equals(lexUnit);
        annoSets.length.should.equal(10);
        expect(annoSets[0].pattern).to.be.undefined;
        expect(annoSets[1].pattern).not.to.be.undefined;
    });
});