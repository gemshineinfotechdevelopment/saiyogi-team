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
import brandsRouter from './routes/brands.js';
import uploadRouter from './routes/upload.js';
import chitSchemesRouter from './routes/chitSchemes.js';
import chitSubscriptionsRouter from './routes/chitSubscriptions.js';
import bulkImportRouter from './routes/bulkImport.js';

import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { assignRequestId, requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();

// Disable ETag caching for API routes so changes show immediately
app.disable('etag');

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ===== CORS MUST BE FIRST =====
const allowedOrigins = [
  'https://saiyogicrackers.com',
  'https://www.saiyogicrackers.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5005',
  'http://127.0.0.1:5005',
  'http://localhost:8080',
  'http://localhost:8081',
];

if (process.env.CLIENT_URL) {
  const envOrigins = process.env.CLIENT_URL.split(',').map(u => u.trim()).filter(Boolean);
  allowedOrigins.push(...envOrigins);
}

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    // 2. Allow explicitly configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // 3. Allow all Vercel previews (*.vercel.app), Netlify (*.netlify.app) & Render (*.onrender.com)
    if (
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    // 4. Allow local development origins
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      process.env.NODE_ENV === 'development'
    ) {
      return callback(null, true);
    }

    logger.warn('CORS request blocked from origin:', { origin });
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ===== THEN other middleware =====
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Integrate request logger
app.use(assignRequestId);
app.use(requestLogger);

// ===== THEN static =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

import connectDB from './config/db.js';

// Connect to database
connectDB();

logger.info('Server initialized');

// Health Check Endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy', uptime: process.uptime() });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Sai Yogi Crackers Backend API Server' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products/bulk-import', bulkImportRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/cart', cartRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/chit-schemes', chitSchemesRouter);
app.use('/api/chit-subscriptions', chitSubscriptionsRouter);

// 404 Handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// For any other route, serve frontend index.html if dist exists
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(__dirname, '../dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).json({ status: 'ok', message: 'Sai Yogi Crackers Backend API Server' });
});

// Error Handler (must be last)
app.use(errorHandler);

import { exec } from 'child_process';
import os from 'os';

const PORT = process.env.PORT || 5005;

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
