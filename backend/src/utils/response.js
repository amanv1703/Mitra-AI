/**
 * MITRA AI — Standard API Response Helpers
 */

function successResponse(res, data = {}, meta = null, statusCode = 200) {
  const payload = {
    success: true,
    data
  };

  if (meta !== null) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

function errorResponse(res, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred', statusCode = 500, details = null) {
  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details && process.env.NODE_ENV === 'development') {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};
