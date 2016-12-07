var SemTypeSchema_Module_Factory = function() {
  var SemTypeSchema = {
    name: 'SemTypeSchema',
    defaultElementNamespaceURI: 'http:\/\/framenet.icsi.berkeley.edu',
    typeInfos: [{
      localName: 'SemTypeType.SuperType',
      typeName: null,
      propertyInfos: [{
        name: 'superTypeName',
        required: true,
        attributeName: {
          localPart: 'superTypeName'
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
      }]
    }, {
      localName: 'SemTypeType',
      typeName: 'semTypeType',
      propertyInfos: [{
        name: 'definition',
        required: true
      }, {
        name: 'superType',
        minOccurs: 0,
        collection: true,
        typeInfo: '.SemTypeType.SuperType'
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
        name: 'abbrev',
        required: true,
        attributeName: {
          localPart: 'abbrev'
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
      localName: 'SemTypes',
      typeName: null,
      propertyInfos: [{
        name: 'semType',
        minOccurs: 0,
        collection: true,
        typeInfo: '.SemTypeType'
      }, {
        name: 'xmlCreated',
        attributeName: {
          localPart: 'XMLCreated'
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
      localName: 'CoreType',
      values: ['Core', 'Peripheral', 'Extra-Thematic', 'Core-Unexpressed']
    }, {
      type: 'enumInfo',
      localName: 'POSType',
      values: ['N', 'V', 'A', 'ADV', 'PRON', 'PREP', 'NUM', 'C', 'INTJ', 'ART', 'SCON', 'CCON', 'AVP']
    }],
    elementInfos: [{
      elementName: 'semTypes',
      typeInfo: '.SemTypes'
    }]
  };
  return {
    SemTypeSchema: SemTypeSchema
  };
};
if (typeof define === 'function' && define.amd) {
  define([], SemTypeSchema_Module_Factory);
} else {
  var SemTypeSchema_Module = SemTypeSchema_Module_Factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.SemTypeSchema = SemTypeSchema_Module.SemTypeSchema;
  } else {
    var SemTypeSchema = SemTypeSchema_Module.SemTypeSchema;
  }
}
