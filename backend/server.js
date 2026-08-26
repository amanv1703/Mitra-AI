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

// Security & utility middleware
app.use(helmet());

// Dynamic CORS configuration (handles single string, comma-separated origins, or local defaults)
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrl.split(',').map(url => url.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    // Allow local dev origins
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials: true
}));
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
}

module.exports = app;
