'use strict';

const config = require('../../../../config/test');
const mongoose = config.mongoose;
const mockgoose = config.mockgoose;
config.mochagen.install();
const should = config.should;
const unmarshaller = config.unmarshaller;
const annoSetController = config.annoSetController;
const labelController = config.labelController;
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
    lexunit: null,
    sentences: [{
        annotationSets: [{
            layers: [{
                labels: []
            }]
        }]
    }]
};

describe('labelController', () => {
    before(function*(done){
        yield mockgoose(mongoose);
        yield mongoose.connect('mongodb://example.com/TestingDB');
        jsonix.lexunit = yield lexUnitPromise;
        jsonix.sentences = lexUnitController.toJsonixSentenceArray(
            jsonix.lexunit
        );
        jsonix.sentences[0].annotationSets = sentenceController.toJsonixAnnoSetArray(
            jsonix.sentences[0]
        );
        jsonix.sentences[0].annotationSets[0].layers = annoSetController.toJsonixLayerArray(
            jsonix.sentences[0].annotationSets[0]
        );
        jsonix.sentences[0].annotationSets[1].layers = annoSetController.toJsonixLayerArray(
            jsonix.sentences[0].annotationSets[1]
        );
        jsonix.sentences[0].annotationSets[1].layers[0].labels = labelController.toJsonixLabelArray(
            jsonix.sentences[0].annotationSets[1].layers[0]
        );
        return done;
    });
    after(function() {
        mongoose.disconnect();
        mockgoose.reset();
    });
    it('#toJsonixLabelArray should return a valid array', function () {
        var jsonixLabelArray = labelController.toJsonixLabelArray(
            jsonix.sentences[0].annotationSets[0].layers[0]
        );
        jsonixLabelArray.length.should.equal(31);
        jsonixLabelArray[0].name.should.equal('ITJ');
        jsonixLabelArray[0].start.should.equal(0);
        jsonixLabelArray[0].end.should.equal(3);
    });
    it('#importLabel should return a valid label', function *() {
        mockgoose.reset();
        var label = yield labelController.importLabel(
            jsonix.sentences[0].annotationSets[1].layers[0].labels[0],
            jsonix.sentences[0].annotationSets[1].layers[0]
        );
        label.name.should.equal('Killer');
        label.type.should.equal('FE');
        label.startPos.should.equal(85);
        label.endPos.should.equal(104);
    });
    it('#importLayer should return a valid array of labels', function *() {
        mockgoose.reset();
        var importedLayer = yield labelController.importLayer(
            jsonix.sentences[0].annotationSets[1].layers[0]
        );
        importedLayer.length.should.equal(2);
        importedLayer[0].name.should.equal('Killer');
        importedLayer[1].type.should.equal('FE');
    });
    it('#importLabelsFromLayers should return a valid array of labels', function *() {
        mockgoose.reset();
        var importedLabels = yield labelController.importLabelsFromLayers(
            jsonix.sentences[0].annotationSets[1].layers
        );
        importedLabels.length.should.equal(6);
        importedLabels[5].name.should.equal('Target');
        importedLabels[5].type.should.equal('Target');
    });
});