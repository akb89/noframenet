'use strict';

const winston = require('winston');

// Logging in Console and File

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({level: 'error', colorize: true})//,
        //new (winston.transports.File)({ filename: 'valencer.log' })
    ]
});
module.exports = logger;