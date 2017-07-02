/**
 * Standalone script to import the content of frRelation.xml to MongoDB
 */
const FERelation = require('noframenet-core').FERelation;
const FrameRelation = require('noframenet-core').FrameRelation;
const FrameRelationType = require('noframenet-core').FrameRelationType;
const toJsonixFERelationArray = require('./../../utils/jsonixUtils').toJsonixFERelationArray;
const toJsonixFrameRelationArray = require('./../../utils/jsonixUtils').toJsonixFrameRelationArray;
const toJsonixFrameRelationTypeArray = require('./../../utils/jsonixUtils').toJsonixFrameRelationTypeArray;
const config = require('./../../config');
const marshaller = require('./../../marshalling/unmarshaller');

const logger = config.logger;

function getFERelations(jsonixFrameRelation) {
  return toJsonixFERelationArray(jsonixFrameRelation)
    .map(jsonixFERelation => new FERelation({
      _id: jsonixFERelation.id,
      subFE: jsonixFERelation.subID,
      supFE: jsonixFERelation.supID,
      frameRelation: jsonixFrameRelation.id,
    }).toObject());
}

function getFrameRelations(jsonixFrameRelationType, feRelations) {
  return toJsonixFrameRelationArray(jsonixFrameRelationType)
    .map((jsonixFrameRelation) => {
      feRelations.push(...getFERelations(jsonixFrameRelation));
      return new FrameRelation({
        _id: jsonixFrameRelation.id,
        subFrame: jsonixFrameRelation.subID,
        supFrame: jsonixFrameRelation.supID,
        type: jsonixFrameRelationType.id,
      }).toObject();
    });
}

function getRelationTypes(jsonixFrameRelations, frameRelations,
                          feRelations) {
  return toJsonixFrameRelationTypeArray(jsonixFrameRelations)
    .map((jsonixFrameRelationType) => {
      frameRelations.push(...getFrameRelations(jsonixFrameRelationType,
                                               feRelations));
      return new FrameRelationType({
        _id: jsonixFrameRelationType.id,
        name: jsonixFrameRelationType.name,
        subFrameName: jsonixFrameRelationType.subFrameName,
        supFrameName: jsonixFrameRelationType.superFrameName,
      }).toObject();
    });
}

function extractRelationTypes(jsonixFrameRelations, frameRelationTypes,
                              frameRelations, feRelations) {
  frameRelationTypes.push(...getRelationTypes(jsonixFrameRelations,
                                              frameRelations,
                                              feRelations));
}

async function extractRelations(relationsFilePath, frameRelationTypes,
                                frameRelations, feRelations) {
  logger.info(`Extracting relations from file: ${relationsFilePath}`);
  let jsonixFrameRelations;
  try {
    jsonixFrameRelations = await marshaller.unmarshall(relationsFilePath);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  extractRelationTypes(jsonixFrameRelations, frameRelationTypes,
                       frameRelations, feRelations);
}

module.exports = {
  extractRelations,
};
