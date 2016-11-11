'use strict';

import chai from 'chai';
import {
  toJsonixDocumentArray,
  toJsonixDocumentSentenceArray,
  toJsonixFERelationArray,
  toJsonixFrameRelationArray,
  toJsonixFrameRelationTypeArray,
  toJsonixSemTypesSemTypeArray,
} from './../utils/jsonixUtils';
import {
  unmarshall,
} from './../marshalling//unmarshaller';

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
  before(async() => {
    jsonixSemTypes = await unmarshall('./tests/resources/semTypes.test.xml');
    jsonixFrameRelations = await unmarshall('./tests/resources/frRelations.test.xml');
    jsonixFullText = await unmarshall('./tests/resources/fulltext.test.xml');
    jsonixDocuments = toJsonixDocumentArray(jsonixFullText.value.header.corpus[0]);
    jsonixFrameRelationTypeArray = toJsonixFrameRelationTypeArray(jsonixFrameRelations);
    jsonixFrameRelationArray = toJsonixFrameRelationArray(jsonixFrameRelationTypeArray[0]);
    jsonixFERelationArray = toJsonixFERelationArray(jsonixFrameRelationArray[0]);
    jsonixSentences = toJsonixDocumentSentenceArray(jsonixFullText);
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
  it('#toJsonixFERelationArray should return an array of json objects', () => {
    jsonixFERelationArray.length.should.equal(4);
    jsonixFERelationArray[0].id.should.equal(808);
    jsonixFERelationArray[0].subID.should.equal(2921);
    jsonixFERelationArray[0].supID.should.equal(1446);
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
  it('#toJsonixSemTypesSemTypeArray should return an array of json objects', () => {
    const jsonixSemTypeArray = toJsonixSemTypesSemTypeArray(jsonixSemTypes);
    jsonixSemTypeArray.length.should.equal(6);
    jsonixSemTypeArray[0].id.should.equal(2);
    jsonixSemTypeArray[0].name.should.equal('Body_of_water');
  });
});
