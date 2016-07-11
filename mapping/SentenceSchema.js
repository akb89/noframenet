var SentenceSchema_Module_Factory = function () {
  var SentenceSchema = {
    name: 'SentenceSchema',
    defaultElementNamespaceURI: 'http:\/\/framenet.icsi.berkeley.edu',
    typeInfos: [{
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
        localName: 'LayerType',
        typeName: 'layerType',
        propertyInfos: [{
            name: 'label',
            minOccurs: 0,
            collection: true,
            typeInfo: '.LabelType'
          }, {
            name: 'name',
            required: true,
            attributeName: {
              localPart: 'name'
            },
            type: 'attribute'
          }, {
            name: 'rank',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'rank'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'AnnotationSetType',
        typeName: 'annotationSetType',
        propertyInfos: [{
            name: 'layer',
            required: true,
            collection: true,
            typeInfo: '.LayerType'
          }, {
            name: 'id',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'ID'
            },
            type: 'attribute'
          }, {
            name: 'status',
            attributeName: {
              localPart: 'status'
            },
            type: 'attribute'
          }, {
            name: 'frameName',
            attributeName: {
              localPart: 'frameName'
            },
            type: 'attribute'
          }, {
            name: 'frameID',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'frameID'
            },
            type: 'attribute'
          }, {
            name: 'luName',
            attributeName: {
              localPart: 'luName'
            },
            type: 'attribute'
          }, {
            name: 'luID',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'luID'
            },
            type: 'attribute'
          }, {
            name: 'cxnName',
            attributeName: {
              localPart: 'cxnName'
            },
            type: 'attribute'
          }, {
            name: 'cxnID',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'cxnID'
            },
            type: 'attribute'
          }, {
            name: 'cDate',
            attributeName: {
              localPart: 'cDate'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'LabelType',
        typeName: 'labelType',
        propertyInfos: [{
            name: 'name',
            required: true,
            attributeName: {
              localPart: 'name'
            },
            type: 'attribute'
          }, {
            name: 'start',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'start'
            },
            type: 'attribute'
          }, {
            name: 'end',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'end'
            },
            type: 'attribute'
          }, {
            name: 'fgColor',
            attributeName: {
              localPart: 'fgColor'
            },
            type: 'attribute'
          }, {
            name: 'bgColor',
            attributeName: {
              localPart: 'bgColor'
            },
            type: 'attribute'
          }, {
            name: 'itype',
            attributeName: {
              localPart: 'itype'
            },
            type: 'attribute'
          }, {
            name: 'feID',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'feID'
            },
            type: 'attribute'
          }, {
            name: 'cBy',
            attributeName: {
              localPart: 'cBy'
            },
            type: 'attribute'
          }]
      }, {
        localName: 'SentenceType',
        typeName: 'sentenceType',
        propertyInfos: [{
            name: 'text',
            required: true
          }, {
            name: 'annotationSet',
            minOccurs: 0,
            collection: true,
            typeInfo: '.AnnotationSetType'
          }, {
            name: 'id',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'ID'
            },
            type: 'attribute'
          }, {
            name: 'aPos',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'aPos'
            },
            type: 'attribute'
          }, {
            name: 'paragNo',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'paragNo'
            },
            type: 'attribute'
          }, {
            name: 'sentNo',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'sentNo'
            },
            type: 'attribute'
          }, {
            name: 'docID',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'docID'
            },
            type: 'attribute'
          }, {
            name: 'corpID',
            typeInfo: 'Int',
            attributeName: {
              localPart: 'corpID'
            },
            type: 'attribute'
          }, {
            name: 'externalID',
            attributeName: {
              localPart: 'externalID'
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
    elementInfos: []
  };
  return {
    SentenceSchema: SentenceSchema
  };
};
if (typeof define === 'function' && define.amd) {
  define([], SentenceSchema_Module_Factory);
}
else {
  var SentenceSchema_Module = SentenceSchema_Module_Factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.SentenceSchema = SentenceSchema_Module.SentenceSchema;
  }
  else {
    var SentenceSchema = SentenceSchema_Module.SentenceSchema;
  }
}