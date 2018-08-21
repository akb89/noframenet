const winston = require('winston');

const myFormat = winston.format.combine(winston.format.timestamp(),
                                        winston.format.colorize(),
                                        winston.format.printf(mess => `[${mess.timestamp}] ${mess.level}: ${mess.message}`));

const error = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: myFormat,
      level: 'error',
      colorize: true,
    }),
  ],
});

const warn = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: myFormat,
      level: 'warn',
      colorize: true,
    }),
  ],
});

const info = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: myFormat,
      level: 'info',
      colorize: true,
    }),
    new (winston.transports.File)({
      filename: 'noframenet.log',
      level: 'debug',
      colorize: true,
    }),
  ],
});

const verbose = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: myFormat,
      level: 'verbose',
      colorize: true,
    }),
    new (winston.transports.File)({
      filename: 'noframenet.log',
      level: 'verbose',
      colorize: true,
    }),
  ],
});

const debug = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: myFormat,
      level: 'debug',
      colorize: true,
    }),
    new (winston.transports.File)({
      filename: 'noframenet.log',
      level: 'silly',
      colorize: true,
    }),
  ],
});

const silly = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      format: myFormat,
      level: 'silly',
      colorize: true,
    }),
    new (winston.transports.File)({
      filename: 'noframenet.log',
      level: 'silly',
      colorize: true,
    }),
  ],
});

module.exports = {
  error,
  warn,
  verbose,
  info,
  debug,
  silly,
};
