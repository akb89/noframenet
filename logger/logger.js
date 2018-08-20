const winston = require('winston');

const error = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      level: 'error',
      colorize: true,
    }),
  ],
});

const warn = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
      level: 'warn',
      colorize: true,
    }),
  ],
});

const info = winston.createLogger({
  transports: [
    new (winston.transports.Console)({
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
