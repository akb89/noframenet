const chai = require('chai');
const marshaller = require('./../marshalling/unmarshaller');
const toJsonixDocumentArray = require('./../utils/jsonixUtils').toJsonixDocumentArray;
const toJsonixDocumentSentenceArray = require('./../utils/jsonixUtils').toJsonixDocumentSentenceArray;
const toJsonixExcludesFEArray = require('./../utils/jsonixUtils').toJsonixExcludesFEArray;
const toJsonixFECoreSetArray = require('./../utils/jsonixUtils').toJsonixFECoreSetArray;
const toJsonixFECoreSetMemberArray = require('./../utils/jsonixUtils').toJsonixFECoreSetMemberArray;
const toJsonixFrameElementArray = require('./../utils/jsonixUtils').toJsonixFrameElementArray;
const toJsonixSemTypesSemTypeArray = require('./../utils/jsonixUtils').toJsonixSemTypesSemTypeArray;
const toJsonixLexUnitArray = require('./../utils/jsonixUtils').toJsonixLexUnitArray;
const toJsonixRequiresFEArray = require('./../utils/jsonixUtils').toJsonixRequiresFEArray;
const toJsonixSemTypeArray = require('./../utils/jsonixUtils').toJsonixSemTypeArray;
const toJsonixFERelationArray = require('./../utils/jsonixUtils').toJsonixFERelationArray;
const toJsonixFrameRelationArray = require('./../utils/jsonixUtils').toJsonixFrameRelationArray;
const toJsonixFrameRelationTypeArray = require('./../utils/jsonixUtils').toJsonixFrameRelationTypeArray;

const should = chai.should();

describe('jsonixUtils', () => {
  let jsonixSemTypes;
  let jsonixFrameRelations;
  let jsonixFrameRelationTypeArray;
  let jsonixFrameRelationArray;
  let jsonixFERelationArray;
  let jsonixFullText;
  let jsonixDocuments;
  let jsonixSentences;
  let jsonixFrame;
  let jsonixFrameElements;
  let jsonixFE;
  before(async () => {
    jsonixSemTypes = await marshaller.unmarshall('./tests/resources/semTypes.test.xml');
    jsonixFrameRelations = await marshaller.unmarshall('./tests/resources/frRelations.test.xml');
    jsonixFullText = await marshaller.unmarshall('./tests/resources/fulltext.test.xml');
    jsonixFrame = await marshaller.unmarshall('./tests/resources/frames.test.xml');
    jsonixFrameElements = toJsonixFrameElementArray(jsonixFrame);
    jsonixFE = jsonixFrameElements[0];
    jsonixDocuments = toJsonixDocumentArray(jsonixFullText.value.header.corpus[0]);
    jsonixFrameRelationTypeArray = toJsonixFrameRelationTypeArray(jsonixFrameRelations);
    jsonixFrameRelationArray = toJsonixFrameRelationArray(jsonixFrameRelationTypeArray[0]);
    jsonixFERelationArray = toJsonixFERelationArray(jsonixFrameRelationArray[0]);
    jsonixSentences = toJsonixDocumentSentenceArray(jsonixFullText);
  });
  it('#toJsonixExcludesFEArray should return an array of json objects', () => {
    toJsonixExcludesFEArray(jsonixFE).length.should.equal(2);
    toJsonixExcludesFEArray(jsonixFE)[0].id.should.equal(4926);
  });
  it('#toJsonixDocumentArray should return an array of json objects', () => {
    jsonixDocuments.length.should.equal(1);
    jsonixDocuments[0].id.should.equal(23802);
    jsonixDocuments[0].name.should.equal('112C-L012');
  });
  it('#toJsonixDocumentSentenceArray should return an array of json objects', () => {
    jsonixSentences.length.should.equal(3);
    jsonixSentences[0].id.should.equal(4106532);
  });
  it('#toJsonixFECoreSetArray should return an array of json objects', () => {
    toJsonixFECoreSetArray(jsonixFrame).length.should.equal(2);
  });
  it('#toJsonixFECoreSetMemberArray should return an array of json objects', () => {
    toJsonixFECoreSetMemberArray(toJsonixFECoreSetArray(jsonixFrame)[0]).length.should.equal(3);
    toJsonixFECoreSetMemberArray(toJsonixFECoreSetArray(jsonixFrame)[0])[0].id.should.equal(12492);
  });
  it('#toJsonixFERelationArray should return an array of json objects', () => {
    jsonixFERelationArray.length.should.equal(4);
    jsonixFERelationArray[0].id.should.equal(808);
    jsonixFERelationArray[0].subID.should.equal(2921);
    jsonixFERelationArray[0].supID.should.equal(1446);
  });
  it('#toJsonixFrameElementArray should return an array of json objects', () => {
    jsonixFrameElements.length.should.equal(3);
    jsonixFrameElements[0].id.should.equal(4929);
  });
  it('#toJsonixFrameRelationArray should return an array of json objects', () => {
    jsonixFrameRelationArray.length.should.equal(2);
    jsonixFrameRelationArray[0].id.should.equal(2);
    jsonixFrameRelationArray[0].subID.should.equal(341);
    jsonixFrameRelationArray[0].supID.should.equal(187);
  });
  it('#toJsonixFrameRelationTypeArray should return an array of json objects', () => {
    jsonixFrameRelationTypeArray.length.should.equal(3);
    jsonixFrameRelationTypeArray[0].id.should.equal(1);
    jsonixFrameRelationTypeArray[0].subFrameName.should.equal('Child');
    jsonixFrameRelationTypeArray[0].superFrameName.should.equal('Parent');
  });
  it('#toJsonixLexUnitArray should return an array of json objects', () => {
    toJsonixLexUnitArray(jsonixFrame).length.should.equal(4);
    toJsonixLexUnitArray(jsonixFrame)[0].id.should.equal(9291);
  });
  it('#toJsonixRequiresFEArray should return an array of json objects', () => {
    toJsonixRequiresFEArray(jsonixFE).length.should.equal(2);
    toJsonixRequiresFEArray(jsonixFE)[0].id.should.equal(4928);
  });
  it('#toJsonixSemTypeArray should return an array of json objects', () => {
    toJsonixSemTypeArray(jsonixFrame).length.should.equal(1);
    toJsonixSemTypeArray(jsonixFrame)[0].id.should.equal(175);
    toJsonixSemTypeArray(jsonixFE).length.should.equal(1);
    toJsonixSemTypeArray(jsonixFE)[0].id.should.equal(172);
  });
  it('#toJsonixSemTypesSemTypeArray should return an array of json objects', () => {
    const jsonixSemTypeArray = toJsonixSemTypesSemTypeArray(jsonixSemTypes);
    jsonixSemTypeArray.length.should.equal(6);
    jsonixSemTypeArray[0].id.should.equal(2);
    jsonixSemTypeArray[0].name.should.equal('Body_of_water');
  });
});
