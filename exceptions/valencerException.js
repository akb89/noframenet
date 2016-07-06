'use strict';

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

module.exports = {
    InvalidArgumentException,
    InconsistentDataException
};