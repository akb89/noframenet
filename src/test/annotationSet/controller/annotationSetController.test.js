'use strict';

const config = require('../../../../configs/test');

const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const sinon = config.sinon;
const should = config.should;
const logger = config.logger;
const unmarshaller = config.unmarshaller;

const annotationSet = config.annotationSet;
const sentenceController = config.sentenceController;
const annotationSetController = config.annotationSetController;

const lexUnitXmlPath = config.path.join(config.testLexUnitXmlDir, 'lu9080.xml');
const sentenceXmlPath = config.path.join(config.testSentenceXmlDir, 'sentence101.xml');



var sentencePromise = new Promise((resolve, reject) => {
    try{
        unmarshaller.unmarshalFile(sentenceXmlPath, (unmarshalledFile) => {
            return resolve(unmarshalledFile);
        });
    }catch(err){
        return reject(err);
    }
});

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
var sentence;
var firstDBAnnoSet;
var secondDBAnnoSet;
var spy;

describe('annotationSetController', () => {
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        lexUnit = yield lexUnitPromise;
        sentence = yield sentencePromise;
        firstDBAnnoSet = new annotationSet({_id: '576bd20c10124ba33d62523b', fn_id: '79946'});
        secondDBAnnoSet = new annotationSet({_id: '577cd508d7f635a12fa10cc1', fn_id: '79947'});
        yield firstDBAnnoSet.save();
        yield secondDBAnnoSet.save();
        //spy = sinon.spy(annotationSetController, 'saveAndReturnId');
        return done;
    });

    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });

    it('testing', function* () {

    });
    
    it('#toJsonixAnnotationSetArray should return a valid array', () => {
        annotationSetController.toJsonixAnnotationSetArray(lexUnit).length.should.equal(10);
        annotationSetController.toJsonixAnnotationSetArray(lexUnit)[0].id.should.equal(79946);
    });
    it('#toJsonixAnnotationSetSubArray should return a valid array', () => {
        annotationSetController.toJsonixAnnotationSetSubArray(sentenceController.toJsonixSentenceArray(lexUnit)[0]).length.should.equal(2);
        annotationSetController.toJsonixAnnotationSetSubArray(sentenceController.toJsonixSentenceArray(lexUnit)[0])[0].id.should.equal(79946);
    });
    it('#getAnnoSetObjectIdSetFromSentence', () => {

    });
});