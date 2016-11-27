/**
 * Behavior tests for importRelations script
 */
import { FERelation, FrameRelation, FrameRelationType, } from 'noframenet-core';
import chai from 'chai';
import rewire from 'rewire';
import { toJsonixFrameRelationArray, toJsonixFrameRelationTypeArray, } from './../utils/jsonixUtils';
import marshaller from './../marshalling/unmarshaller';

const should = chai.should();
const convertToFERelations = rewire('./../scripts/importRelations.js').__get__('convertToFERelations');
const convertToFrameRelations = rewire('./../scripts/importRelations.js').__get__('convertToFrameRelations');
const convertToRelationTypes = rewire('./../scripts/importRelations.js').__get__('convertToRelationTypes');

describe('importRelations', () => {
  let jsonixFrameRelations;
  let jsonixFrameRelationTypeArray;
  let jsonixFrameRelationArray;
  before(async () => {
    jsonixFrameRelations = await marshaller.unmarshall('./tests/resources/frRelations.test.xml');
    jsonixFrameRelationTypeArray = toJsonixFrameRelationTypeArray(jsonixFrameRelations);
    jsonixFrameRelationArray = toJsonixFrameRelationArray(jsonixFrameRelationTypeArray[0]);
  });
  it('#convertToFERelations should return a properly formatted array of FrameElementRelation objects', () => {
    const feRelations = convertToFERelations(jsonixFrameRelationArray[0]);
    feRelations.length.should.equal(4);
    feRelations[0]._id.should.equal(808);
    feRelations[0].subFE.should.equal(2921);
    feRelations[0].supFE.should.equal(1446);
    feRelations[0].frameRelation.should.equal(2);
  });
  it('#convertToFERelations should return plain javascript objects converted with Mongoose Document#toObject', () => {
    const feRelations = convertToFERelations(jsonixFrameRelationArray[0]);
    const testFERelation = new FERelation({
      _id: 123,
      subFE: 2921,
      supFE: 1446,
      frameRelation: 2,
    });
    (typeof feRelations[0])
      .should.equal(typeof testFERelation);
    feRelations[0].constructor.should.not.equal(FERelation);
    testFERelation.constructor.should.equal(FERelation);
  });
  it('#convertToFrameRelations should return a properly formatted array of FrameRelation objects', () => {
    const frameRelations = convertToFrameRelations(jsonixFrameRelationTypeArray[0], []);
    frameRelations.length.should.equal(2);
    frameRelations[0]._id.should.equal(2);
    frameRelations[0].subFrame.should.equal(341);
    frameRelations[0].supFrame.should.equal(187);
    frameRelations[0].type.should.equal(1);
  });
  it('#convertToFrameRelations should return plain javascript objects converted with Mongoose Document#toObject', () => {
    const frameRelations = convertToFrameRelations(jsonixFrameRelationTypeArray[0], []);
    const testFrameRelation = new FrameRelation({
      _id: 123,
      subFrame: 2921,
      supFrame: 1446,
      type: 2,
    });
    (typeof frameRelations[0])
      .should.equal(typeof testFrameRelation);
    frameRelations[0].constructor.should.not.equal(FrameRelation);
    testFrameRelation.constructor.should.equal(FrameRelation);
  });
  it('#convertToRelationTypes should return a properly formatted array of FrameRelationType objects', () => {
    const relationTypes = convertToRelationTypes(jsonixFrameRelations, [], []);
    relationTypes.length.should.equal(3);
    relationTypes[0]._id.should.equal(1);
    relationTypes[0].name.should.equal('Inheritance');
    relationTypes[0].subFrameName.should.equal('Child');
    relationTypes[0].supFrameName.should.equal('Parent');
  });
  it('#convertToRelationTypes should return plain javascript objects converted with Mongoose Document#toObject', () => {
    const relationTypes = convertToRelationTypes(jsonixFrameRelations, [], []);
    const testFrameRelationType = new FrameRelationType({
      _id: 123,
      name: 'test',
      subFrameName: 'sub',
      supFrameName: 'sup',
    });
    (typeof relationTypes[0])
      .should.equal(typeof testFrameRelationType);
    relationTypes[0].constructor.should.not.equal(FrameRelationType);
    testFrameRelationType.constructor.should.equal(FrameRelationType);
  });
});
