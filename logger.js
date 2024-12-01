import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf } = format;

// Custom log formats
const logFormat = printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    // Error logs
    new transports.File({
      filename: path.join('logs', 'errors.log'),
      level: 'error',
    }),
    // Request logs
    new transports.File({
      filename: path.join('logs', 'requests.log'),
      level: 'info',
      format: format((info) => (info.message.includes('Request:') ? info : false))(),
    }),
    // Login/logout logs
    new transports.File({
      filename: path.join('logs', 'logins.log'),
      level: 'info',
      format: format((info) => (info.message.includes('User logged') ? info : false))(),
    }),
    // Console logs
    new transports.Console(),
  ],
});

export default logger;
