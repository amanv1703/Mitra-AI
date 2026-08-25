/**
 * MITRA AI — Inventory Velocity & Stockout Risk Tools
 */

const { pool } = require('../../config/db');

module.exports = {
  definition: {
    name: 'get_inventory_stockout_risks',
    description: 'Returns products at critical risk of stockout based on daily sales velocity and supplier lead times.',
    parameters: {
      type: 'object',
      properties: {
        riskStatus: {
          type: 'string',
          enum: ['CRITICAL_STOCKOUT_RISK', 'REORDER_REQUIRED', 'OUT_OF_STOCK', 'ALL'],
          description: 'Filter by stockout urgency level'
        },
        limit: { type: 'number', description: 'Max records to return (default: 20)' }
      }
    }
  },

  handler: async ({ riskStatus = 'ALL', limit = 20 }) => {
    let sql = `
      SELECT 
        product_id,
        sku,
        product_name,
        category_name,
        supplier_name,
        supplier_lead_time_days,
        current_stock,
        available_stock,
        reorder_point,
        reorder_quantity,
        avg_daily_velocity,
        days_of_inventory_remaining,
        stock_risk_status
      FROM v_product_stockout_risk
    `;

    const params = [];
    if (riskStatus !== 'ALL') {
      sql += ' WHERE stock_risk_status = ? ';
      params.push(riskStatus);
    }

    sql += ' ORDER BY days_of_inventory_remaining ASC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    return rows;
  }
};
