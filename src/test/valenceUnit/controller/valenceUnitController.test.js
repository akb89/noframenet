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

var jsonix = {
    lexUnit: null,
    valenceUnits: null
};

var savedValenceUnit;

describe('valenceUnitController', function (){
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonix.lexUnit = yield lexUnitPromise;
        jsonix.valenceUnits = patternController.toJsonixValenceUnitArray(
            lexUnitController.toJsonixPatternArray(
                jsonix.lexUnit
            )[0]
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
    it('#findValenceUnitByLabels should return a valid promise when expected', function (){
        return valenceUnitController.findValenceUnitByLabels('Killer', 'Poss', 'Gen').should.not.be.null;
    });
    it('#findValenceUnitByLabels should fail when expected', function (){
        mockgoose.reset();
        var jsonixVU = patternController.toJsonixValenceUnitArray(
            lexUnitController.toJsonixPatternArray(jsonix.lexUnit)[0]
        )[0];
        return valenceUnitController.findValenceUnitByLabels(jsonixVU.fe, jsonixVU.pt, jsonixVU.gf).should.eventually.equal(null);
    });
    it('#importValenceUnit should return a valid valenceUnit', function *() {
        mockgoose.reset();
        var valenceUnit = yield valenceUnitController.importValenceUnit(jsonix.valenceUnits[0]);
        valenceUnit.FE.should.equal('Killer');
        valenceUnit.PT.should.equal('INI');
        valenceUnit.GF.should.equal('');
    });
    it('#importValenceUnit should return a valid valenceUnit', function *() {
        mockgoose.reset();
        var saveVU = new ValenceUnit({FE: 'Killer', PT: 'INI', GF: ''});
        yield saveVU.save();
        var valenceUnit = yield valenceUnitController.importValenceUnit(jsonix.valenceUnits[0]);
        valenceUnit._id.equals(saveVU._id).should.be.true;
    });
    it('#importValenceUnits should return a valid array of valenceUnits', function *() {
        mockgoose.reset();
        var valenceUnits = yield valenceUnitController.importValenceUnits(jsonix.valenceUnits);
        valenceUnits.length.should.equal(2);
        valenceUnits[1].FE.should.equal('Victim');
    });
});