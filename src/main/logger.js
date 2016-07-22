'use strict';

const winston = require('winston');

// Logging in Console and File

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({level: 'silly', colorize: true}),
<<<<<<< HEAD
        new (winston.transports.File)({filename: 'noFrameNet.log', level: 'error', colorize: true})
=======
        new (winston.transports.File)({filename: 'noFrameNet.log', level: 'silly', colorize: true})
>>>>>>> 5e06e03b4ffc4606f99c2fc27823d02587314a5b
    ]
});
module.exports = logger;