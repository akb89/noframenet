/**
 * A script to fix the FrameNet database
 */
import { Pattern, ValenceUnit } from 'noframenet-core';
import config from './../config';
import driver from './../db/mongo';

const logger = config.default.logger;

async function getGFSet() {
  return ValenceUnit
    .aggregate([{
      $group: {
        _id: '$GF',
      },
    }]);
}

async function getPTSet() {
  return ValenceUnit
    .aggregate([{
      $group: {
        _id: '$PT',
      },
    }]);
}

async function getFESet() {
  return ValenceUnit
    .aggregate([{
      $group: {
        _id: '$FE',
      },
    }]);
}

async function check() { // eslint-disable-line
  let feSet = await getFESet();
  feSet = Array.from(feSet)
    .map(vu => vu._id);
  logger.info(`FESet length = ${feSet.length}`);
  let ptSet = await getPTSet();
  ptSet = Array.from(ptSet)
    .map(vu => vu._id);
  logger.info(`PTSet length = ${ptSet.length}`);
  let gfSet = await getGFSet();
  gfSet = Array.from(gfSet)
    .map(vu => vu._id);
  logger.info(`GFSet length = ${gfSet.length}`);
  const fept = new Set([...feSet].filter(x => ptSet.has(x)));
  const fegf = new Set([...feSet].filter(x => gfSet.has(x)));
  const ptgf = new Set([...ptSet].filter(x => gfSet.has(x)));
  logger.info(`FEPTSet intersection = ${fept.length}`);
  logger.info(`FEGFSet intersection = ${fegf.length}`);
  logger.info(`PTGFSet intersection = ${ptgf.length}`);
  logger.info(`PTGFSet = ${ptgf.toArray()}`);
  const wrongpt = await ValenceUnit.find({
    PT: 'Obj',
  });
  logger.info(`Wrong PT = ${wrongpt.length}`);
  logger.info(`Wrong VU = ${wrongpt}`);
}

/**
 * In FrameNet 1.6 there is one valenceUnit with a wrong PT:
 * vu = { _id: ...,
 * FE: 'Activity',
 * PT: 'Obj',
 * GF: 'Obj' }
 * @method fixOnceConnectedToDB
 * @return {Promise}              [description]
 */
async function fixOnceConnectedToDB() {
  const wrongPTVU = await ValenceUnit.findOne({
    FE: 'Activity',
    PT: 'Obj',
    GF: 'Obj',
  });
  const correctPTVU = await ValenceUnit.findOne({
    FE: 'Activity',
    PT: 'NP',
    GF: 'Obj',
  });
  const wrongpatterns = await Pattern.find({
    valenceUnits: wrongPTVU,
  });
  await Pattern.update({
    _id: {
      $in: wrongpatterns,
    },
    valenceUnits: wrongPTVU,
  }, {
    $set: {
      'valenceUnits.$': correctPTVU,
    },
  });
  await ValenceUnit.remove(wrongPTVU);
}

async function fix(dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  await fixOnceConnectedToDB();
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  fix(config.default.dbUri);
}

export default {
  fixOnceConnectedToDB,
};
