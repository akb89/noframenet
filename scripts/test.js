import { AnnotationSet, Frame, FrameElement, Label, Pattern, Sentence, ValenceUnit } from 'noframenet-core';
import config from './../config';
import driver from './../db/mongo';

// A Map of FEName -> full noframenet-core.FrameElement
async function getFEMap(frameID) {
  const feMap = new Map();
  console.log('frameID = ' + frameID);
  const frame = await Frame.findOne().where('_id').equals(frameID);
  console.log('frame._id = ' + frame._id);
  const fes = await FrameElement.find().where('_id').in(frame.frameElements);
  fes.forEach((fe) => {
    feMap.set(fe.name, fe);
  });
  return feMap;
}

async function test() {
  console.log('testing');
  const db = await driver.connectToDatabase(config.default.dbUri);
  const feMap = await getFEMap(2031);
  console.log('Fetched MAP');
  feMap.forEach((value, key) => {
    console.log('key = ' + key);
    console.log('value._id = ' + value._id);
  });
  db.mongo.close();
  db.mongoose.disconnect();
}

test().then(console.log('OK'));
