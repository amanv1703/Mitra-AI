/**
 * MITRA AI — Centralized Error Handling Middleware
 */

const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('🚨 Error Intercepted by Global Handler:', {
    message: err.message,
    code: err.code,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  
  // Mask raw database errors from client
  let message = err.message || 'Internal Server Error';
  if (err.sql || err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_PARSE_ERROR') {
    message = 'A database error occurred while processing the request.';
  }

  return errorResponse(res, code, message, statusCode, err.stack);
}

module.exports = errorHandler;
