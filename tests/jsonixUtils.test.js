'use strict';

import chai from 'chai';
import Promise from 'bluebird';
import jsonix from 'jsonix';
import jsonixUtils from './../utils/jsonixUtils';
import semTypeSchema from './../mappings/SemTypeSchema';

const Jsonix = jsonix.Jsonix;
const SemTypeSchema = semTypeSchema.SemTypeSchema;
const context = new Jsonix.Context([SemTypeSchema]);
const unmarshaller = context.createUnmarshaller();
const should = chai.should();

function unmarshall(file) {
  return new Promise((resolve, reject) => {
    try {
      unmarshaller.unmarshalFile(file, (unmarshalledFile) => {
        resolve(unmarshalledFile);
      });
    } catch (err) {
      reject(err);
    }
  });
}

describe('jsonixUtils', () => {
  let jsonixSemTypes;
  before(async() => {
    jsonixSemTypes = await unmarshall('./tests/resources/semTypes.test.xml');
  });
  it('#toJsonixSemTypesSemTypeArray should return an array of json objects', () => {
    const jsonixSemTypeArray = jsonixUtils.toJsonixSemTypesSemTypeArray(jsonixSemTypes);
    jsonixSemTypeArray.length.should.equal(6);
    jsonixSemTypeArray[0].id.should.equal(2);
    jsonixSemTypeArray[0].name.should.equal('Body_of_water');
  });
});
