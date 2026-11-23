import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

const { combine, timestamp, printf } = winston.format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `${String(timestamp)} [${level}]: ${String(message)}`;
});

const lfName =
  process.env.NODE_ENV === 'production' ? 'backend' : 'backend-staging';

const logDirectory = path.join(__dirname, '..', '..', 'log', 'app');

const transport = new winston.transports.DailyRotateFile({
  filename: `${lfName}-%DATE%.log`,
  dirname: logDirectory,
  datePattern: 'DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'test' ? 'warn' : 'info',
  format: combine(timestamp(), customFormat),
  transports: [transport, new winston.transports.Console()],
});

function stringifyLogMessage(message: unknown): string {
  if (typeof message === 'string') return message;
  if (typeof message === 'object') return JSON.stringify(message);
  if (
    typeof message === 'number' ||
    typeof message === 'boolean' ||
    typeof message === 'bigint'
  ) {
    return message.toString();
  }
  return Object.prototype.toString.call(message) as string;
}

export class AppLogger implements LoggerService {
  log(message: unknown) {
    logger.info(stringifyLogMessage(message));
  }
  error(message: unknown, trace?: string) {
    logger.error(
      `${stringifyLogMessage(message)}${trace ? ` - ${trace}` : ''}`,
    );
  }
  warn(message: unknown) {
    logger.warn(stringifyLogMessage(message));
  }
  debug(message: unknown) {
    logger.debug(stringifyLogMessage(message));
  }
  verbose(message: unknown) {
    logger.verbose(stringifyLogMessage(message));
  }
}
