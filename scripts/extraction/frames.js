/**
 * Standalone script to import FrameNet frames to MongoDB.
 */
const Frame = require('noframenet-core').Frame;
const FrameElement = require('noframenet-core').FrameElement;
const Lexeme = require('noframenet-core').Lexeme;
const LexUnit = require('noframenet-core').LexUnit;
const ProgressBar = require('ascii-progress');
const toJsonixExcludesFEArray = require('./../../utils/jsonixUtils').toJsonixExcludesFEArray;
const toJsonixFECoreSetArray = require('./../../utils/jsonixUtils').toJsonixFECoreSetArray;
const toJsonixFECoreSetMemberArray = require('./../../utils/jsonixUtils').toJsonixFECoreSetMemberArray;
const toJsonixFrameElementArray = require('./../../utils/jsonixUtils').toJsonixFrameElementArray;
const toJsonixLexemeArray = require('./../../utils/jsonixUtils').toJsonixLexemeArray;
const toJsonixLexUnitArray = require('./../../utils/jsonixUtils').toJsonixLexUnitArray;
const toJsonixRequiresFEArray = require('./../../utils/jsonixUtils').toJsonixRequiresFEArray;
const toJsonixSemTypeArray = require('./../../utils/jsonixUtils').toJsonixSemTypeArray;
const config = require('./../../config');
const marshaller = require('./../../marshalling/unmarshaller');
const utils = require('./../../utils/utils');

const logger = config.logger;

function getSemTypeIDs(jsonixElement) {
  return toJsonixSemTypeArray(jsonixElement)
    .map(jsonixSemType => jsonixSemType.id);
}

function getLexemeIDs(jsonixLexUnit, lexemes) {
  return toJsonixLexemeArray(jsonixLexUnit)
    .map((jsonixLexeme) => {
      const lexeme = new Lexeme({
        name: jsonixLexeme.name,
        pos: jsonixLexeme.pos,
        headword: jsonixLexeme.headword,
        order: jsonixLexeme.order,
        breakBefore: jsonixLexeme.breakBefore,
      }).toObject();
      lexemes.push(lexeme);
      return lexeme._id;
    });
}

function getLexUnitIDs(jsonixFrame, lexUnitsMap, lexemes) {
  return toJsonixLexUnitArray(jsonixFrame).map((jsonixLexUnit) => {
    const lexUnitID = Number(jsonixLexUnit.id);
    if (!lexUnitsMap.has(lexUnitID)) {
      lexUnitsMap.set(lexUnitID, new LexUnit({
        _id: jsonixLexUnit.id,
        name: jsonixLexUnit.name,
        pos: jsonixLexUnit.pos,
        definition: jsonixLexUnit.definition,
        lemmaID: jsonixLexUnit.lemmaID,
        frame: jsonixFrame.value.id,
        status: jsonixLexUnit.status,
        cBy: jsonixLexUnit.cBy,
        cDate: jsonixLexUnit.cDate,
        lexemes: getLexemeIDs(jsonixLexUnit, lexemes),
        semTypes: getSemTypeIDs(jsonixLexUnit),
      }).toObject());
    }
    return lexUnitID;
  });
}

function getFEcoreSetIDs(jsonixFrame) {
  return toJsonixFECoreSetArray(jsonixFrame)
    .map(jsonixFECoreSet => toJsonixFECoreSetMemberArray(jsonixFECoreSet)
      .map(jsonixFE => jsonixFE.id));
}

function getExcludeIDs(jsonixFE) {
  return toJsonixExcludesFEArray(jsonixFE)
    .map(jsonixExcludesFE => jsonixExcludesFE.id);
}

function getRequireIDs(jsonixFE) {
  return toJsonixRequiresFEArray(jsonixFE)
    .map(jsonixRequiresFE => jsonixRequiresFE.id);
}

function getFEids(jsonixFrame, fesMap) {
  return toJsonixFrameElementArray(jsonixFrame).map((jsonixFE) => {
    const feID = Number(jsonixFE.id);
    if (!fesMap.has(feID)) {
      fesMap.set(feID, new FrameElement({
        _id: jsonixFE.id,
        name: jsonixFE.name,
        definition: jsonixFE.definition,
        coreType: jsonixFE.coreType,
        cDate: jsonixFE.cDate,
        cBy: jsonixFE.cBy,
        fgColor: jsonixFE.fgColor,
        bgColor: jsonixFE.bgColor,
        abbrev: jsonixFE.abbrev,
        requires: getRequireIDs(jsonixFE),
        excludes: getExcludeIDs(jsonixFE),
        semTypes: getSemTypeIDs(jsonixFE),
      }).toObject());
    }
    return feID;
  });
}

function extractFrame(jsonixFrame, framesMap, fesMap, lexUnitsMap, lexemes) {
  const frameID = Number(jsonixFrame.value.id);
  framesMap.set(frameID, new Frame({
    _id: jsonixFrame.value.id,
    name: jsonixFrame.value.name,
    definition: jsonixFrame.value.definition,
    cDate: jsonixFrame.value.cDate,
    cBy: jsonixFrame.value.cBy,
    frameElements: getFEids(jsonixFrame, fesMap),
    feCoreSets: getFEcoreSetIDs(jsonixFrame),
    lexUnits: getLexUnitIDs(jsonixFrame, lexUnitsMap, lexemes),
    semTypes: getSemTypeIDs(jsonixFrame),
  }));
}

async function extractBatch(batch, framesMap, fesMap, lexUnitsMap, lexemes) {
  await Promise.all(batch.map(async (file) => {
    const jsonixFrame = await marshaller.unmarshall(file);
    extractFrame(jsonixFrame, framesMap, fesMap, lexUnitsMap, lexemes);
  }));
}

/**
 * Only import info related to Frames, FEs, LexUnits and Lexemes. Info
 * regarding relations will be imported in separate scripts.
 */
async function extractBatchSet(batchSet, framesMap, fesMap, lexUnitsMap, lexemes) {
  let counter = 1;
  const frameProgressBar = new ProgressBar({
    total: batchSet.length,
    clean: true,
  });
  logger.info('Extracting frames by batch...');
  for (const batch of batchSet) {
    logger.debug(`Extracting frame batch ${counter} out of ${batchSet.length}...`);
    await extractBatch(batch, framesMap, fesMap, lexUnitsMap, lexemes);
    counter += 1;
    frameProgressBar.tick();
  }
}

async function extractFrames(frameDir, chunkSize, framesMap, fesMap, lexUnitsMap, lexemes) {
  let batchSet;
  try {
    batchSet = await utils.filterAndChunk(frameDir, chunkSize);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await extractBatchSet(batchSet, framesMap, fesMap, lexUnitsMap, lexemes);
}

module.exports = {
  extractFrames,
};
