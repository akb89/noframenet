'use strict';

const mongoose = require('mongoose');
const ValenceUnit = require('./valenceUnit/model/valenceUnitModel');
const assert = require('assert');
mongoose.connect('mongodb://localhost/test');

var vu = ValenceUnit.findByLabels('Original', 'NP', 'Ext');
var promise = vu.exec();

assert.ok(promise instanceof require('bluebird'));

