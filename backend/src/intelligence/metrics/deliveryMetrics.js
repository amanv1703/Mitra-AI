/**
 * MITRA AI — Delivery & Logistics Metrics Engine
 */

const { query } = require('../../config/db');

class DeliveryMetrics {
  async calculateDeliveryMetrics(fromSql, toSql) {
    const sql = `
      SELECT 
        COUNT(id) AS total_shipments,
        SUM(CASE WHEN delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
        SUM(CASE WHEN delivery_status = 'DELAYED' THEN 1 ELSE 0 END) AS delayed_count,
        SUM(CASE WHEN delivery_status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
        ROUND((SUM(CASE WHEN delivery_status = 'DELAYED' THEN 1 ELSE 0 END) / COUNT(id)) * 100, 2) AS delayed_rate_pct,
        ROUND(AVG(DATEDIFF(COALESCE(actual_delivery_date, NOW()), promised_delivery_date)), 1) AS avg_delay_days
      FROM orders
      WHERE order_date BETWEEN ? AND ? AND status IN ('SHIPPED', 'DELIVERED')
    `;
    const rows = await query(sql, [fromSql, toSql]);
    const res = rows[0] || {};

    return {
      totalShipments: Number(res.total_shipments) || 0,
      deliveredCount: Number(res.delivered_count) || 0,
      delayedCount: Number(res.delayed_count) || 0,
      failedCount: Number(res.failed_count) || 0,
      delayedRatePct: Number(res.delayed_rate_pct) || 0,
      avgDelayDays: Number(res.avg_delay_days) || 0
    };
  }

  async getCityDeliveryPerformance(fromSql, toSql) {
    const sql = `
      SELECT 
        shipping_city AS city,
        shipping_state AS state,
        carrier_name,
        COUNT(id) AS total_orders,
        SUM(CASE WHEN delivery_status = 'DELAYED' THEN 1 ELSE 0 END) AS delayed_count,
        SUM(CASE WHEN delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
        ROUND((SUM(CASE WHEN delivery_status = 'DELAYED' THEN 1 ELSE 0 END) / COUNT(id)) * 100, 2) AS delayed_rate_pct,
        ROUND(AVG(DATEDIFF(COALESCE(actual_delivery_date, NOW()), promised_delivery_date)), 1) AS avg_delay_days
      FROM orders
      WHERE order_date BETWEEN ? AND ? AND status IN ('SHIPPED', 'DELIVERED')
      GROUP BY shipping_city, shipping_state, carrier_name
      ORDER BY delayed_rate_pct DESC
    `;
    const rows = await query(sql, [fromSql, toSql]);
    return rows.map(r => ({
      city: r.city,
      state: r.state,
      carrierName: r.carrier_name,
      totalOrders: Number(r.total_orders),
      delayedCount: Number(r.delayed_count),
      deliveredCount: Number(r.delivered_count),
      delayedRatePct: Number(r.delayed_rate_pct),
      avgDelayDays: Number(r.avg_delay_days) || 0
    }));
  }
}

module.exports = new DeliveryMetrics();
