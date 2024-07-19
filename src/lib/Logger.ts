// 'use server';

import type { Logger } from 'pino';
import pinoLogger from 'pino';

let options = {};

if (typeof window === 'undefined') {
  options = {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        messageKey: 'msg',
      },
    },
  };
} else {
  options = {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        messageKey: 'msg',
      },
    },
  };
}

let logger: Logger;
export const getLogger = () => {
  if (!logger) {
    const deploymentEnv = process.env.NODE_ENV || 'development';
    logger = pinoLogger({
      level: deploymentEnv === 'production' ? 'info' : 'debug',
      ...options,
    });
  }
  return logger;
};

// export { logger };
