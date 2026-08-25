/**
 * MITRA AI — Payment Gateway & Anomaly Tools
 */

const { pool } = require('../../config/db');

module.exports = {
  definition: {
    name: 'get_payment_failure_analysis',
    description: 'Analyzes payment failure rates and categorizes gateway errors (BANK_TIMEOUT, INSUFFICIENT_FUNDS, etc.) across a time window.',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format' },
        gateway: { type: 'string', description: 'Optional payment gateway name, e.g. RAZORPAY' }
      },
      required: ['startDate', 'endDate']
    }
  },

  handler: async ({ startDate, endDate, gateway }) => {
    const sql = `
      SELECT 
        payment_date,
        total_attempts,
        success_count,
        failed_count,
        failure_rate_pct,
        bank_timeout_count,
        insufficient_funds_count,
        network_error_count,
        card_declined_count,
        lost_payment_volume
      FROM v_payment_failure_rates_daily
      WHERE payment_date BETWEEN ? AND ?
      ORDER BY payment_date ASC
    `;
    const [rows] = await pool.query(sql, [startDate, endDate]);
    return rows;
  }
};
