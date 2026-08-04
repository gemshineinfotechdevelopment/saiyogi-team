import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format to mask sensitive fields
const maskSensitiveFields = winston.format((info) => {
  const sensitiveKeys = ['password', 'token', 'jwt', 'sessionId', 'apikey', 'payment', 'card', 'secret'];
  
  const maskObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Buffer.isBuffer(obj)) return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => maskObject(item));
    }
    
    const result = { ...obj };
    for (const key of Object.keys(result)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        result[key] = '***MASKED***';
      } else if (typeof result[key] === 'object') {
        result[key] = maskObject(result[key]);
      }
    }
    return result;
  };

  return maskObject(info);
});

// Format for development: Colored text
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  maskSensitiveFields(),
  printf((info) => {
    const { level, message, timestamp, stack, ...meta } = info;
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Only stringify meta if it has keys other than the standard winston properties
    const metaKeys = Object.keys(meta).filter(k => k !== Symbol.for('level') && k !== Symbol.for('message') && k !== Symbol.for('splat'));
    
    if (metaKeys.length > 0) {
      const metaObj = {};
      metaKeys.forEach(k => metaObj[k] = meta[k]);
      msg += ` ${JSON.stringify(metaObj)}`;
    }
    
    if (stack) {
      msg += `\n${stack}`;
    }
    return msg;
  })
);

// Format for production: JSON (best for Render and log aggregators)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  maskSensitiveFields(),
  json()
);

const accessFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/access-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
});

const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: process.env.NODE_ENV === 'development' ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    accessFileRotateTransport,
    errorFileRotateTransport
  ],
  exitOnError: false,
});

export default logger;
