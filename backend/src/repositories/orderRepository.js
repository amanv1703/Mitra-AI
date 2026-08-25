/**
 * MITRA AI — Order Repository
 * Database access for orders, line items, and delivery telemetry
 */

const { query } = require('../config/db');

class OrderRepository {
  async findOrders({ limit, offset, status, deliveryStatus, city, customerId, from, to, sortBy = 'order_date', sortOrder = 'DESC' }) {
    const params = [];
    const whereClauses = [];

    if (status) {
      whereClauses.push('o.status = ?');
      params.push(status);
    }
    if (deliveryStatus) {
      whereClauses.push('o.delivery_status = ?');
      params.push(deliveryStatus);
    }
    if (city) {
      whereClauses.push('o.shipping_city = ?');
      params.push(city);
    }
    if (customerId) {
      whereClauses.push('o.customer_id = ?');
      params.push(customerId);
    }
    if (from && to) {
      whereClauses.push('o.order_date BETWEEN ? AND ?');
      params.push(from, to);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const validSortFields = ['order_date', 'total_amount', 'status', 'delivery_status', 'shipping_city'];
    const safeSort = validSortFields.includes(sortBy) ? sortBy : 'order_date';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        o.id,
        o.order_number,
        o.order_date,
        o.subtotal,
        o.discount_amount,
        o.tax_amount,
        o.shipping_amount,
        o.total_amount,
        o.status,
        o.shipping_city,
        o.shipping_state,
        o.shipping_pincode,
        o.carrier_name,
        o.tracking_number,
        o.delivery_status,
        o.promised_delivery_date,
        o.actual_delivery_date,
        c.id AS customer_id,
        c.customer_code,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.email AS customer_email
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ${whereSql}
      ORDER BY o.${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    return await query(sql, params);
  }

  async countOrders({ status, deliveryStatus, city, customerId, from, to }) {
    const params = [];
    const whereClauses = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    if (deliveryStatus) {
      whereClauses.push('delivery_status = ?');
      params.push(deliveryStatus);
    }
    if (city) {
      whereClauses.push('shipping_city = ?');
      params.push(city);
    }
    if (customerId) {
      whereClauses.push('customer_id = ?');
      params.push(customerId);
    }
    if (from && to) {
      whereClauses.push('order_date BETWEEN ? AND ?');
      params.push(from, to);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT COUNT(id) AS total FROM orders ${whereSql}`;
    const rows = await query(sql, params);
    return Number(rows[0]?.total) || 0;
  }

  async findById(orderId) {
    // 1. Order details
    const orderSql = `
      SELECT 
        o.*,
        c.customer_code,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.segment
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `;
    const orderRows = await query(orderSql, [orderId]);
    if (orderRows.length === 0) return null;
    const order = orderRows[0];

    // 2. Order items
    const itemsSql = `
      SELECT 
        oi.id,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        oi.unit_cost,
        oi.total_price,
        p.sku,
        p.name AS product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    const items = await query(itemsSql, [orderId]);

    // 3. Payments
    const paymentsSql = `
      SELECT * FROM payments WHERE order_id = ?
    `;
    const payments = await query(paymentsSql, [orderId]);

    // 4. Refunds
    const refundsSql = `
      SELECT * FROM refunds WHERE order_id = ?
    `;
    const refunds = await query(refundsSql, [orderId]);

    return {
      ...order,
      items,
      payments,
      refunds
    };
  }

  async getSummary(from, to) {
    const params = [from, to];
    const sql = `
      SELECT 
        COUNT(id) AS total_orders,
        SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS completed_orders,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
        SUM(CASE WHEN status = 'PENDING' OR status = 'CONFIRMED' OR status = 'SHIPPED' THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN delivery_status = 'DELAYED' THEN 1 ELSE 0 END) AS delayed_deliveries,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) AS total_revenue
      FROM orders
      WHERE order_date BETWEEN ? AND ?
    `;
    const rows = await query(sql, params);
    const summary = rows[0] || {};

    return {
      totalOrders: Number(summary.total_orders) || 0,
      completedOrders: Number(summary.completed_orders) || 0,
      cancelledOrders: Number(summary.cancelled_orders) || 0,
      pendingOrders: Number(summary.pending_orders) || 0,
      delayedDeliveries: Number(summary.delayed_deliveries) || 0,
      totalRevenue: Number(summary.total_revenue) || 0
    };
  }
}

module.exports = new OrderRepository();
