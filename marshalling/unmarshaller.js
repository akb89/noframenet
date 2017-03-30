const Promise = require('bluebird');
const jsonix = require('jsonix');
const frameSchema = require('./../mappings/FrameSchema');
const frameRelationSchema = require('./../mappings/FrameRelationSchema');
const fullTextSchema = require('./../mappings/FullTextSchema');
const lexUnitSchema = require('./../mappings/LexUnitSchema');
const semTypeSchema = require('./../mappings/SemTypeSchema');

const Jsonix = jsonix.Jsonix;
const FrameSchema = frameSchema.FrameSchema;
const FrameRelationSchema = frameRelationSchema.FrameRelationSchema;
const FullTextSchema = fullTextSchema.FullTextSchema;
const LexUnitSchema = lexUnitSchema.LexUnitSchema;
const SemTypeSchema = semTypeSchema.SemTypeSchema;
const context = new Jsonix.Context([
  FrameSchema,
  FrameRelationSchema,
  FullTextSchema,
  LexUnitSchema,
  SemTypeSchema,
]);
const unmarshaller = context.createUnmarshaller();

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

module.exports = {
  unmarshall,
};
