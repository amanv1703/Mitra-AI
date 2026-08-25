/**
 * MITRA AI — Payment Repository
 * Database queries for payment transactions, gateways, and failure health
 */

const { query } = require('../config/db');

class PaymentRepository {
  async findPayments({ limit, offset, status, method, failureReason, from, to, sortBy = 'initiated_at', sortOrder = 'DESC' }) {
    const params = [];
    let whereClauses = [];

    if (status) {
      whereClauses.push('p.status = ?');
      params.push(status);
    }
    if (method) {
      whereClauses.push('p.payment_method = ?');
      params.push(method);
    }
    if (failureReason) {
      whereClauses.push('p.failure_reason = ?');
      params.push(failureReason);
    }
    if (from && to) {
      whereClauses.push('p.initiated_at BETWEEN ? AND ?');
      params.push(from, to);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Sort field sanitization
    const validSortFields = ['initiated_at', 'amount', 'status', 'failure_reason'];
    const safeSort = validSortFields.includes(sortBy) ? sortBy : 'initiated_at';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        p.id,
        p.order_id,
        p.customer_id,
        p.gateway,
        p.gateway_payment_id,
        p.amount,
        p.currency,
        p.status,
        p.failure_reason,
        p.error_code,
        p.error_description,
        p.payment_method,
        p.retry_count,
        p.initiated_at,
        p.completed_at,
        c.customer_code,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        o.order_number
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      JOIN orders o ON p.order_id = o.id
      ${whereSql}
      ORDER BY p.${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    return await query(sql, params);
  }

  async countPayments({ status, method, failureReason, from, to }) {
    const params = [];
    let whereClauses = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (method) {
      whereClauses.push('payment_method = ?');
      params.push(method);
    }
    if (failureReason) {
      whereClauses.push('failure_reason = ?');
      params.push(failureReason);
    }
    if (from && to) {
      whereClauses.push('initiated_at BETWEEN ? AND ?');
      params.push(from, to);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT COUNT(id) AS total FROM payments ${whereSql}`;
    const rows = await query(sql, params);
    return Number(rows[0]?.total) || 0;
  }

  async getSummary(from, to) {
    const params = [from, to];
    const sql = `
      SELECT 
        COUNT(id) AS total_payments,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
        COALESCE(SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END), 0) AS failed_amount,
        COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0) AS successful_amount,
        ROUND((SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) / NULLIF(COUNT(id), 0)) * 100, 2) AS failure_rate_pct
      FROM payments
      WHERE initiated_at BETWEEN ? AND ?
    `;
    const rows = await query(sql, params);
    const summary = rows[0] || {};

    // Top failure reasons breakdown
    const reasonsSql = `
      SELECT 
        failure_reason,
        COUNT(id) AS count,
        COALESCE(SUM(amount), 0) AS amount
      FROM payments
      WHERE status = 'FAILED' AND initiated_at BETWEEN ? AND ?
      GROUP BY failure_reason
      ORDER BY count DESC
    `;
    const topReasons = await query(reasonsSql, params);

    return {
      totalPayments: Number(summary.total_payments) || 0,
      successful: Number(summary.success_count) || 0,
      failed: Number(summary.failed_count) || 0,
      pending: Number(summary.pending_count) || 0,
      failureRatePct: Number(summary.failure_rate_pct) || 0,
      failedAmount: Number(summary.failed_amount) || 0,
      successfulAmount: Number(summary.successful_amount) || 0,
      topFailureReasons: topReasons.map(r => ({
        reason: r.failure_reason,
        count: Number(r.count),
        amount: Number(r.amount)
      }))
    };
  }

  async getFailureTrends(from, to) {
    const sql = `
      SELECT 
        DATE(initiated_at) AS date,
        COUNT(id) AS total_attempts,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_attempts,
        ROUND((SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) / COUNT(id)) * 100, 2) AS failure_rate_pct,
        COALESCE(SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END), 0) AS lost_volume,
        SUM(CASE WHEN failure_reason = 'BANK_TIMEOUT' THEN 1 ELSE 0 END) AS bank_timeout_count,
        SUM(CASE WHEN failure_reason = 'INSUFFICIENT_FUNDS' THEN 1 ELSE 0 END) AS insufficient_funds_count,
        SUM(CASE WHEN failure_reason = 'NETWORK_ERROR' THEN 1 ELSE 0 END) AS network_error_count
      FROM payments
      WHERE initiated_at BETWEEN ? AND ?
      GROUP BY DATE(initiated_at)
      ORDER BY date ASC
    `;
    const rows = await query(sql, [from, to]);
    return rows.map(r => ({
      date: r.date,
      totalAttempts: Number(r.total_attempts),
      failedAttempts: Number(r.failed_attempts),
      failureRatePct: Number(r.failure_rate_pct),
      lostVolume: Number(r.lost_volume),
      breakdown: {
        bankTimeout: Number(r.bank_timeout_count),
        insufficientFunds: Number(r.insufficient_funds_count),
        networkError: Number(r.network_error_count)
      }
    }));
  }
}

module.exports = new PaymentRepository();
