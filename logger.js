import { createLogger, format, transports } from 'winston';
import path from 'path';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.File({ filename: path.join('logs', 'errors.log'), level: 'error' }),
    new transports.File({ filename: path.join('logs', 'requests.log'), level: 'info' }),
    new transports.File({ filename: path.join('logs', 'logins.log'), level: 'info' }),
    new transports.Console(),
  ],
});

export default logger;
