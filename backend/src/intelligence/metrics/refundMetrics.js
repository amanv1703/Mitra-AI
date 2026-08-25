/**
 * MITRA AI — Refund Metrics Engine
 */

const { query } = require('../../config/db');

class RefundMetrics {
  async calculateRefundMetrics(fromSql, toSql) {
    const sql = `
      SELECT 
        COUNT(r.id) AS total_refunds,
        COALESCE(SUM(r.amount), 0) AS total_refund_amount
      FROM refunds r
      WHERE r.created_at BETWEEN ? AND ?
    `;
    const rows = await query(sql, [fromSql, toSql]);
    const res = rows[0] || {};

    const orderSql = `
      SELECT COUNT(id) AS total_orders 
      FROM orders 
      WHERE order_date BETWEEN ? AND ? AND status != 'CANCELLED'
    `;
    const orderRows = await query(orderSql, [fromSql, toSql]);
    const totalOrders = Number(orderRows[0]?.total_orders) || 0;
    const totalRefunds = Number(res.total_refunds) || 0;
    const refundRate = totalOrders > 0 ? (totalRefunds / totalOrders) : 0;

    // Reason breakdown
    const reasonsSql = `
      SELECT 
        reason_code,
        COUNT(id) AS count,
        COALESCE(SUM(amount), 0) AS amount,
        ROUND((COUNT(id) / ? ) * 100, 2) AS percentage_of_refunds
      FROM refunds
      WHERE created_at BETWEEN ? AND ?
      GROUP BY reason_code
      ORDER BY count DESC
    `;
    const reasons = totalRefunds > 0 ? await query(reasonsSql, [totalRefunds, fromSql, toSql]) : [];

    return {
      totalRefunds,
      totalRefundAmount: Number(res.total_refund_amount) || 0,
      totalOrders,
      refundRate: Number(refundRate.toFixed(4)),
      refundRatePct: Number((refundRate * 100).toFixed(2)),
      reasons: reasons.map(r => ({
        reason: r.reason_code,
        count: Number(r.count),
        amount: Number(r.amount),
        percentage: Number(r.percentage_of_refunds)
      }))
    };
  }

  async getProductRefundRates(fromSql, toSql) {
    const sql = `
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        s.name AS supplier_name,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COUNT(DISTINCT r.id) AS refund_count,
        COALESCE(SUM(r.amount), 0) AS refund_amount,
        ROUND((COUNT(DISTINCT r.id) / NULLIF(COUNT(DISTINCT oi.order_id), 0)) * 100, 2) AS refund_rate_pct,
        SUM(CASE WHEN r.reason_code = 'DAMAGED_PRODUCT' THEN 1 ELSE 0 END) AS damaged_count
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN refunds r ON oi.order_id = r.order_id
      WHERE o.order_date BETWEEN ? AND ? AND o.status != 'CANCELLED'
      GROUP BY p.id, p.sku, p.name, s.name
      HAVING refund_count > 0
      ORDER BY refund_rate_pct DESC
    `;
    const rows = await query(sql, [fromSql, toSql]);
    return rows.map(r => ({
      productId: r.product_id,
      sku: r.sku,
      productName: r.product_name,
      supplierName: r.supplier_name,
      unitsSold: Number(r.units_sold),
      refundCount: Number(r.refund_count),
      refundAmount: Number(r.refund_amount),
      refundRatePct: Number(r.refund_rate_pct),
      damagedCount: Number(r.damaged_count)
    }));
  }

  async getCityRefundRates(fromSql, toSql) {
    const sql = `
      SELECT 
        o.shipping_city AS city,
        o.shipping_state AS state,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT r.id) AS refund_count,
        COALESCE(SUM(r.amount), 0) AS refund_amount,
        ROUND((COUNT(DISTINCT r.id) / COUNT(DISTINCT o.id)) * 100, 2) AS refund_rate_pct,
        SUM(CASE WHEN r.reason_code = 'DELIVERY_DELAY' THEN 1 ELSE 0 END) AS delay_refunds
      FROM orders o
      LEFT JOIN refunds r ON o.id = r.order_id
      WHERE o.order_date BETWEEN ? AND ? AND o.status != 'CANCELLED'
      GROUP BY o.shipping_city, o.shipping_state
      ORDER BY refund_rate_pct DESC
    `;
    const rows = await query(sql, [fromSql, toSql]);
    return rows.map(r => ({
      city: r.city,
      state: r.state,
      totalOrders: Number(r.total_orders),
      refundCount: Number(r.refund_count),
      refundAmount: Number(r.refund_amount),
      refundRatePct: Number(r.refund_rate_pct),
      delayRefunds: Number(r.delay_refunds)
    }));
  }
}

module.exports = new RefundMetrics();
