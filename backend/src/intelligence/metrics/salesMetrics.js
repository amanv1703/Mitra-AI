/**
 * MITRA AI — Sales Metrics Engine
 */

const { query } = require('../../config/db');

class SalesMetrics {
  async calculateSalesMetrics(fromSql, toSql) {
    const sql = `
      SELECT 
        COUNT(id) AS total_orders,
        SUM(CASE WHEN status != 'CANCELLED' THEN 1 ELSE 0 END) AS successful_orders,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(AVG(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE NULL END), 0) AS average_order_value,
        COALESCE(SUM(discount_amount), 0) AS total_discounts
      FROM orders
      WHERE order_date BETWEEN ? AND ?
    `;

    const rows = await query(sql, [fromSql, toSql]);
    const res = rows[0] || {};

    const unitsSql = `
      SELECT COALESCE(SUM(oi.quantity), 0) AS total_units_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_date BETWEEN ? AND ? AND o.status != 'CANCELLED'
    `;
    const unitRows = await query(unitsSql, [fromSql, toSql]);
    const unitsSold = Number(unitRows[0]?.total_units_sold) || 0;

    return {
      totalRevenue: Number(res.total_revenue) || 0,
      totalOrders: Number(res.total_orders) || 0,
      successfulOrders: Number(res.successful_orders) || 0,
      cancelledOrders: Number(res.cancelled_orders) || 0,
      averageOrderValue: Number(res.average_order_value) || 0,
      totalUnitsSold: unitsSold,
      totalDiscounts: Number(res.total_discounts) || 0
    };
  }

  async getDailySalesTimeSeries(fromSql, toSql) {
    const sql = `
      SELECT 
        DATE(order_date) AS date,
        COUNT(id) AS order_count,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) AS daily_revenue,
        COALESCE(AVG(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE NULL END), 0) AS aov
      FROM orders
      WHERE order_date BETWEEN ? AND ?
      GROUP BY DATE(order_date)
      ORDER BY date ASC
    `;
    const rows = await query(sql, [fromSql, toSql]);
    return rows.map(r => ({
      date: r.date,
      orders: Number(r.order_count),
      revenue: Number(r.daily_revenue),
      aov: Number(r.aov)
    }));
  }
}

module.exports = new SalesMetrics();
