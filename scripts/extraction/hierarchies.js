const FEHierarchy = require('noframenet-core').FEHierarchy;
const FrameHierarchy = require('noframenet-core').FrameHierarchy;
const FRTYPE_NAMES_FOR_FRAME_HIERARCHY = require('../../utils/constants').FRTYPE_NAMES_FOR_FRAME_HIERARCHY;
const FRTYPE_NAMES_FOR_FE_HIERARCHY = require('../../utils/constants').FRTYPE_NAMES_FOR_FE_HIERARCHY;
const config = require('./../../config');

const logger = config.logger;

function getRelatives(itemName, childrenParentsMap, type, visitedSet) {
  if (!childrenParentsMap.has(itemName)) {
    return [];
  }
  return Array.from(childrenParentsMap.get(itemName)).reduce((array, item) => {
    if (!visitedSet.has(item)) {
      visitedSet.add(item);
      array.push({
        name: item,
        [type]: getRelatives(item, childrenParentsMap, type, visitedSet),
      });
    }
    return array;
  }, []);
}

function fillFEhierarchyMap(feHierarchyMap, fesMap, parentsMap, childrenMap) {
  fesMap.forEach((fe) => {
    if (!feHierarchyMap.has(fe.name)) {
      const visitedSet = new Set([fe.name]);
      feHierarchyMap.set(fe.name, new FEHierarchy({
        name: fe.name,
        parents: getRelatives(fe.name, parentsMap, 'parents', visitedSet),
        children: getRelatives(fe.name, childrenMap, 'children', visitedSet),
      }));
    }
  });
  return feHierarchyMap;
}

function fillFrameHierarchyMap(frameHierarchyMap, framesMap, parentsMap,
                               childrenMap) {
  framesMap.forEach((frame) => {
    if (!frameHierarchyMap.has(frame.name)) {
      const visitedSet = new Set([frame.name]);
      frameHierarchyMap.set(frame.name, new FrameHierarchy({
        name: frame.name,
        parents: getRelatives(frame.name, parentsMap, 'parents', visitedSet),
        children: getRelatives(frame.name, childrenMap, 'children', visitedSet),
      }));
    }
  });
  return frameHierarchyMap;
}

function getFEparentsChildrenMaps(feRelations, frIDset, fesMap) {
  const parentsMap = new Map();
  const childrenMap = new Map();
  feRelations.forEach((feRelation) => {
    if (frIDset.has(feRelation.frameRelation)) {
      const supFEname = fesMap.get(feRelation.supFE).name;
      const subFEname = fesMap.get(feRelation.subFE).name;
      if (subFEname !== supFEname) {
        if (!childrenMap.has(supFEname)) {
          childrenMap.set(supFEname, new Set([subFEname]));
        } else {
          childrenMap.get(supFEname).add(subFEname);
        }
        if (!parentsMap.has(subFEname)) {
          parentsMap.set(subFEname, new Set([supFEname]));
        } else {
          parentsMap.get(subFEname).add(supFEname);
        }
      }
    }
  });
  return { parentsMap, childrenMap };
}

function getFrameParentsChildrenMaps(frameRelations, frTypesIDset, framesMap) {
  const parentsMap = new Map();
  const childrenMap = new Map();
  frameRelations.forEach((frameRelation) => {
    if (frTypesIDset.has(frameRelation.type)) {
      const supFrameName = framesMap.get(frameRelation.supFrame).name;
      const subFrameName = framesMap.get(frameRelation.subFrame).name;
      if (!childrenMap.has(supFrameName)) {
        childrenMap.set(supFrameName, new Set([subFrameName]));
      } else {
        childrenMap.get(supFrameName).add(subFrameName);
      }
      if (!parentsMap.has(subFrameName)) {
        parentsMap.set(subFrameName, new Set([supFrameName]));
      } else {
        parentsMap.get(subFrameName).add(supFrameName);
      }
    }
  });
  return { parentsMap, childrenMap };
}

function getFRidSet(frameRelations, frTypesIDset) {
  return frameRelations.reduce((frSet, frameRelation) => {
    if (frTypesIDset.has(frameRelation.type)) {
      frSet.add(frameRelation._id);
    }
    return frSet;
  }, new Set());
}

function getFRtypesIDset(frameRelationTypes, frtypeNames) {
  return frameRelationTypes.reduce((idSet, relationType) => {
    if (frtypeNames.includes(relationType.name)) {
      idSet.add(relationType._id);
    }
    return idSet;
  }, new Set());
}

function extractFEhierarchy(feRelations, frameRelations, frameRelationTypes,
                            fesMap, feHierarchyMap) {
  const frTypesIDset = getFRtypesIDset(frameRelationTypes, FRTYPE_NAMES_FOR_FE_HIERARCHY);
  const frIDset = getFRidSet(frameRelations, frTypesIDset);
  const { parentsMap, childrenMap } = getFEparentsChildrenMaps(feRelations,
                                                               frIDset, fesMap);
  fillFEhierarchyMap(feHierarchyMap, fesMap, parentsMap, childrenMap);
}

function extractFrameHierarchy(frameRelations, frameRelationTypes, framesMap,
                               frameHierarchyMap) {
  const frTypesIDset = getFRtypesIDset(frameRelationTypes, FRTYPE_NAMES_FOR_FRAME_HIERARCHY);
  const { parentsMap, childrenMap } = getFrameParentsChildrenMaps(frameRelations,
                                                                  frTypesIDset,
                                                                  framesMap);
  fillFrameHierarchyMap(frameHierarchyMap, framesMap, parentsMap, childrenMap);
}

function extractHierarchies(feRelations, frameRelations, frameRelationTypes,
                            framesMap, fesMap, frameHierarchyMap,
                            feHierarchyMap) {
  logger.info('Extracting hierarchies...');
  logger.info('Extracting frames hierarchy...');
  extractFrameHierarchy(frameRelations, frameRelationTypes, framesMap,
                        frameHierarchyMap);
  logger.info('Done extracting frames hierarchy');
  logger.info('Extracting FE hierarchy...');
  extractFEhierarchy(feRelations, frameRelations, frameRelationTypes, fesMap,
                     feHierarchyMap);
  logger.info('Done extracting FE hierarchy');
}

module.exports = {
  extractHierarchies,
};
