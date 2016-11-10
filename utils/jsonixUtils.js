'use strict';

/**
 * Extract all annotationSet elements from a Jsonix unmarshalled <pattern>
 * @param jsonixPattern
 * @returns {Array}
 */
function toJsonixPatternAnnoSetArray(jsonixPattern) {
  const annotationSets = [];
  let annotationSetIterator = 0;
  if ({}.hasOwnProperty.call(jsonixPattern, 'annoSet')) {
    while (jsonixPattern.annoSet[annotationSetIterator] !== undefined) {
      annotationSets.push(jsonixPattern.annoSet[annotationSetIterator]);
      annotationSetIterator += 1;
    }
  }
  return annotationSets;
}

/**
 * Extract all annotationSet elements from a Jsonix unmarshalled <sentence>
 * @param jsonixSentence
 * @returns {Array}
 */
function toJsonixSentenceAnnoSetArray(jsonixSentence) {
  const annotationSets = [];
  let annoSetIterator = 0;
  if ({}.hasOwnProperty.call(jsonixSentence, 'annotationSet')) {
    while (jsonixSentence.annotationSet[annoSetIterator] !== undefined) {
      annotationSets.push(jsonixSentence.annotationSet[annoSetIterator]);
      annoSetIterator += 1;
    }
  }
  return annotationSets;
}

/**
 * Extract all Document elements from a Jsonix unmarshalled <corpus>
 * @param jsonixCorpus
 * @returns {Array}
 */
function toJsonixDocumentArray(jsonixCorpus) {
  const documents = [];
  let documentIterator = 0;
  if ({}.hasOwnProperty.call(jsonixCorpus, 'document')) {
    while (jsonixCorpus.document[documentIterator] !== undefined) {
      documents.push(jsonixCorpus.document[documentIterator]);
      documentIterator += 1;
    }
  }
  return documents;
}

/**
 * Extract all FEcoreSet elements from a Jsonix unmarshalled <frame>
 * @param jsonixFrame
 * @returns {Array}
 */
function toJsonixFECoreSetArray(jsonixFrame) {
  const feCoreSets = [];
  let feCoreSetIterator = 0;
  if ({}.hasOwnProperty.call(jsonixFrame.value, 'fEcoreSet')) {
    while (jsonixFrame.value.fEcoreSet[feCoreSetIterator] !== undefined) {
      feCoreSets.push(jsonixFrame.value.fEcoreSet[feCoreSetIterator]);
      feCoreSetIterator += 1;
    }
  }
  return feCoreSets;
}

/**
 * Extract all memberFE elements from a Jsonix unmarshalled <FEcoreSet>
 * @param jsonixFECoreSet
 * @returns {Array}
 */
function toJsonixFECoreSetMemberArray(jsonixFECoreSet) {
  const members = [];
  let memberIterator = 0;
  if ({}.hasOwnProperty.call(jsonixFECoreSet, 'memberFE')) {
    while (jsonixFECoreSet.memberFE[memberIterator] !== undefined) {
      members.push(jsonixFECoreSet.memberFE[memberIterator]);
      memberIterator += 1;
    }
  }
  return members;
}

/**
 * Extract all frameElement elements from a Jsonix unmarshalled <frame>
 * @param jsonixFrame
 * @returns {Array}
 */
function toJsonixFrameElementArray(jsonixFrame) {
  const frameElements = [];
  let frameElementIterator = 0;
  if ({}.hasOwnProperty.call(jsonixFrame.value, 'fe')) {
    while (jsonixFrame.value.fe[frameElementIterator] !== undefined) {
      frameElements.push(jsonixFrame.value.fe[frameElementIterator]);
      frameElementIterator += 1;
    }
  }
  return frameElements;
}

/**
 * Extract all frameRelation elements from a Jsonix unmarshalled <frame> TODO: remove?
 * @param jsonixFrame
 * @returns {Array}
 */
function _toJsonixFrameRelationArray(jsonixFrame) {
  const frameRelations = [];
  let frameRelationIterator = 0;
  if ({}.hasOwnProperty.call(jsonixFrame.value, 'frameRelation')) {
    while (jsonixFrame.value.frameRelation[frameRelationIterator] !== undefined) {
      frameRelations.push(jsonixFrame.value.frameRelation[frameRelationIterator]);
      frameRelationIterator += 1;
    }
  }
  return frameRelations;
}

/**
 * Extract all feRelation elements from a Jsonix unmarshalled <frameRelation>
 * @param jsonixFrameRelation
 * @returns {Array}
 */
function toJsonixFrameElementRelationArray(jsonixFrameRelation) {

}

