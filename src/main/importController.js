'use strict';

const importController = module.exports = {};
const filesystem = require('fs');
//const filesystem = require('graceful-fs');
//const Jsonix = require('jsonix').Jsonix;
const Jsonix = require('../../mapping/Jsonix').Jsonix;
const co = require('co');
const mongoose = require('mongoose');
const PropertiesReader = require('properties-reader');
const properties = PropertiesReader('../../properties.ini');
const FrameSchema = require('../../mapping/FrameSchema.js').FrameSchema;
const LexUnitSchema = require('../../mapping/LexUnitSchema').LexUnitSchema;
const context = new Jsonix.Context([FrameSchema, LexUnitSchema]);
const unmarshaller = context.createUnmarshaller();
const lexUnitController = require('./lexUnit/controller/lexUnitController');
const LexUnit = require('./lexUnit/model/lexUnitModel');
const logger = require('./logger');
const OPEN_FILES_LIMIT = 5000; //TODO externalize
const path = require('path');
require('./utils');

const testImport = require('./testImport');

importController.importData = function*(next){
    importFNData();
    yield next;
};

/*
 var elapsed_time = function(note){
 var precision = 3; // 3 decimal places
 var elapsed = process.hrtime(startTime)[1] / 1000000; // divide by a million to get nano to milli
 logger.info(process.hrtime(startTime)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message +
 // time
 startTime = process.hrtime(); // reset the timer
 };*/

var start = process.hrtime();

var duration = function(startTime){
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(startTime)[1] / 1000000; // divide by a million to get nano to milli
    return process.hrtime(startTime)[0] + 's ';
};

importFNData(properties.get('main.lexUnit.directory')).then(() => {logger.info('Import process completed in: '+ duration(start))});

function isValidXml(file) {
    return file.endsWith('.xml');
}

function importFNData(lexUnitDir){
    logger.info('Processing directory: '+lexUnitDir);
    var filesPromise = new Promise( (resolve, reject) => {
        filesystem.readdir(lexUnitDir, (error, files) => {
            if(error) return reject(error);
            return resolve(files);
        })
    });
    return co(function*() {
        var filesP = yield filesPromise;
        var files = filesP.filter(isValidXml);
        logger.info('Total number of files = ' + filesP.length);
        logger.info('Total number of filtered files = ' + files.length);

        var jsonixLexUnits = yield files.map((file) => {return processFile(lexUnitDir, file)});
        //console.log(jsonixLexUnits);

        logger.info('Xml2Json unmarshalling of '+files.length+' files completed in: '+ duration(start));

        logger.info('Connection to database');
        mongoose.connect('mongodb://localhost/test');

        //yield lexUnitController.importLexUnits(jsonixLexUnits);
        var theTime = process.hrtime();
        yield testImport.importAll(jsonixLexUnits, theTime);

        //var jsonixLexUnits = yield files.map((file) => {return processFile(lexUnitDir, file)});
        //console.log(jsonixLexUnits);

        /*
         for(let file of files){
         var promise = yield processFile(lexUnitDir, file);
         console.log(promise);
         }

         /*
         var filesArray = chunk(filesP);
         logger.info('Number of chunks = ' + filesArray.length);
         logger.info('Total files in chunks = '+filesArray.flatten().length);
         logger.info('Connection to database');
         //mongoose.connect('mongodb://localhost/test');

         /*
         for(let i=0; i<filesArray.length; i++){
         var jsonixLexUnits = yield filesArray[i].map((file) => {return processFile(lexUnitDir, file)});
         console.log(jsonixLexUnits.length);
         //yield lexUnitController.importLexUnits(jsonixLexUnits);
         console.log('Processing next batch of lexUnits');
         }
         /*
         for(let files of filesArray){
         var jsonixLexUnits = yield files.map((file) => {return processFile(lexUnitDir, file)});
         var lexunits = yield lexUnitController.importLexUnits(jsonixLexUnits);
         //var lexunits = yield jsonixLexUnits.map((jsonixLexUnit) => {return
         // lexUnitController.importLexUnit(jsonixLexUnit)});
         //console.log('Processing next batch of lexUnits');
         }*/
        logger.info('Import completed');
    })
}

function chunk(files){
    var filesArray = [];
    var subArray = [];
    var counter = 0;
    for(let file of files){
        if(file.endsWith('.xml')){
            if(counter < OPEN_FILES_LIMIT){
                subArray.push(file);
                counter++;
            }else{
                subArray.push(file);
                filesArray.push(subArray);
                counter = 0;
                subArray = [];
            }
        }
    }
    filesArray.push(subArray);
    return filesArray;
}



// TODO must be yielded for call: yield saveTest() which returns, e.g. an array of true/false
function _importFNData(lexUnitDir){
    logger.info('Processing directory: '+lexUnitDir);
    var filesPromise = new Promise( (resolve, reject) => {
        filesystem.readdir(lexUnitDir, (error, files) => {
            if(error) return reject(error);
            return resolve(files);
        })
    });

    return co(function*() {
        var files = yield filesPromise;
        var unmarshalledLexUnits = yield files.map( (file) => {return processFile(lexUnitDir, file)});
        return yield unmarshalledLexUnits.map((unmarshalledLexUnit) => {
            return importXmlLexUnitContent(unmarshalledLexUnit)
        });
    })
}

function processFile(__directory, file) {
    var filePath = path.join(__directory, file);
    logger.verbose('Path = ' + filePath);
    logger.info('Processing file: ' + file);
    if(!filePath.endsWith('.xml')){
        logger.error('Invalid xml file: '+file);
        return;
    }

    return new Promise((resolve, reject) => {
        try{
            unmarshaller.unmarshalFile(filePath, (unmarshalledFile) => {
                return resolve(unmarshalledFile);
            });
        }catch(err){
            return reject(err);
        }
    });
}

function _processFile(__directory, file) {
    var filePath = path.join(__directory, file);
    logger.verbose('Path = ' + filePath);
    if(!filePath.endsWith('.xml')){
        logger.error('Invalid xml file: '+file);
        return;
    }
    logger.info('Processing file: ' + file);
    return new Promise((resolve, reject) => {
        try{
            unmarshaller.unmarshalFile(filePath, (unmarshalledFile) => {
                console.log(unmarshalledFile);
                return resolve(unmarshalledFile);
            });
        }catch(err){
            return reject(err);
        }
    });
}

/**
 * Save the content of a given FrameNet lu.xml file to a Mongo database.
 * @param jsonixLexUnit The content of a FrameNet lu.xml file unmarshalled by Jsonix
 */
function* importXmlLexUnitContent(jsonixLexUnit){
    logger.info('Importing content of lu.xml file for LexUnit with ID = '+jsonixLexUnit.value.ID+' and name = ' + jsonixLexUnit.value.name);

}

