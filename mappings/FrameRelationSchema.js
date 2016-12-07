var FrameRelationSchema_Module_Factory = function() {

  var FrameRelationSchema = {
    name: 'FrameRelationSchema',
    defaultElementNamespaceURI: 'http:\/\/framenet.icsi.berkeley.edu',
    typeInfos: [{
      localName: 'FrameRelations.FrameRelationType',
      typeName: null,
      propertyInfos: [{
        name: 'frameRelation',
        required: true,
        collection: true,
        typeInfo: '.FrameRelations.FrameRelationType.FrameRelation'
      }, {
        name: 'id',
        required: true,
        typeInfo: 'Int',
        attributeName: {
          localPart: 'ID'
        },
        type: 'attribute'
      }, {
        name: 'name',
        required: true,
        attributeName: {
          localPart: 'name'
        },
        type: 'attribute'
      }, {
        name: 'superFrameName',
        required: true,
        attributeName: {
          localPart: 'superFrameName'
        },
        type: 'attribute'
      }, {
        name: 'subFrameName',
        required: true,
        attributeName: {
          localPart: 'subFrameName'
        },
        type: 'attribute'
      }]
    }, {
      localName: 'FrameRelations.FrameRelationType.FrameRelation.FERelation',
      typeName: null,
      propertyInfos: [{
        name: 'id',
        required: true,
        typeInfo: 'Int',
        attributeName: {
          localPart: 'ID'
        },
        type: 'attribute'
      }, {
        name: 'superFEName',
        required: true,
        attributeName: {
          localPart: 'superFEName'
        },
        type: 'attribute'
      }, {
        name: 'subFEName',
        required: true,
        attributeName: {
          localPart: 'subFEName'
        },
        type: 'attribute'
      }, {
        name: 'supID',
        required: true,
        typeInfo: 'Int',
        attributeName: {
          localPart: 'supID'
        },
        type: 'attribute'
      }, {
        name: 'subID',
        required: true,
        typeInfo: 'Int',
        attributeName: {
          localPart: 'subID'
        },
        type: 'attribute'
      }]
    }, {
      localName: 'FrameRelations',
      typeName: null,
      propertyInfos: [{
        name: 'frameRelationType',
        minOccurs: 0,
        collection: true,
        typeInfo: '.FrameRelations.FrameRelationType'
      }, {
        name: 'xmlCreated',
        required: true,
        attributeName: {
          localPart: 'XMLCreated'
        },
        type: 'attribute'
      }]
    }, {
      localName: 'SemTypeRefType',
      typeName: 'semTypeRefType',
      propertyInfos: [{
        name: 'id',
        required: true,
        typeInfo: 'Int',
        attributeName: {
          localPart: 'ID'
        },
        type: 'attribute'
      }, {
        name: 'name',
        required: true,
        attributeName: {
          localPart: 'name'
        },
        type: 'attribute'
      }]
    }, {
      localName: 'FrameRelations.FrameRelationType.FrameRelation',
      typeName: null,
      propertyInfos: [{
        name: 'feRelation',
        minOccurs: 0,
        collection: true,
        elementName: 'FERelation',
        typeInfo: '.FrameRelations.FrameRelationType.FrameRelation.FERelation'
      }, {
        name: 'id',
        required: true,
        typeInfo: 'Int',
        attributeName: {
          localPart: 'ID'
        },
        type: 'attribute'
      }, {
        name: 'superFrameName',
        required: true,
        attributeName: {
          localPart: 'superFrameName'
        },
        type: 'attribute'
      }, {
        name: 'subFrameName',
        required: true,
        attributeName: {
          localPart: 'subFrameName'
        },
        type: 'attribute'
      }, {
        name: 'supID',
        required: true,
        typeInfo: 'Int',
        attributeName: {
          localPart: 'supID'
        },
        type: 'attribute'
      }, {
        name: 'subID',
        required: true,
        typeInfo: 'Int',
        attributeName: {
          localPart: 'subID'
        },
        type: 'attribute'
      }]
    }, {
      localName: 'LexemeType',
      typeName: 'lexemeType',
      propertyInfos: [{
        name: 'name',
        required: true,
        attributeName: {
          localPart: 'name'
        },
        type: 'attribute'
      }, {
        name: 'pos',
        required: true,
        attributeName: {
          localPart: 'POS'
        },
        type: 'attribute'
      }, {
        name: 'breakBefore',
        typeInfo: 'Boolean',
        attributeName: {
          localPart: 'breakBefore'
        },
        type: 'attribute'
      }, {
        name: 'headword',
        typeInfo: 'Boolean',
        attributeName: {
          localPart: 'headword'
        },
        type: 'attribute'
      }, {
        name: 'order',
        typeInfo: 'Int',
        attributeName: {
          localPart: 'order'
        },
        type: 'attribute'
      }]
    }, {
      type: 'enumInfo',
      localName: 'POSType',
      values: ['N', 'V', 'A', 'ADV', 'PRON', 'PREP', 'NUM', 'C', 'INTJ', 'ART', 'SCON', 'CCON', 'AVP']
    }, {
      type: 'enumInfo',
      localName: 'CoreType',
      values: ['Core', 'Peripheral', 'Extra-Thematic', 'Core-Unexpressed']
    }],
    elementInfos: [{
      elementName: 'frameRelations',
      typeInfo: '.FrameRelations'
    }]
  };
  return {
    FrameRelationSchema: FrameRelationSchema
  };
};
if (typeof define === 'function' && define.amd) {
  define([], FrameRelationSchema_Module_Factory);
} else {
  var FrameRelationSchema_Module = FrameRelationSchema_Module_Factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.FrameRelationSchema = FrameRelationSchema_Module.FrameRelationSchema;
  } else {
    var FrameRelationSchema = FrameRelationSchema_Module.FrameRelationSchema;
  }
}
