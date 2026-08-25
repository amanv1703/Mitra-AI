/**
 * MITRA AI — Payment Metrics Engine
 */

const { query } = require('../../config/db');

class PaymentMetrics {
  async calculatePaymentMetrics(fromSql, toSql) {
    const sql = `
      SELECT 
        COUNT(id) AS total_attempts,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
        COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0) AS successful_amount,
        COALESCE(SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END), 0) AS failed_amount
      FROM payments
      WHERE initiated_at BETWEEN ? AND ?
    `;

    const rows = await query(sql, [fromSql, toSql]);
    const res = rows[0] || {};
    const total = Number(res.total_attempts) || 0;
    const failed = Number(res.failed_count) || 0;
    const success = Number(res.success_count) || 0;

    const failureRate = total > 0 ? (failed / total) : 0;
    const successRate = total > 0 ? (success / total) : 0;

    // Reason distribution
    const reasonsSql = `
      SELECT 
        failure_reason,
        COUNT(id) AS count,
        COALESCE(SUM(amount), 0) AS amount,
        ROUND((COUNT(id) / ? ) * 100, 2) AS percentage_of_failures
      FROM payments
      WHERE initiated_at BETWEEN ? AND ? AND status = 'FAILED'
      GROUP BY failure_reason
      ORDER BY count DESC
    `;
    const reasons = failed > 0 ? await query(reasonsSql, [failed, fromSql, toSql]) : [];

    return {
      totalAttempts: total,
      successCount: success,
      failedCount: failed,
      pendingCount: Number(res.pending_count) || 0,
      successRate: Number(successRate.toFixed(4)),
      failureRate: Number(failureRate.toFixed(4)),
      failureRatePct: Number((failureRate * 100).toFixed(2)),
      successfulAmount: Number(res.successful_amount) || 0,
      failedAmount: Number(res.failed_amount) || 0,
      reasonDistribution: reasons.map(r => ({
        reason: r.failure_reason,
        count: Number(r.count),
        amount: Number(r.amount),
        percentage: Number(r.percentage_of_failures)
      }))
    };
  }

  async getDailyPaymentTimeSeries(fromSql, toSql) {
    const sql = `
      SELECT 
        DATE(initiated_at) AS date,
        COUNT(id) AS total_attempts,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_attempts,
        ROUND((SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) / COUNT(id)) * 100, 2) AS failure_rate_pct,
        COALESCE(SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END), 0) AS failed_amount,
        SUM(CASE WHEN failure_reason = 'BANK_TIMEOUT' THEN 1 ELSE 0 END) AS bank_timeout_count
      FROM payments
      WHERE initiated_at BETWEEN ? AND ?
      GROUP BY DATE(initiated_at)
      ORDER BY date ASC
    `;
    const rows = await query(sql, [fromSql, toSql]);
    return rows.map(r => ({
      date: r.date,
      totalAttempts: Number(r.total_attempts),
      failedAttempts: Number(r.failed_attempts),
      failureRatePct: Number(r.failure_rate_pct),
      failedAmount: Number(r.failed_amount),
      bankTimeouts: Number(r.bank_timeout_count)
    }));
  }
}

module.exports = new PaymentMetrics();
