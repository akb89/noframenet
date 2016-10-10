'use strict';

import chai from 'chai';
import Pattern from '../../main/model/patternModel';
import ValenceUnit from '../../main/model/valenceUnitModel';
import {PatternSet} from '../../main/utils/fnUtils';

const should = chai.should();

describe('fnUtils', () => {
    it('PatternSet should behave as expected', () => {
        var valenceUnit1 = new ValenceUnit({
            FE: 'FE1',
            PT: 'PT1',
            GF: 'GF1'
        });
        var valenceUnit2 = new ValenceUnit({
            FE: 'FE2',
            PT: 'PT2',
            GF: 'GF2'
        });
        var valenceUnit3 = new ValenceUnit({
            FE: 'FE3',
            PT: 'PT3',
            GF: 'GF3'
        });
        var pattern1 = new Pattern({
            valenceUnits: [valenceUnit1, valenceUnit2, valenceUnit3]
        });
        var pattern2 = new Pattern({
            valenceUnits: [valenceUnit2, valenceUnit1, valenceUnit3]
        });
        var pattern3 = new Pattern({
            valenceUnits: [valenceUnit1, valenceUnit2]
        });
        var patternSet = new PatternSet();
        patternSet.add(pattern1);
        patternSet.length.should.equal(1);
        patternSet.has(pattern2).should.equal(true);
        patternSet.has(pattern3).should.equal(false);
        patternSet.add(pattern2);
        patternSet.length.should.equal(1);
        patternSet.add(pattern3);
        patternSet.length.should.equal(2);
        patternSet.get(pattern1).should.equal(pattern1);
    });
});