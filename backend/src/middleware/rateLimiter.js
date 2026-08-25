/**
 * MITRA AI — Lightweight In-Memory Rate Limiting Middleware
 * 
 * Prevents endpoint flooding on AI and action endpoints.
 */

const requestCounts = new Map();

function createRateLimiter({ windowMs = 60 * 1000, maxRequests = 120, message = 'Too many requests. Please slow down.' } = {}) {
  return (req, res, next) => {
    // In test environment, skip throttling
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    requestCounts.set(ip, record);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message
        }
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
  standardLimiter: createRateLimiter({ windowMs: 60 * 1000, maxRequests: 200 }),
  aiLimiter: createRateLimiter({ windowMs: 60 * 1000, maxRequests: 60, message: 'AI query rate limit exceeded. Please wait 60s.' })
};
