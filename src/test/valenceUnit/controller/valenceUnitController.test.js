'use strict';

const config = require('../../../../config/test');
const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const unmarshaller = config.unmarshaller;
const ValenceUnit = config.ValenceUnit;
const lexUnitController = config.lexUnitController;
const patternController = config.patternController;
const valenceUnitController = config.valenceUnitController;
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
var jsonixValenceUnitArray_0;
var savedValenceUnit;

describe('valenceUnitController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonixLexUnit = yield lexUnitPromise;
        jsonixValenceUnitArray_0 = patternController.toJsonixValenceUnitArray(
            lexUnitController.toJsonixPatternArray(jsonixLexUnit)[0]
        );
        savedValenceUnit = new ValenceUnit({
            FE: 'Killer',
            PT: 'Poss',
            GF: 'Gen'
        });
        yield savedValenceUnit.save();
        return done;
    });
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('#findValenceUnitByLabels should return a valid promise when expected', () => {
        var jsonixExistingVU = patternController.toJsonixValenceUnitArray(
            lexUnitController.toJsonixPatternArray(jsonixLexUnit)[2]
        )[0];
        return valenceUnitController.findValenceUnitByLabels(jsonixExistingVU.fe, jsonixExistingVU.pt, jsonixExistingVU.gf).should.eventually.have.property('GF', 'Gen');
    });
    it('#findValenceUnitByLabels should fail when expected', () => {
        mockgoose.reset();
        var jsonixVU = patternController.toJsonixValenceUnitArray(
            lexUnitController.toJsonixPatternArray(jsonixLexUnit)[0]
        )[0];
        return valenceUnitController.findValenceUnitByLabels(jsonixVU.fe, jsonixVU.pt, jsonixVU.gf).should.eventually.equal(null);
    });
    it('#importValenceUnit should return a valid valenceUnit', function *() {
        var valenceUnit = yield valenceUnitController.importValenceUnit(jsonixValenceUnitArray_0[0]);
        valenceUnit.FE.should.equal('Killer');
        valenceUnit.PT.should.equal('INI');
        valenceUnit.GF.should.equal('');
    });
    it('#importValenceUnits should return a valid array of valenceUnits', function *() {
        var valenceUnits = yield valenceUnitController.importValenceUnits(jsonixValenceUnitArray_0);
        valenceUnits.length.should.equal(2);
        valenceUnits[1].FE.should.equal('Victim');
    });
});