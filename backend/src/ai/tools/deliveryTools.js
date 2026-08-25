/**
 * MITRA AI — Regional Delivery & Logistics Telemetry Tools
 */

const { pool } = require('../../config/db');

module.exports = {
  definition: {
    name: 'get_regional_delivery_bottlenecks',
    description: 'Identifies logistics bottlenecks, high delay rates, and promised date SLA breaches across cities.',
    parameters: {
      type: 'object',
      properties: {
        minDelayRatePct: { type: 'number', description: 'Filter cities with delay rate above this threshold (e.g. 10.0)' }
      }
    }
  },

  handler: async ({ minDelayRatePct = 5.0 }) => {
    const sql = `
      SELECT 
        shipping_city,
        shipping_state,
        total_shipped_orders,
        delivered_count,
        delayed_count,
        failed_delivery_count,
        delayed_rate_pct,
        avg_days_past_promised
      FROM v_regional_delivery_delays
      WHERE delayed_rate_pct >= ?
      ORDER BY delayed_rate_pct DESC
    `;
    const [rows] = await pool.query(sql, [minDelayRatePct]);
    return rows;
  }
};
