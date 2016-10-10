'use strict';

import FastSet from 'collections/fast-set';
import './utils'; // For hashcode

class AnnotationSetSet extends FastSet{
    constructor() {
        super(null, function (a, b) {
            return a._id === b._id;
        }, function (object) {
            return object._id.toString();
        })
    }
}

class FrameSet extends FastSet{
    constructor() {
        super(null, function (a, b) { // We need this for frameRelations. Frames can be added
            // before the corresponding file is parsed
            return a._id === b._id;
        }, function (object) {
            return object._id.toString();
        })
    }
}

class FrameElementSet extends FastSet{
    constructor(){
        super(null, function (a, b) {
            return a._id === b._id;
        }, function (object) {
            return object._id.toString();
        })
    }
}

class PatternSet extends FastSet{
    constructor(){
        super(null, function (a, b) {
            if(a.valenceUnits.length !== b.valenceUnits.length){
                return false;
            }
            return a.valenceUnits.map(x => x._id).sort().join('') === b.valenceUnits.map(x => x._id).sort().join('');
        }, function (object) {
            return object.valenceUnits.map(x => x._id).sort().join('');
        })
    }
}

class SemTypeSet extends FastSet{
    constructor(){
        super(null, function (a, b) {
            return a._id === b._id;
        }, function (object) {
            return object._id.toString();
        })
    }
}

class SentenceSet extends FastSet{
    constructor(){
        super(null, function (a, b) {
            return a._id === b._id;
        }, function (object) {
            return object._id.toString();
        })
    }
}

class ValenceUnitSet extends FastSet{
    constructor(){
        super(null, function (a, b) {
            return a.FE === b.FE
                && a.PT === b.PT
                && a.GF === b.GF;
        }, function (object) {
            var result = object.FE != null ? object.FE.hashCode() : 0;
            result = 31 * result + (object.PT != null ? object.PT.hashCode() : 0);
            result = 31 * result + (object.GF != null ? object.GF.hashCode() : 0);
            return result.toString();
        })
    }
}

export {
    AnnotationSetSet,
    FrameSet,
    FrameElementSet,
    PatternSet,
    SemTypeSet,
    SentenceSet,
    ValenceUnitSet
}