/**
 * Extract all frameRelation elements from a Jsonix unmarshalled <frameRelationType>
 * @param jsonixFrameRelationType
 * @returns {Array}
 */
function toJsonixFrameRelationArray(jsonixFrameRelationType) {

}

/**
 * Extract all frameRelationType elements from a Jsonix unmarshalled <frameRelations>
 * @param jsonixFrameRelations
 * @returns {Array}
 */
function toJsonixFrameRelationTypeArray(jsonixFrameRelations) {

}

/**
 * Extract all layer elements from a Jsonix unmarshalled <annotationSet>
 * @param jsonixAnnotationSet
 * @returns {Array}
 */
function toJsonixLayerArray(jsonixAnnotationSet) {
  const layers = [];
  let layerIterator = 0;
  if ({}.hasOwnProperty.call(jsonixAnnotationSet, 'layer')) {
    while (jsonixAnnotationSet.layer[layerIterator] !== undefined) {
      layers.push(jsonixAnnotationSet.layer[layerIterator]);
      layerIterator += 1;
    }
  }
  return layers;
}

/**
 * Extract all label elements from a Jsonix unmarshalled <layer>
 * @param jsonixLayer
 * @returns {Array}
 */
function toJsonixLabelArray(jsonixLayer) {
  const labels = [];
  let labelIterator = 0;
  if ({}.hasOwnProperty.call(jsonixLayer, 'label')) {
    while (jsonixLayer.label[labelIterator] !== undefined) {
      labels.push(jsonixLayer.label[labelIterator]);
      labelIterator += 1;
    }
  }
  return labels;
}

/**
 * Extract all lexeme elements from a Jsonix unmarshalled <lexUnit>
 * @param jsonixLexUnit
 * @returns {Array}
 */
function toJsonixLexemeArray(jsonixLexUnit) {
  const lexemes = [];
  let lexemeIterator = 0;
  if ({}.hasOwnProperty.call(jsonixLexUnit, 'lexeme')) {
    while (jsonixLexUnit.lexeme[lexemeIterator] !== undefined) {
      lexemes.push(jsonixLexUnit.lexeme[lexemeIterator]);
      lexemeIterator += 1;
    }
  }
  return lexemes;
}

/**
 * Extract all lexUnit elements from a Jsonix unmarshalled <frame>
 * @param jsonixFrame
 * @returns {Array}
 */
function toJsonixLexUnitArray(jsonixFrame) {
  const lexUnits = [];
  let lexUnitIterator = 0;
  if ({}.hasOwnProperty.call(jsonixFrame.value, 'lexUnit')) {
    while (jsonixFrame.value.lexUnit[lexUnitIterator] !== undefined) {
      lexUnits.push(jsonixFrame.value.lexUnit[lexUnitIterator]);
      lexUnitIterator += 1;
    }
  }
  return lexUnits;
}

/**
 * Extract all pattern elements from a Jsonix unmarshalled <lexUnit>
 * @param jsonixLexUnit
 * @returns {Array}
 */
function toJsonixPatternArray(jsonixLexUnit) {
  const patterns = [];
  if ({}.hasOwnProperty.call(jsonixLexUnit.value, 'valences')) {
    const valences = jsonixLexUnit.value.valences;
    if ({}.hasOwnProperty.call(valences, 'feGroupRealization')) {
      let feGroupRealizationIterator = 0;
      while (valences.feGroupRealization[feGroupRealizationIterator] !== undefined) {
        const feGRealization = valences.feGroupRealization[feGroupRealizationIterator];
        if ({}.hasOwnProperty.call(feGRealization, 'pattern')) {
          let patternIterator = 0;
          while (feGRealization.pattern[patternIterator] !== undefined) {
            patterns.push(feGRealization.pattern[patternIterator]);
            patternIterator += 1;
          }
        }
        feGroupRealizationIterator += 1;
      }
    }
  }
  return patterns;
}

/**
 * Extract all semType elements from a Jsonix unmarshalled <semTypes>
 * @param  jsonixSemTypes
 * @return {Array}                     [description]
 */
function toJsonixSemTypesSemTypeArray(jsonixSemTypes) {
  const semTypes = [];
  let semTypeIterator = 0;
  if ({}.hasOwnProperty.call(jsonixSemTypes.value, 'semType')) {
    while (jsonixSemTypes.value.semType[semTypeIterator] !== undefined) {
      semTypes.push(jsonixSemTypes.value.semType[semTypeIterator]);
      semTypeIterator += 1;
    }
  }
  return semTypes;
}

