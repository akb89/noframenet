import winston from 'winston';

const error = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'error',
      colorize: true,
    }),
  ],
});

const warn = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'warn',
      colorize: true,
    }),
  ],
});

const info = new (winston.Logger)({
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

const verbose = new (winston.Logger)({
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

const debug = new (winston.Logger)({
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

const silly = new (winston.Logger)({
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

export default {
  error,
  warn,
  verbose,
  info,
  debug,
  silly,
};
