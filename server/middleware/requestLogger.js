import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

// Middleware to assign a unique request ID to each request
export const assignRequestId = (req, res, next) => {
  req.id = uuidv4();
  next();
};

// Define custom morgan tokens
morgan.token('id', (req) => req.id);
morgan.token('client-ip', (req) => {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
});

// Setup morgan to pipe into winston
// Format includes: request ID, client IP, method, url, status, response time, content length
export const requestLogger = morgan(
  'ReqID: :id | IP: :client-ip | :method :url | Status: :status | ResponseTime: :response-time ms | Size: :res[content-length]',
  {
    stream: {
      write: (message) => {
        // Morgan adds a newline to the end of each log message, trim it
        logger.info(message.trim());
      },
    },
  }
);
