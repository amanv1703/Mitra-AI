/**
 * MITRA AI — Refund Repository
 * Database access for refunds, return reasons, and anomaly tracking
 */

const { query } = require('../config/db');

class RefundRepository {
  async findRefunds({ limit, offset, reason, status, from, to, productId, sortBy = 'created_at', sortOrder = 'DESC' }) {
    const params = [];
    const whereClauses = [];

    if (reason) {
      whereClauses.push('r.reason_code = ?');
      params.push(reason);
    }
    if (status) {
      whereClauses.push('r.status = ?');
      params.push(status);
    }
    if (from && to) {
      whereClauses.push('r.created_at BETWEEN ? AND ?');
      params.push(from, to);
    }
    if (productId) {
      whereClauses.push('EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = r.order_id AND oi.product_id = ?)');
      params.push(productId);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const validSortFields = ['created_at', 'amount', 'reason_code', 'status'];
    const safeSort = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        r.id,
        r.order_id,
        r.payment_id,
        r.gateway_refund_id,
        r.amount,
        r.currency,
        r.reason_code,
        r.reason_description,
        r.status,
        r.created_at,
        o.order_number,
        o.shipping_city,
        o.carrier_name,
        c.customer_code,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name
      FROM refunds r
      JOIN orders o ON r.order_id = o.id
      JOIN customers c ON o.customer_id = c.id
      ${whereSql}
      ORDER BY r.${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    return await query(sql, params);
  }

  async countRefunds({ reason, status, from, to, productId }) {
    const params = [];
    const whereClauses = [];

    if (reason) {
      whereClauses.push('r.reason_code = ?');
      params.push(reason);
    }
    if (status) {
      whereClauses.push('r.status = ?');
      params.push(status);
    }
    if (from && to) {
      whereClauses.push('r.created_at BETWEEN ? AND ?');
      params.push(from, to);
    }
    if (productId) {
      whereClauses.push('EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = r.order_id AND oi.product_id = ?)');
      params.push(productId);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT COUNT(r.id) AS total FROM refunds r ${whereSql}`;
    const rows = await query(sql, params);
    return Number(rows[0]?.total) || 0;
  }

  async getSummary(from, to) {
    const params = [from, to];
    const sql = `
      SELECT 
        COUNT(r.id) AS refund_count,
        COALESCE(SUM(r.amount), 0) AS total_refund_amount
      FROM refunds r
      WHERE r.created_at BETWEEN ? AND ?
    `;
    const rows = await query(sql, params);
    const refundData = rows[0] || {};

    // Get order count in same window to compute refund rate %
    const orderSql = `
      SELECT COUNT(id) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue 
      FROM orders 
      WHERE order_date BETWEEN ? AND ? AND status != 'CANCELLED'
    `;
    const orderRows = await query(orderSql, params);
    const orderData = orderRows[0] || {};

    const totalOrders = Number(orderData.total_orders) || 0;
    const totalRefunds = Number(refundData.refund_count) || 0;
    const refundRatePct = totalOrders > 0 ? Number(((totalRefunds / totalOrders) * 100).toFixed(2)) : 0;

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
    const reasons = totalRefunds > 0 ? await query(reasonsSql, [totalRefunds, from, to]) : [];

    return {
      refundCount: totalRefunds,
      totalRefundAmount: Number(refundData.total_refund_amount) || 0,
      totalOrdersEvaluated: totalOrders,
      refundRatePct,
      reasons: reasons.map(r => ({
        reason: r.reason_code,
        count: Number(r.count),
        amount: Number(r.amount),
        percentage: Number(r.percentage_of_refunds)
      }))
    };
  }

  async getTrends(from, to) {
    const sql = `
      SELECT 
        DATE(r.created_at) AS date,
        COUNT(r.id) AS refund_count,
        COALESCE(SUM(r.amount), 0) AS refund_amount,
        SUM(CASE WHEN r.reason_code = 'DELIVERY_DELAY' THEN 1 ELSE 0 END) AS delivery_delay_count,
        SUM(CASE WHEN r.reason_code = 'DAMAGED_PRODUCT' THEN 1 ELSE 0 END) AS damaged_product_count,
        SUM(CASE WHEN r.reason_code = 'CUSTOMER_CANCELLATION' THEN 1 ELSE 0 END) AS cancellation_count
      FROM refunds r
      WHERE r.created_at BETWEEN ? AND ?
      GROUP BY DATE(r.created_at)
      ORDER BY date ASC
    `;
    const rows = await query(sql, [from, to]);
    return rows.map(r => ({
      date: r.date,
      count: Number(r.refund_count),
      amount: Number(r.refund_amount),
      breakdown: {
        deliveryDelay: Number(r.delivery_delay_count),
        damagedProduct: Number(r.damaged_product_count),
        cancellation: Number(r.cancellation_count)
      }
    }));
  }
}

module.exports = new RefundRepository();
