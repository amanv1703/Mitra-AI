/**
 * MITRA AI — Backend Server Entrypoint
 * Layered Express.js REST API with Security Middleware & Anomaly Detection Pipeline
 */

require('./src/config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { checkDatabaseHealth } = require('./src/config/db');
const requestLogger = require('./src/middleware/requestLogger');
const notFound = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');
const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
});

// 1. CORS headers on ALL requests and preflight OPTIONS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

// Security & utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(requestLogger);

// Mount Master API Router
app.use('/api', apiRoutes);

// Root fallback route
app.get('/', (req, res) => {
  res.json({
    project: 'MITRA AI — AI Business Operator',
    version: '1.0.0',
    status: 'ONLINE',
    docs: '/docs/backend.md',
    health: '/api/health'
  });
});

// 404 and Global Error Handling
app.use(notFound);
app.use(errorHandler);

// Start server and check DB connectivity
if (process.env.NODE_ENV !== 'test') {
  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, async () => {
    console.log('=============================================================================');
    console.log(`🚀 MITRA AI Backend Engine started on port ${PORT} (${HOST})`);
    console.log(`📡 Environment: [${process.env.NODE_ENV || 'development'}]`);
    console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
    console.log('=============================================================================');
    
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.connected) {
      console.log(`✅ MySQL Database [${dbHealth.database}] connected successfully (${dbHealth.latencyMs}ms latency).`);
      
      // Start Proactive Intelligence Scheduler if enabled
      if (process.env.ENABLE_PROACTIVE_SCHEDULER !== 'false') {
        const { proactiveScheduler } = require('./src/proactive');
        proactiveScheduler.start();
      } else {
        console.log('ℹ️ ProactiveScheduler disabled via ENABLE_PROACTIVE_SCHEDULER=false');
      }
    } else {
      console.warn(`⚠️ Warning: MySQL database unavailable: ${dbHealth.error}`);
      console.warn('👉 Verify MySQL is running and DB_USER/DB_PASSWORD in .env match.');
    }
  });
}

module.exports = app;
