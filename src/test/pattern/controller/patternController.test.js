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

var jsonix = {
    lexUnit: null,
    patterns: null
};

var saved = {
    valenceUnits: [],
    pattern: null
};

describe('patternController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonix.lexUnit = yield lexUnitPromise;

        jsonix.patterns = lexUnitController.toJsonixPatternArray(
            jsonix.lexUnit
        );

        saved.valenceUnits[0] = new ValenceUnit({
            FE: 'TestFE_0',
            PT: 'TestPT_0',
            GF: 'TestGF_0'
        });
        saved.valenceUnits[1] = new ValenceUnit({
            FE: 'TestFE_1',
            PT: 'TestPT_1',
            GF: 'TestGF_1'
        });
        yield saved.valenceUnits[0].save();
        yield saved.valenceUnits[1].save();
        saved.pattern = new Pattern();
        saved.pattern.valenceUnits = [saved.valenceUnits[0], saved.valenceUnits[1]];
        saved.pattern.valenceUnits.sort();
        yield saved.pattern.save();
        return done;
    });

    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('#toJsonixAnnoSetArray should return a valid array', function (){
        patternController.toJsonixAnnoSetArray(jsonix.patterns[0]).length.should.equal(1);
        patternController.toJsonixAnnoSetArray(jsonix.patterns[0])[0].id.should.equal(79951);
        patternController.toJsonixAnnoSetArray(jsonix.patterns[3])[0].id.should.equal(2056432);
    });
    it('#toJsonixValenceUnitArray should return a valid array', function (){
        patternController.toJsonixValenceUnitArray(jsonix.patterns[0]).length.should.equal(2);
        patternController.toJsonixValenceUnitArray(jsonix.patterns[0])[0].fe.should.equal('Killer');
        patternController.toJsonixValenceUnitArray(jsonix.patterns[0])[1].fe.should.equal('Victim');
    });
    it('#findPatternByValenceUnits should return a valid Pattern when expected', function *() {
        var pattern = new Pattern();
        pattern.valenceUnits = [saved.valenceUnits[0], saved.valenceUnits[1]];
        var dbPattern = yield patternController.findPatternByValenceUnits(pattern.valenceUnits);
        dbPattern._id.equals(saved.pattern._id).should.be.true;
    });
    it('#findPatternByValenceUnits should succeed regardless of valenceUnit order', function *() {
        var pattern = new Pattern();
        pattern.valenceUnits = [saved.valenceUnits[1], saved.valenceUnits[0]];
        var dbPattern = yield patternController.findPatternByValenceUnits(pattern.valenceUnits);
        dbPattern._id.equals(saved.pattern._id).should.be.true;
    });
    it('#findAnnotationSets should return a valid array', function *() {
        mockgoose.reset();
        var jsonixAnnotationSets = patternController.toJsonixAnnoSetArray(jsonix.patterns[1]);
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
        var jsonixAnnotationSets = patternController.toJsonixAnnoSetArray(jsonix.patterns[1]);
        var annoSet_79947 = new AnnotationSet({fn_id: 79947});
        yield annoSet_79947.save();
        var annoSets = yield patternController.findAnnotationSets(jsonixAnnotationSets);
        annoSets.includes(null).should.be.true;
        annoSets[0].fn_id.should.equal(79947);
    });
    it('#importPattern should return a valid Pattern if not exists', function *(){
        mockgoose.reset();
        var annoSets = [{fn_id: 79951}, {fn_id: 799511}, {fn_id: 7995111}, {fn_id: 79951111}];
        yield AnnotationSet.insertMany(annoSets);
        var pattern = yield patternController.importPattern(jsonix.patterns[0]);
        pattern.valenceUnits.length.should.equal(2);
        pattern.valenceUnits[0].FE.should.equal('Killer');
        pattern.valenceUnits[1].FE.should.equal('Victim');
    });
    it('#importPattern should return a valid Pattern if already exists', function *(){
        mockgoose.reset();
        var annoSets = [{fn_id: 79951}, {fn_id: 799511}, {fn_id: 7995111}, {fn_id: 79951111}];
        yield AnnotationSet.insertMany(annoSets);
        var savedPattern = new Pattern();
        var killer = new ValenceUnit({FE: 'Killer', PT: 'INI', GF: ''});
        yield killer.save();
        var victim = new ValenceUnit({FE: 'Victim', PT: 'INI', GF: ''});
        yield victim.save();
        savedPattern.valenceUnits = [killer, victim];
        yield savedPattern.save();
        var pattern = yield patternController.importPattern(jsonix.patterns[0]);
        pattern._id.equals(savedPattern._id).should.be.true;
    });
    it('#importPatterns should return a valid array', function *(){
        mockgoose.reset();
        var annoSets = [{fn_id: 79951}, {fn_id: 799511}, {fn_id: 7995111}, {fn_id: 79951111}, {fn_id: 79947}, {fn_id: 79948}, {fn_id: 79949}, {fn_id: 2056432}];
        yield AnnotationSet.insertMany(annoSets);
        var patterns = yield patternController.importPatterns(jsonix.patterns);
        patterns.length.should.equal(4);
        patterns[0].valenceUnits.length.should.equal(2);
        patterns[0].valenceUnits[0].FE.should.equal('Killer');
        patterns[0].valenceUnits[1].FE.should.equal('Victim');
    });
});