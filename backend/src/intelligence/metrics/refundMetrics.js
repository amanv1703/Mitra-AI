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
        COALESCE(sales.units_sold, 0) AS units_sold,
        ref.refund_count,
        ref.refund_amount,
        ROUND((ref.refund_count / NULLIF(sales.order_count, 0)) * 100, 2) AS refund_rate_pct,
        ref.damaged_count
      FROM (
        SELECT 
          oi.product_id,
          COUNT(DISTINCT r.id) AS refund_count,
          SUM(r.amount) AS refund_amount,
          SUM(CASE WHEN r.reason_code = 'DAMAGED_PRODUCT' THEN 1 ELSE 0 END) AS damaged_count
        FROM refunds r
        JOIN order_items oi ON r.order_id = oi.order_id
        JOIN orders o ON r.order_id = o.id
        WHERE o.order_date BETWEEN ? AND ? AND o.status != 'CANCELLED'
        GROUP BY oi.product_id
      ) ref
      JOIN products p ON ref.product_id = p.id
      JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN (
        SELECT 
          oi.product_id,
          SUM(oi.quantity) AS units_sold,
          COUNT(DISTINCT oi.order_id) AS order_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_date BETWEEN ? AND ? AND o.status != 'CANCELLED'
        GROUP BY oi.product_id
      ) sales ON p.id = sales.product_id
      ORDER BY refund_rate_pct DESC
    `;
    const rows = await query(sql, [fromSql, toSql, fromSql, toSql]);
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
        o_city.shipping_city AS city,
        o_city.shipping_state AS state,
        o_city.total_orders,
        COALESCE(r_city.refund_count, 0) AS refund_count,
        COALESCE(r_city.refund_amount, 0) AS refund_amount,
        ROUND((COALESCE(r_city.refund_count, 0) / o_city.total_orders) * 100, 2) AS refund_rate_pct,
        COALESCE(r_city.delay_refunds, 0) AS delay_refunds
      FROM (
        SELECT shipping_city, shipping_state, COUNT(id) AS total_orders
        FROM orders
        WHERE order_date BETWEEN ? AND ? AND status != 'CANCELLED'
        GROUP BY shipping_city, shipping_state
      ) o_city
      LEFT JOIN (
        SELECT 
          o.shipping_city,
          o.shipping_state,
          COUNT(r.id) AS refund_count,
          SUM(r.amount) AS refund_amount,
          SUM(CASE WHEN r.reason_code = 'DELIVERY_DELAY' THEN 1 ELSE 0 END) AS delay_refunds
        FROM refunds r
        JOIN orders o ON r.order_id = o.id
        WHERE o.order_date BETWEEN ? AND ? AND o.status != 'CANCELLED'
        GROUP BY o.shipping_city, o.shipping_state
      ) r_city ON o_city.shipping_city = r_city.shipping_city AND o_city.shipping_state = r_city.shipping_state
      ORDER BY refund_rate_pct DESC
    `;
    const rows = await query(sql, [fromSql, toSql, fromSql, toSql]);
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
