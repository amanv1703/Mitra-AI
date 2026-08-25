/**
 * MITRA AI — Refund Service
 * Business logic for refunds, return reasons, and anomaly tracking
 */

const refundRepository = require('../repositories/refundRepository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { parseDateRange } = require('../utils/dateRange');

class RefundService {
  async getRefunds(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { fromSql, toSql } = query.from || query.range ? parseDateRange(query) : { fromSql: null, toSql: null };

    const filters = {
      limit,
      offset,
      reason: query.reason,
      status: query.status,
      productId: query.productId ? parseInt(query.productId, 10) : null,
      from: fromSql,
      to: toSql,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const [refunds, total] = await Promise.all([
      refundRepository.findRefunds(filters),
      refundRepository.countRefunds(filters)
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return { refunds, meta };
  }

  async getRefundSummary(query = {}) {
    const { fromSql, toSql, from, to } = parseDateRange(query);
    const summary = await refundRepository.getSummary(fromSql, toSql);

    return {
      period: { from, to },
      ...summary
    };
  }

  async getRefundTrends(query = {}) {
    const { fromSql, toSql, from, to } = parseDateRange(query);
    const trends = await refundRepository.getTrends(fromSql, toSql);

    return {
      period: { from, to },
      trends
    };
  }
}

module.exports = new RefundService();
