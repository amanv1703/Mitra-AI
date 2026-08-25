/**
 * MITRA AI — Lightweight Structured Request Logger Middleware
 */

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Mask sensitive routes or headers if any
    const logLine = `[${new Date().toISOString()}] ${method} ${originalUrl} -> ${statusCode} (${duration}ms)`;

    if (statusCode >= 500) {
      console.error(`🚨 ${logLine}`);
    } else if (statusCode >= 400) {
      console.warn(`⚠️ ${logLine}`);
    } else {
      console.log(`📡 ${logLine}`);
    }
  });

  next();
}

module.exports = requestLogger;
