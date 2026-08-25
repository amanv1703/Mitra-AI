/**
 * MITRA AI — Shared Validation Helpers & Request Guards
 */

const { errorResponse } = require('../utils/response');

function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const rawVal = req.params[paramName];
    const parsed = parseInt(rawVal, 10);

    if (isNaN(parsed) || parsed <= 0) {
      return errorResponse(
        res,
        'INVALID_ID',
        `Parameter '${paramName}' must be a positive integer`,
        400
      );
    }

    req.params[paramName] = parsed;
    next();
  };
}

function validateSortField(allowedFields = []) {
  return (req, res, next) => {
    const sortBy = req.query.sortBy;
    if (sortBy && !allowedFields.includes(sortBy)) {
      return errorResponse(
        res,
        'INVALID_SORT_FIELD',
        `Sort field '${sortBy}' is not allowed. Allowed values: ${allowedFields.join(', ')}`,
        400
      );
    }

    const sortOrder = req.query.sortOrder ? req.query.sortOrder.toUpperCase() : 'DESC';
    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
      return errorResponse(
        res,
        'INVALID_SORT_ORDER',
        `Sort order must be 'ASC' or 'DESC'`,
        400
      );
    }

    req.query.sortOrder = sortOrder;
    next();
  };
}

module.exports = {
  validateIdParam,
  validateSortField
};