/**
 * Extract all semType elements from a Jsonix unmarshalled <frame> or <fe> or <lexUnit>
 * @param jsonixElement can be either a jsonixFrame, a jsonixFrameElement or a jsonixLexUnit
 * @returns {Array}
 */
function toJsonixSemTypeArray(jsonixElement) {
  const semTypes = [];
  let semTypeIterator = 0;
  if (jsonixElement.value !== undefined && {}.hasOwnProperty.call(jsonixElement.value, 'semType')) {
    while (jsonixElement.value.semType[semTypeIterator] !== undefined) {
      semTypes.push(jsonixElement.value.semType[semTypeIterator]);
      semTypeIterator += 1;
    }
  } else if ({}.hasOwnProperty.call(jsonixElement, 'semType')) {
    while (jsonixElement.semType[semTypeIterator] !== undefined) {
      semTypes.push(jsonixElement.semType[semTypeIterator]);
      semTypeIterator += 1;
    }
  }
  return semTypes;
}

/**
 * Extract all superType elements from a Jsonix unmarshalled <semType>
 * @method toJsonixSuperTypeArray
 * @param  jsonixSemType
 * @return {Array}
 */
function toJsonixSuperTypeArray(jsonixSemType) {
  const superTypes = [];
  let superTypeIterator = 0;
  if ({}.hasOwnProperty.call(jsonixSemType, 'superType')) {
    while (jsonixSemType.superType[superTypeIterator] !== undefined) {
      superTypes.push(jsonixSemType.superType[superTypeIterator]);
      superTypeIterator += 1;
    }
  }
  return superTypes;
}

/**
 * Extract all sentence elements from a Jsonix unmarshalled <lexUnit>
 * @param jsonixLexUnit
 * @returns {Array}
 */
function toJsonixLexUnitSentenceArray(jsonixLexUnit) {
  const sentences = [];
  let subCorpusIterator = 0;
  if ({}.hasOwnProperty.call(jsonixLexUnit.value, 'subCorpus')) {
    while (jsonixLexUnit.value.subCorpus[subCorpusIterator] !== undefined) {
      const subCorpus = jsonixLexUnit.value.subCorpus[subCorpusIterator];
      let sentenceIterator = 0;
      if ({}.hasOwnProperty.call(subCorpus, 'sentence')) {
        while (subCorpus.sentence[sentenceIterator] !== undefined) {
          const sentence = subCorpus.sentence[sentenceIterator];
          sentences.push(sentence);
          sentenceIterator += 1;
        }
      }
      subCorpusIterator += 1;
    }
  }
  return sentences;
}

/**
 * Extract all sentence elements from a Jsonix unmarshalled <fullTextAnnotation>
 * @param jsonixFullText
 * @returns {Array}
 */
function toJsonixDocumentSentenceArray(jsonixFullText) {
  const sentences = [];
  let sentenceIterator = 0;
  if ({}.hasOwnProperty.call(jsonixFullText.value, 'sentence')) {
    while (jsonixFullText.value.sentence[sentenceIterator] !== undefined) {
      sentences.push(jsonixFullText.value.sentence[sentenceIterator]);
      sentenceIterator += 1;
    }
  }
  return sentences;
}

/**
 * Extract all valence (unit) elements from a Jsonix unmarshalled <pattern>
 * @param jsonixPattern
 * @returns {Array}
 */
function toJsonixValenceUnitArray(jsonixPattern) {
  const valenceUnits = [];
  let valenceUnitsIterator = 0;
  if ({}.hasOwnProperty.call(jsonixPattern, 'valenceUnit')) {
    while (jsonixPattern.valenceUnit[valenceUnitsIterator] !== undefined) {
      valenceUnits.push(jsonixPattern.valenceUnit[valenceUnitsIterator]);
      valenceUnitsIterator += 1;
    }
  }
  return valenceUnits;
}

export {
  toJsonixPatternAnnoSetArray,
  toJsonixSentenceAnnoSetArray,
  toJsonixDocumentArray,
  toJsonixFECoreSetArray,
  toJsonixFECoreSetMemberArray,
  toJsonixFrameElementArray,
  toJsonixFrameElementRelationArray,
  toJsonixFrameRelationArray,
  toJsonixFrameRelationTypeArray,
  toJsonixLayerArray,
  toJsonixLabelArray,
  toJsonixLexemeArray,
  toJsonixLexUnitArray,
  toJsonixPatternArray,
  toJsonixSemTypesSemTypeArray,
  toJsonixSemTypeArray,
  toJsonixSuperTypeArray,
  toJsonixDocumentSentenceArray,
  toJsonixLexUnitSentenceArray,
  toJsonixValenceUnitArray,
};
