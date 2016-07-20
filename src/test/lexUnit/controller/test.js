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
const lexUnitXmlPath = config.path.join(config.testLexUnitXmlDir, 'lu10082.xml');

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
    it('#importLexUnit', function *(){
        this.timeout(0);
        var lexUnit = yield lexUnitController.importLexUnit(jsonix.lexUnit);
    });

});