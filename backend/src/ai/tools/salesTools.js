/**
 * MITRA AI — Sales & Revenue Analytical Tools
 * Contracts and queries for agent function calling
 */

const { pool } = require('../../config/db');

module.exports = {
  definition: {
    name: 'get_sales_trends',
    description: 'Retrieves aggregated daily revenue, order counts, and cancellation trends for a date range.',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format' },
        categoryId: { type: 'number', description: 'Optional product category filter' }
      },
      required: ['startDate', 'endDate']
    }
  },

  handler: async ({ startDate, endDate, categoryId }) => {
    let sql = `
      SELECT 
        sales_date,
        total_orders,
        successful_orders,
        cancelled_orders,
        gross_revenue,
        average_order_value,
        total_discounts
      FROM v_daily_sales_performance
      WHERE sales_date BETWEEN ? AND ?
      ORDER BY sales_date ASC
    `;
    const [rows] = await pool.query(sql, [startDate, endDate]);
    return rows;
  }
};
