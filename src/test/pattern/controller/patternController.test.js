'use strict';

const config = require('../../../../config/test');

const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const unmarshaller = config.unmarshaller;

const AnnotationSet = config.AnnotationSet;
const ValenceUnit = config.ValenceUnit;
const Pattern = config.Pattern;
const lexUnitController = config.lexUnitController;
const patternController = config.patternController;

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
var jsonixPatternArray;

var savedValenceUnit_0;
var savedValenceUnit_1;
var savedPattern;

describe('patternController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonixLexUnit = yield lexUnitPromise;

        jsonixPatternArray = lexUnitController.toJsonixPatternArray(
            jsonixLexUnit
        );

        savedValenceUnit_0 = new ValenceUnit({
            FE: 'TestFE_0',
            PT: 'TestPT_0',
            GF: 'TestGF_0'
        });
        savedValenceUnit_1 = new ValenceUnit({
            FE: 'TestFE_1',
            PT: 'TestPT_1',
            GF: 'TestGF_1'
        });
        yield savedValenceUnit_0.save();
        yield savedValenceUnit_1.save();
        savedPattern = new Pattern();
        savedPattern.valenceUnits = [savedValenceUnit_0, savedValenceUnit_1];
        savedPattern.valenceUnits.sort();
        yield savedPattern.save();
        return done;
    });

    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('#mergeAnnotationSets should return a sorted array of AnnotationSets without duplicates', () => {
        var annoSet_1 = new AnnotationSet({fn_id: 1});
        var annoSet_2 = new AnnotationSet({fn_id: 2});
        var annoSet_3 = new AnnotationSet({fn_id: 3});
        var annoSet_4 = new AnnotationSet({fn_id: 4});
        var annoSetArray_1 = [annoSet_4, annoSet_2, annoSet_1];
        var annoSetArray_2 = [annoSet_1, annoSet_3];
        var mergedAnnoSets = patternController.mergeAnnotationSets(annoSetArray_1, annoSetArray_2);
        mergedAnnoSets.length.should.equal(4);
        mergedAnnoSets[0].fn_id.should.equal(1);
        mergedAnnoSets[3].fn_id.should.equal(4);
    });
    it('#toJsonixAnnoSetArray should return a valid array', () => {
        patternController.toJsonixAnnoSetArray(jsonixPatternArray[0]).length.should.equal(4);
        patternController.toJsonixAnnoSetArray(jsonixPatternArray[0])[0].id.should.equal(79951);
        patternController.toJsonixAnnoSetArray(jsonixPatternArray[0])[3].id.should.equal(79951111);
        patternController.toJsonixAnnoSetArray(jsonixPatternArray[3])[0].id.should.equal(2056432);
    });
    it('#toJsonixValenceUnitArray should return a valid array', () => {
        patternController.toJsonixValenceUnitArray(jsonixPatternArray[0]).length.should.equal(2);
        patternController.toJsonixValenceUnitArray(jsonixPatternArray[0])[0].fe.should.equal('Killer');
        patternController.toJsonixValenceUnitArray(jsonixPatternArray[0])[1].fe.should.equal('Victim');
    });
    it('#findPatternByValenceUnits should return a valid Pattern when expected', function *() {
        var pattern = new Pattern();
        pattern.valenceUnits = [savedValenceUnit_0, savedValenceUnit_1];
        var dbPattern = yield patternController.findPatternByValenceUnits(pattern.valenceUnits);
        dbPattern._id.equals(savedPattern._id).should.be.true;
    });
    it('#findPatternByValenceUnits should succeed regardless of valenceUnit order', function *() {
        var pattern = new Pattern();
        pattern.valenceUnits = [savedValenceUnit_1, savedValenceUnit_0];
        var dbPattern = yield patternController.findPatternByValenceUnits(pattern.valenceUnits);
        dbPattern._id.equals(savedPattern._id).should.be.true;
    });
    it('#findAnnotationSets should return a valid array', function *() {
        mockgoose.reset();
        var jsonixAnnotationSets = patternController.toJsonixAnnoSetArray(jsonixPatternArray[1]);
        var annoSet_79947 = new AnnotationSet({fn_id: 79947});
        yield annoSet_79947.save();
        var annoSet_79948 = new AnnotationSet({fn_id: 79948});
        yield annoSet_79948.save();
        var annoSets = yield patternController.findAnnotationSets(jsonixAnnotationSets);
        annoSets.length.should.equal(2);
        annoSets[0].fn_id.should.equal(79947);
        annoSets[1].fn_id.should.equal(79948);
    });
    it('#findAnnotationSets should contain null if AnnotationSet ref is not in the database', function *() {
        mockgoose.reset();
        var jsonixAnnotationSets = patternController.toJsonixAnnoSetArray(jsonixPatternArray[1]);
        var annoSet_79947 = new AnnotationSet({fn_id: 79947});
        yield annoSet_79947.save();
        var annoSets = yield patternController.findAnnotationSets(jsonixAnnotationSets);
        annoSets.includes(null).should.be.true;
        annoSets[0].fn_id.should.equal(79947);
    });
    it('#importPattern should return a valid Pattern', function *(){
        mockgoose.reset();
        var annoSets = [{fn_id: 79951}, {fn_id: 799511}, {fn_id: 7995111}, {fn_id: 79951111}, {fn_id: 79947}, {fn_id: 79948}, {fn_id: 79949}, {fn_id: 2056432}];
        AnnotationSet.insertMany(annoSets);
        var pattern = yield patternController.importPattern(jsonixPatternArray[0]);
        pattern.annotationSets.length.should.equal(4);
        pattern.annotationSets[0].fn_id.should.equal(79951);
        pattern.valenceUnits.length.should.equal(2);
        pattern.valenceUnits[0].FE.should.equal('Killer');
        pattern.valenceUnits[1].FE.should.equal('Victim');
    });
    it('#importPatterns should return a valid array', function *(){
        mockgoose.reset();
        var annoSets = [{fn_id: 79951}, {fn_id: 799511}, {fn_id: 7995111}, {fn_id: 79951111}, {fn_id: 79947}, {fn_id: 79948}, {fn_id: 79949}, {fn_id: 2056432}];
        AnnotationSet.insertMany(annoSets);
        var patterns = yield patternController.importPatterns(jsonixPatternArray);
        patterns.length.should.equal(4);
        patterns[0].annotationSets.length.should.equal(4);
        patterns[0].annotationSets[0].fn_id.should.equal(79951);
        patterns[0].valenceUnits.length.should.equal(2);
        patterns[0].valenceUnits[0].FE.should.equal('Killer');
        patterns[0].valenceUnits[1].FE.should.equal('Victim');
    });
});