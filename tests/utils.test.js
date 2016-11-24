import chai from 'chai';
import fs from 'fs';
import utils from '../utils/utils';
import mochAsync from './async.test';

const should = chai.should();

describe('utils', () => {
  before(() => {
    fs.mkdirSync('./tests/resources/tmp');
    for (let i = 0; i < 10; i += 1) {
      fs.openSync(`./tests/resources/tmp/${i}.xml`, 'w');
    }
    fs.openSync('./tests/resources/tmp/filtered.xsd', 'w');
  });
  after(() => {
    for (let i = 0; i < 10; i += 1) {
      fs.unlinkSync(`./tests/resources/tmp/${i}.xml`);
    }
    fs.unlinkSync('./tests/resources/tmp/filtered.xsd');
    fs.rmdirSync('./tests/resources/tmp');
  });
  it('#filterAndChunk should return an array of 5 chunks containing 2 files each, without the .xsd file', mochAsync(async () => {
    const chunks = await utils.filterAndChunk('./tests/resources/tmp', 2);
    chunks.length.should.equal(5);
    chunks.forEach((chunk) => {
      chunk.length.should.equal(2);
    });
    chunks.reduce((a, b) => a.concat(b))
      .length.should.equal(10);
    chunks.reduce((a, b) => a.concat(b))
      .forEach((file) => {
        file.endsWith('.xml')
          .should.be.true;
      });
  }));
});
