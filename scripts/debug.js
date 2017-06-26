const mongoose = require('mongoose');
const bluebird = require('bluebird');
const driver = require('./../db/mongo');

mongoose.set('debug', true);
mongoose.Promise = bluebird;

const frameElementSchema = mongoose.Schema({
  _id: {
    type: Number,
  },
  name: {
    type: String,
    index: true,
  },
  definition: {
    type: String,
  },
  coreType: {
    type: String,
    index: true,
  },
  cBy: {
    type: String,
  },
  cDate: {
    type: String,
  },
  fgColor: {
    type: String,
  },
  bgColor: {
    type: String,
  },
  abbrev: {
    type: String,
    index: true,
  },
  requires: [{
    type: Number,
    ref: 'FrameElement',
  }],
  excludes: [{
    type: Number,
    ref: 'FrameElement',
  }],
  semTypes: [{
    type: Number,
    ref: 'SemType',
  }],
});

frameElementSchema.index({
  requires: 1,
});
frameElementSchema.index({
  excludes: 1,
});
frameElementSchema.index({
  semTypes: 1,
});
frameElementSchema.index({
  _id: 1,
}, {
  unique: true,
});

const FrameElement = mongoose.model('FrameElement', frameElementSchema);

async function save() {
  await driver.connectToDatabase('mongodb://localhost:27017/fn_en_d150_dev');
  const test = new FrameElement();
  //await testAnno.save();
}


if (require.main === module) {
  save().then();
}
