/**
 * MITRA AI — Pagination Parameter Parser & Metadata Builder
 */

const { PAGINATION } = require('../config/constants');

function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) {
    page = PAGINATION.DEFAULT_PAGE;
  }

  if (isNaN(limit) || limit < 1) {
    limit = PAGINATION.DEFAULT_LIMIT;
  } else if (limit > PAGINATION.MAX_LIMIT) {
    limit = PAGINATION.MAX_LIMIT;
  }

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
}

function buildPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

module.exports = {
  parsePagination,
  buildPaginationMeta
};
