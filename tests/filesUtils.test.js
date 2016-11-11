import chai from 'chai';
import fs from 'fs';
import {
  filterAndChunk,
} from './../utils/filesUtils';
import './../utils/utils'; // for flatten
import mochAsync from './async.test';

const should = chai.should();

describe('filesUtils', () => {
  before(() => {
    fs.mkdirSync('./tests/resources/tmp');
    for (let i = 0; i < 10; i += 1) {
      fs.openSync('./tests/resources/tmp/' + i + '.xml', 'w');
    }
    fs.openSync('./tests/resources/tmp/filtered.xsd', 'w');
  });
  after(() => {
    for (let i = 0; i < 10; i += 1) {
      fs.unlinkSync('./tests/resources/tmp/' + i + '.xml');
    }
    fs.unlinkSync('./tests/resources/tmp/filtered.xsd');
    fs.rmdirSync('./tests/resources/tmp');
  });
  it('#filterAndChunk should return an array of 5 chunks containing 2 files each, without the .xsd file', mochAsync(async() => {
    const chunks = await filterAndChunk('./tests/resources/tmp', 2);
    chunks.length.should.equal(5);
    chunks.forEach((chunk) => {
      chunk.length.should.equal(2);
    });
    chunks.flatten().length.should.equal(10);
    chunks.flatten().forEach((file) => {
      file.endsWith('.xml').should.be.true;
    });
  }));
});
