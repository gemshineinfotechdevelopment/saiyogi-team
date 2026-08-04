import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import ordersRouter from './routes/orders.js';
import customersRouter from './routes/customers.js';
import authRouter from './routes/auth.js';
import cartRouter from './routes/cart.js';
import inventoryRouter from './routes/inventory.js';
import settingsRouter from './routes/settings.js';
import billsRouter from './routes/bills.js';
import reportsRouter from './routes/reports.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { assignRequestId, requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();

// ===== CORS MUST BE FIRST =====
const allowedOrigins = [
  'https://narandiraa-enterprises-web.netlify.app',
  'https://narandiraa-enterprises.vercel.app',
  'https://www.narendiraaenterprises.com',
  'https://narendiraaenterprises.com',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Check if origin is in allowedOrigins, is a vercel preview, or if it's a development environment
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      (origin && origin.endsWith('.vercel.app')) ||
      process.env.NODE_ENV === 'development'
    ) {
      callback(null, true);
    } else {
      logger.warn('Blocked by CORS', { origin });
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ===== THEN other middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Integrate request logger
app.use(assignRequestId);
app.use(requestLogger);

// ===== THEN static =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, '../dist')));

import connectDB from './config/db.js';

// Connect to database
connectDB();

logger.info('Server initialized');

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/reports', reportsRouter);

// 404 Handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// For any other route, serve the frontend index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Error Handler (must be last)
app.use(errorHandler);

import { exec } from 'child_process';
import os from 'os';

const PORT = process.env.PORT || 5000;

const execCmd = (cmd) => new Promise((resolve, reject) => {
  exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
    if (err) return reject({ err, stdout, stderr });
    resolve({ stdout, stderr });
  });
});

const killProcessOnPort = async (port) => {
  try {
    if (os.platform() === 'win32') {
      const { stdout } = await execCmd(`netstat -ano -p tcp | findstr :${port}`);
      const lines = stdout.split(/\r?\n/).filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        const cols = line.trim().split(/\s+/);
        const pid = cols[cols.length - 1];
        if (pid && !isNaN(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          await execCmd(`taskkill /PID ${pid} /F`);
          logger.info(`Killed process ${pid} that was using port ${port}`);
        } catch (e) {
          logger.warn(`Failed to kill PID ${pid}`, { error: e.stdout || e.err || e });
        }
      }
    } else {
      // Unix-like: use lsof
      const { stdout } = await execCmd(`lsof -i :${port} -t || true`);
      const pids = stdout.split(/\r?\n/).filter(Boolean);
      for (const pid of pids) {
        try {
          await execCmd(`kill -9 ${pid}`);
          logger.info(`Killed process ${pid} that was using port ${port}`);
        } catch (e) {
          logger.warn(`Failed to kill PID ${pid}`, { error: e.stdout || e.err || e });
        }
      }
    }
  } catch (err) {
    logger.warn('Could not determine process on port', { port, error: err });
    throw err;
  }
};

const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

    server.on('error', async (err) => {
      if (err && err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Attempting to free it...`);
        try {
          await killProcessOnPort(PORT);
          logger.info('Retrying to start the server in 1s...');
          setTimeout(() => startServer(), 1000);
        } catch (e) {
          logger.error('Failed to free port. Exiting.', { error: e });
          process.exit(1);
        }
      } else {
        logger.error('Server error:', { error: err });
        process.exit(1);
      }
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err });
    process.exit(1);
  }
};

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully.');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT RECEIVED. Shutting down gracefully.');
  process.exit(0);
});

startServer();

export default app;
