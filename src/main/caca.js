'use strict';

const mongoose = require('mongoose');
const ValenceUnit = require('./valenceUnit/model/valenceUnitModel');
const Pattern = require('./pattern/model/patternModel');
const assert = require('assert');
const co = require('co');

test().then(() => {console.log('Done')});

function test(){
    return co(function*() {
        console.log('Test');
        mongoose.connect('mongodb://localhost/test');

        var vu1 = new ValenceUnit({FE:'fe1', PT:'pt1', GF:'gf1'});
        var vu2 = new ValenceUnit({FE:'fe2', PT:'pt2', GF:'gf2'});
        var vu3 = new ValenceUnit({FE:'fe3', PT:'pt3', GF:'gf3'});

        yield vu1.save();
        console.log('Here1');

        yield vu2.save();
        console.log('Here2');

        yield vu3.save();
        console.log('Here3');

        var vus1 = [vu1,vu2,vu3];
        var vus2 = [vu2, vu1, vu3];
        console.log('Here4');

        var pattern1 = new Pattern();
        pattern1.valenceUnits = vus1;
        console.log('Here5');

        var pattern2 = new Pattern();
        pattern2.valenceUnits = vus2;
        console.log('Here6');

        try{

            yield pattern1.save();
            console.log('Here7');

            //yield pattern2.save();
            var find = yield Pattern.findOne().where('valenceUnits').equals(vus2);
            console.log('Here8');
            console.log(find);

            console.log(pattern1);
            console.log(pattern1.valenceUnits.length);
            console.log(pattern2);
            console.log(pattern2.valenceUnits.length);
        }catch(err){
            console.log(err);
        }
    });
}


