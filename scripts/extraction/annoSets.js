const AnnotationSet = require('noframenet-core').AnnotationSet;
const Label = require('noframenet-core').Label;
const Pattern = require('noframenet-core').Pattern;
const ValenceUnit = require('noframenet-core').ValenceUnit;
const toJsonixLabelArray = require('./../../utils/jsonixUtils').toJsonixLabelArray;
const toJsonixLayerArray = require('./../../utils/jsonixUtils').toJsonixLayerArray;
const toJsonixSentenceAnnoSetArray = require('./../../utils/jsonixUtils').toJsonixSentenceAnnoSetArray;
const config = require('./../../config');

const logger = config.logger;

function isValidFNAnnoSet(jsonixAnnoSet) {
  let isValidFELayer = false;
  let isValidPTLayer = false;
  let isValidGFLayer = false;
  toJsonixLayerArray(jsonixAnnoSet).forEach((jsonixLayer) => {
    if (jsonixLayer.name === 'FE' && jsonixLayer.label) {
      isValidFELayer = true;
    }
    if (jsonixLayer.name === 'PT') {
      isValidPTLayer = true;
    }
    if (jsonixLayer.name === 'GF') {
      isValidGFLayer = true;
    }
  });
  if (isValidFELayer && isValidPTLayer && isValidGFLayer) {
    return true;
  }
  return false;
}

function getLabelObjectsMap(jsonixAnnoSet) {
  const labelOmap = new Map();
  toJsonixLayerArray(jsonixAnnoSet).forEach((jsonixLayer) => {
    toJsonixLabelArray(jsonixLayer).forEach((jsonixLabel) => {
      if ((jsonixLabel.start !== undefined && jsonixLabel.end !== undefined) ||
          jsonixLabel.itype !== undefined) {
        const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
        if (!labelOmap.has(key)) {
          labelOmap.set(key, {});
        }
        if (jsonixLayer.name === 'FE') {
          labelOmap.get(key).FE = jsonixLabel.feID;
        } else if (jsonixLabel.itype !== undefined) {
          // iType is PT. See lexUnits xml files.
          labelOmap.get(key).PT = jsonixLabel.itype;
        } else {
          labelOmap.get(key)[jsonixLayer.name] = jsonixLabel.name;
        }
      }
    });
  });
  return labelOmap;
}

function getPatternKey(vuIDs) {
  return vuIDs.map(vuID => vuID.toString()).sort().join('#');
}

function getVUids(jsonixAnnoSet, valenceUnitsMap) {
  return Array.from(getLabelObjectsMap(jsonixAnnoSet).values()).map((labelO) => {
    const key = `${labelO.FE}#${labelO.PT}#${labelO.GF}`;
    if (!valenceUnitsMap.has(key)) {
      valenceUnitsMap.set(key, new ValenceUnit({
        FE: labelO.FE,
        PT: labelO.PT,
        GF: labelO.GF,
      }).toObject());
    }
    return valenceUnitsMap.get(key)._id;
  });
}

function getPatternID(jsonixAnnoSet, patternsMap, valenceUnitsMap) {
  const vuIDs = getVUids(jsonixAnnoSet, valenceUnitsMap);
  if (vuIDs.length === 0) {
    logger.error(`vuIDs.length === 0 in annoationSet.id = ${jsonixAnnoSet.id}`);
  }
  const key = getPatternKey(vuIDs);
  if (!patternsMap.has(key)) {
    patternsMap.set(key, new Pattern({
      valenceUnits: vuIDs,
    }).toObject());
  }
  return patternsMap.get(key)._id;
}

function getLabelIDs(jsonixAnnoSet, labels) {
  return toJsonixLayerArray(jsonixAnnoSet)
    .map(jsonixLayer => toJsonixLabelArray(jsonixLayer)
      .map((jsonixLabel) => {
        const label = new Label({
          name: jsonixLabel.name,
          type: jsonixLayer.name,
          rank: jsonixLayer.rank,
          startPos: jsonixLabel.start,
          endPos: jsonixLabel.end,
        }).toObject();
        labels.push(label);
        return label._id;
      })).reduce((a, b) => a.concat(b));
}

function processAnnotationSets(jsonixSentence, annoSetsMap, labels, lexUnitID,
                               patternsMap, valenceUnitsMap) {
  // In FrameNet 1.5 there are collisions in AnnotationSet IDs. This will
  // replace all collisions by fullText references as fullText import is
  // processed after lexUnit import
  toJsonixSentenceAnnoSetArray(jsonixSentence).forEach((jsonixAnnoSet) => {
    const annoSet = new AnnotationSet({
      _id: jsonixAnnoSet.id,
      lexUnit: jsonixAnnoSet.luID ? jsonixAnnoSet.luID : lexUnitID,
      sentence: jsonixSentence.id,
      labels: getLabelIDs(jsonixAnnoSet, labels),
    }).toObject();
    if (isValidFNAnnoSet(jsonixAnnoSet)) {
      annoSet.pattern = getPatternID(jsonixAnnoSet, patternsMap, valenceUnitsMap);
    }
    annoSetsMap.set(Number(jsonixAnnoSet.id), annoSet); // Replace if found
  });
}

module.exports = {
  processAnnotationSets,
};
