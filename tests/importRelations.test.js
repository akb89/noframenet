/**
 * Behavior test for importRelations script
 */
import {
  FrameElementRelation,
  FrameRelation,
  FrameRelationType,
} from 'noframenet-core';
import {
  toJsonixFrameElementRelationArray,
  toJsonixFrameRelationArray,
  toJsonixFrameRelationTypeArray,
} from './../utils//jsonixUtils';
import {
  convertToFERelations,
  convertToFrameRelations,
  convertToRelationTypes,
} from './../scripts/importRelations';
import {
  unmarshall,
} from './../marshalling/unmarshaller';
import chai from 'chai';
import mochAsync from './async.test';

const should = chai.should();

describe('importRelations', () => {
  let jsonixFrameRelations;
  let jsonixFrameRelationTypeArray;
  let jsonixFrameRelationArray;
  let jsonixFERelationArray;
  before(mochAsync(async() => {
    jsonixFrameRelations = await unmarshall('./tests/resources/frRelations.test.xml');
    jsonixFrameRelationTypeArray = toJsonixFrameRelationTypeArray(jsonixFrameRelations);
    jsonixFrameRelationArray = toJsonixFrameRelationArray(jsonixFrameRelationTypeArray[0]);
    jsonixFERelationArray = toJsonixFrameElementRelationArray(jsonixFrameRelationArray[0]);
  }));
  it('#convertToFERelations should return a properly formatted array of FrameElementRelation objects', () => {
    const feRelations = convertToFERelations(jsonixFERelationArray);
    feRelations.length.should.equal(4);
    feRelations[0]._id.should.equal(808)
    feRelations[0].subFE.should.equal(2921)
    feRelations[0].supFE.length.should.equal(1446);
    feRelations[0].frameRelation.should.equal(2);
  });
  it('#convertToFrameRelations should return a properly formatted array of FrameRelation objects', () => {
    const frameRelations = convertToFrameRelations(toJsonixFrameRelationArray);
    frameRelations.length.should.equal(2);
    frameRelations[0]._id.should.equal(2);
    frameRelations[0].subFrame.should.equal(341);
    frameRelations[0].supFrame.should.equal(187);
    frameRelations[0].type.should.equal(1);
  });
  it('#convertToRelationTypes should return a properly formatted array of FrameRelationType objects', () => {
    const relationTypes = convertToRelationTypes(toJsonixFrameRelationTypeArray);
    relationTypes.length.should.equal(3);
    relationsTypes[0]._id.should.equal(1);
    relationsTypes[0].name.should.equal('Inheritance');
    relationsTypes[0].subFrameName.should.equal('Child');
    relationsTypes[0].supFrameName.should.equal('Parent');
  });
});
