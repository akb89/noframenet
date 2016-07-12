'use strict';

/*
function InvalidArgumentException(message){
    this.name = 'InvalidArgumentException';
    this.message = message;
}

function InconsistentDataException(message){
    this.name = 'InconsistentDataException';
    this.message = message;
}

InvalidArgumentException.prototype = Object.create(Error.prototype);
InconsistentDataException.prototype = Object.create(Error.prototype);
*/

const util = require('util');

function InvalidArgumentException(message) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
}

function InconsistentDataException(message) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
}

util.inherits(InvalidArgumentException, Error);
util.inherits(InconsistentDataException, Error);

module.exports = {
    InvalidArgumentException,
    InconsistentDataException
};