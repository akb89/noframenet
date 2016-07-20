'use strict';

const config = require('../../../../config/test');
const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const expect = config.expect;
const unmarshaller = config.unmarshaller;
const AnnotationSet = config.AnnotationSet;
const Pattern = config.Pattern;
const annoSetController = config.annoSetController;
const lexUnitController = config.lexUnitController;
const sentenceController = config.sentenceController;
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

var jsonix = {
    lexUnit: null,
    sentences: [{
        annotationsSets: [{
            layers: []
        }]
    }]
};

describe('annotationSetController', function (){
    before(function* (done) {
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonix.lexUnit = yield lexUnitPromise;
        jsonix.sentences = lexUnitController.toJsonixSentenceArray(
            jsonix.lexUnit
        );
        jsonix.sentences[0].annotationSets = sentenceController.toJsonixAnnoSetArray(
            jsonix.sentences[0]
        );
        jsonix.sentences[1].annotationSets = sentenceController.toJsonixAnnoSetArray(
            jsonix.sentences[1]
        );
        return done;
    });
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('#toJsonixLayerArray should return a valid array', function (){
        jsonix.sentences[0].annotationSets[1].layers = annoSetController.toJsonixLayerArray(
            jsonix.sentences[0].annotationSets[1]
        );
        jsonix.sentences[0].annotationSets[0].layers = annoSetController.toJsonixLayerArray(
            jsonix.sentences[0].annotationSets[0]
        );
        jsonix.sentences[0].annotationSets[1].layers.length.should.equal(7);
        jsonix.sentences[0].annotationSets[1].layers[0].rank.should.equal(1);
        jsonix.sentences[0].annotationSets[1].layers[0].name.should.equal('FE');
        jsonix.sentences[0].annotationSets[0].layers.length.should.equal(3);
    });
    it('#findAnnotationSetByFNId should fail when expected', function *(){
        var annoSet = yield annoSetController.findAnnotationSetByFNId(jsonix.sentences[1].annotationSets[1].id).should.eventually.equal(null);
        expect(annoSet).to.be.null;
    });
    it('#findAnnotationSetByFNId should return a valid promise when expected', function *(){
        var savedAnnoSet = new AnnotationSet({fn_id: 79946});
        yield savedAnnoSet.save();
        var annoSet = yield annoSetController.findAnnotationSetByFNId(jsonix.sentences[0].annotationSets[0].id);
        expect(annoSet).to.not.be.null;
        annoSet.fn_id.should.equal(79946);
    });
    it('#updatePatternReference should update a given annotationSet.pattern reference', function *(){
        mockgoose.reset();
        var savedAnnoSet = new AnnotationSet({fn_id: 79946});
        yield savedAnnoSet.save();
        var pattern = new Pattern();
        yield pattern.save();
        expect(savedAnnoSet.pattern).to.be.undefined;
        yield annoSetController.updatePatternReference(savedAnnoSet, pattern);
        savedAnnoSet.pattern.should.not.be.undefined;
    });
    it('#updatePatternReferences should update all pattern references of a given array of annotationSet', function *(){
        mockgoose.reset();
        var savedAnnoSet1 = new AnnotationSet({fn_id: 79946});
        yield savedAnnoSet1.save();
        var savedAnnoSet2 = new AnnotationSet({fn_id: 79947});
        yield savedAnnoSet2.save();
        var annoSets = [savedAnnoSet1, savedAnnoSet2];
        var pattern = new Pattern();
        yield pattern.save();
        expect(savedAnnoSet1.pattern).to.be.undefined;
        expect(savedAnnoSet2.pattern).to.be.undefined;
        yield annoSetController.updatePatternReferences(annoSets, pattern);
        savedAnnoSet1.pattern.should.not.be.undefined;
        savedAnnoSet2.pattern.should.not.be.undefined;
    });
    it('#importAnnotationSet should return a valid AnnotationSet', function *() {
        mockgoose.reset();
        var importedAnnoSet = yield annoSetController.importAnnotationSet(
            jsonix.sentences[1].annotationSets[0]
        );
        importedAnnoSet.should.not.equal(null);
        importedAnnoSet.fn_id.should.equal(79948);
    });
    it('#importAnnotationSet should return an AnnotationSet with valid labels', function *() {
        var importedAnnoSet = yield annoSetController.importAnnotationSet(
            jsonix.sentences[0].annotationSets[1]
        );
        importedAnnoSet.labels.length.should.equal(6);
        importedAnnoSet.labels[0].type.should.equal('FE');
        importedAnnoSet.labels[0].name.should.equal('Killer');
    });
    it('#importAnnotationSets should return a valid array of annotationSets', function *() {
        mockgoose.reset();
        var importedAnnoSets = yield annoSetController.importAnnotationSets(
            sentenceController.toJsonixAnnoSetArray(jsonix.sentences[0])
        );
        importedAnnoSets.length.should.equal(2);
        importedAnnoSets[0].fn_id.should.equal(79946);
    });
});