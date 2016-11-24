/**
 * Behavior tests for importSemTypes script
 */
import chai from 'chai';
import mochAsync from './async.test';
import rewire from 'rewire';
import marshaller from './../marshalling/unmarshaller';

const should = chai.should();
const getSemTypes = rewire('./../scripts/importSemTypes.js').__get__('getSemTypes');

describe('importSemTypes', () => {
  let jsonixSemTypes;
  before(mochAsync(async () => {
    jsonixSemTypes = await marshaller
      .unmarshall('./tests/resources/semTypes.test.xml');
  }));
  it('#getSemTypes should return a properly formatted array of SemType objects', () => {
    const semTypes = getSemTypes(jsonixSemTypes);
    semTypes.length.should.equal(6);
    semTypes[0]._id.should.equal(2);
    semTypes[0].name.should.equal('Body_of_water');
    semTypes[0].superTypes.length.should.equal(1);
    semTypes[0].superTypes[0].should.equal(17);
  });
});
