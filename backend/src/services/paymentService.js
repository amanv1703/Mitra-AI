/**
 * MITRA AI — Payment Service
 * Business logic for payment transactions, gateways, and failure analysis
 */

const paymentRepository = require('../repositories/paymentRepository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { parseDateRange } = require('../utils/dateRange');

class PaymentService {
  async getPayments(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { fromSql, toSql } = query.from || query.range ? parseDateRange(query) : { fromSql: null, toSql: null };

    const filters = {
      limit,
      offset,
      status: query.status,
      method: query.method,
      failureReason: query.failureReason,
      from: fromSql,
      to: toSql,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const [payments, total] = await Promise.all([
      paymentRepository.findPayments(filters),
      paymentRepository.countPayments(filters)
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return { payments, meta };
  }

  async getPaymentSummary(query = {}) {
    const { fromSql, toSql, from, to } = parseDateRange(query);
    const summary = await paymentRepository.getSummary(fromSql, toSql);

    return {
      period: { from, to },
      ...summary
    };
  }

  async getFailureTrends(query = {}) {
    const { fromSql, toSql, from, to } = parseDateRange(query);
    const trends = await paymentRepository.getFailureTrends(fromSql, toSql);

    return {
      period: { from, to },
      trends
    };
  }
}

module.exports = new PaymentService();
