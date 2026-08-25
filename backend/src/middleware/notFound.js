/**
 * MITRA AI — 404 Not Found Middleware
 */

const { errorResponse } = require('../utils/response');

function notFound(req, res, next) {
  return errorResponse(
    res,
    'RESOURCE_NOT_FOUND',
    `Cannot ${req.method} ${req.originalUrl} — Endpoint does not exist`,
    404
  );
}

module.exports = notFound;
