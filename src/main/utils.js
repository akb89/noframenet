'use strict';

const _ = require('lodash');

if(!Array.prototype.merge){
    Array.prototype.merge = function(array){
        return _.union(this, array);
    };
}

if(!Array.prototype.flatten){
    Array.prototype.flatten = function(){
        return _.flatten(this);
    };
}

if(!Array.prototype.flattenDeep){
    Array.prototype.flattenDeep = function(){
        return _.flattenDeep(this);
    };
}

function ObjectIdSet(){
    Set.call(this);
}
ObjectIdSet.prototype = Object.create(Set.prototype);
ObjectIdSet.prototype.has = function(test){
    this.forEach((value) => {
        if(value.equals(test)){
            return true;
        }
    });
    return false;
};

module.exports = ObjectIdSet;

/*
Array.prototype.merge = function(array){
    for(let i = 0; i < array.length; i++){
        this.pushIfNotExist(array[i]);
    }
};

Array.prototype.pushIfNotExist = function(element){
    if(!this.contains(element)){
        this.push(element);
    }
};

Array.prototype.contains = function(element){
    for(let i = 0; i < this.length; i++){
        if(this[i] === element){
            return true;
        }
    }
    return false;
};
 */
