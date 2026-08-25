/**
 * MITRA AI — Analytics Repository
 * Database access for time-series sales, cross-domain telemetry, and regional delivery metrics
 */

const { query } = require('../config/db');

class AnalyticsRepository {
  async getSalesTimeSeries({ from, to, groupBy = 'day' }) {
    let dateGroupFormat = '%Y-%m-%d';
    if (groupBy === 'week') {
      dateGroupFormat = '%Y-W%u'; // ISO week
    } else if (groupBy === 'month') {
      dateGroupFormat = '%Y-%m';
    }

    const sql = `
      SELECT 
        DATE_FORMAT(order_date, ?) AS date_bucket,
        MIN(DATE(order_date)) AS period_start,
        COUNT(id) AS total_orders,
        SUM(CASE WHEN status != 'CANCELLED' THEN 1 ELSE 0 END) AS successful_orders,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) AS gross_sales,
        COALESCE(AVG(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE NULL END), 0) AS average_order_value,
        COALESCE(SUM(discount_amount), 0) AS total_discounts
      FROM orders
      WHERE order_date BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(order_date, ?)
      ORDER BY MIN(order_date) ASC
    `;

    const rows = await query(sql, [dateGroupFormat, from, to, dateGroupFormat]);
    return rows.map(r => ({
      bucket: r.date_bucket,
      date: r.period_start,
      orders: Number(r.total_orders),
      successfulOrders: Number(r.successful_orders),
      cancelledOrders: Number(r.cancelled_orders),
      sales: Number(r.gross_sales),
      averageOrderValue: Number(r.average_order_value),
      discounts: Number(r.total_discounts)
    }));
  }

  async getPeriodAggregates(from, to) {
    const sql = `
      SELECT 
        COUNT(id) AS total_orders,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) AS gross_sales,
        COALESCE(AVG(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE NULL END), 0) AS aov
      FROM orders
      WHERE order_date BETWEEN ? AND ?
    `;
    const rows = await query(sql, [from, to]);
    const res = rows[0] || {};
    return {
      totalOrders: Number(res.total_orders) || 0,
      grossSales: Number(res.gross_sales) || 0,
      aov: Number(res.aov) || 0
    };
  }

  async getDeliveryPerformanceByCity(from, to) {
    const sql = `
      SELECT 
        shipping_city AS city,
        shipping_state AS state,
        COUNT(id) AS total_orders,
        SUM(CASE WHEN delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
        SUM(CASE WHEN delivery_status = 'DELAYED' THEN 1 ELSE 0 END) AS delayed_count,
        SUM(CASE WHEN delivery_status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
        ROUND((SUM(CASE WHEN delivery_status = 'DELAYED' THEN 1 ELSE 0 END) / COUNT(id)) * 100, 2) AS delayed_rate_pct,
        ROUND(AVG(DATEDIFF(COALESCE(actual_delivery_date, NOW()), promised_delivery_date)), 1) AS avg_delay_days
      FROM orders
      WHERE order_date BETWEEN ? AND ? AND status IN ('SHIPPED', 'DELIVERED')
      GROUP BY shipping_city, shipping_state
      ORDER BY delayed_rate_pct DESC
    `;
    const rows = await query(sql, [from, to]);
    return rows.map(r => ({
      city: r.city,
      state: r.state,
      totalOrders: Number(r.total_orders),
      deliveredCount: Number(r.delivered_count),
      delayedCount: Number(r.delayed_count),
      failedCount: Number(r.failed_count),
      delayedRatePct: Number(r.delayed_rate_pct),
      avgDelayDays: Number(r.avg_delay_days) || 0
    }));
  }
}

module.exports = new AnalyticsRepository();
