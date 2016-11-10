import Promise from 'bluebird'
import jsonix from 'jsonix';
import frameSchema from './../mappings/FrameSchema';
import frameRelationSchema from './../mappings/FrameRelationSchema';
import fullTextSchema from './../mappings/FullTextSchema';
import lexUnitSchema from './../mappings/LexUnitSchema';
import semTypeSchema from './../mappings/SemTypeSchema';

const Jsonix = jsonix.Jsonix;
const FrameSchema = frameSchema.FrameSchema;
const FrameRelationSchema = frameRelationSchema.FrameRelationSchema;
const FullTextSchema = fullTextSchema.FullTextSchema;
const LexUnitSchema = lexUnitSchema.LexUnitSchema;
const SemTypeSchema = semTypeSchema.SemTypeSchema;
const context = new Jsonix.Context([FrameSchema, FrameRelationSchema, FullTextSchema, LexUnitSchema, SemTypeSchema]);
const unmarshaller = context.createUnmarshaller();

export function unmarshall(file) {
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
