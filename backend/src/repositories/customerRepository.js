/**
 * MITRA AI — Customer Repository
 * Database access for customer master, cohorts, and churn telemetry
 */

const { query } = require('../config/db');

class CustomerRepository {
  async findCustomers({ limit, offset, segment, city, search, sortBy = 'total_spend', sortOrder = 'DESC' }) {
    const params = [];
    const whereClauses = [];

    if (segment) {
      whereClauses.push('segment = ?');
      params.push(segment);
    }
    if (city) {
      whereClauses.push('city = ?');
      params.push(city);
    }
    if (search) {
      whereClauses.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR customer_code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const validSortFields = ['total_spend', 'total_orders_count', 'last_order_date', 'created_at'];
    const safeSort = validSortFields.includes(sortBy) ? sortBy : 'total_spend';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        id,
        customer_code,
        first_name,
        last_name,
        email,
        phone,
        city,
        state,
        pincode,
        segment,
        total_orders_count,
        total_spend,
        first_order_date,
        last_order_date,
        created_at
      FROM customers
      ${whereSql}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    return await query(sql, params);
  }

  async countCustomers({ segment, city, search }) {
    const params = [];
    const whereClauses = [];

    if (segment) {
      whereClauses.push('segment = ?');
      params.push(segment);
    }
    if (city) {
      whereClauses.push('city = ?');
      params.push(city);
    }
    if (search) {
      whereClauses.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR customer_code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT COUNT(id) AS total FROM customers ${whereSql}`;
    const rows = await query(sql, params);
    return Number(rows[0]?.total) || 0;
  }

  async findById(customerId) {
    const customerSql = `SELECT * FROM customers WHERE id = ?`;
    const customerRows = await query(customerSql, [customerId]);
    if (customerRows.length === 0) return null;
    const customer = customerRows[0];

    // Order history (last 10)
    const orderSql = `
      SELECT id, order_number, order_date, total_amount, status, delivery_status 
      FROM orders 
      WHERE customer_id = ? 
      ORDER BY order_date DESC 
      LIMIT 10
    `;
    const orders = await query(orderSql, [customerId]);

    // Payment metrics
    const paymentSql = `
      SELECT 
        COUNT(id) AS total_payment_attempts,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_payment_count,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS successful_payment_count
      FROM payments
      WHERE customer_id = ?
    `;
    const paymentStats = (await query(paymentSql, [customerId]))[0] || {};

    // Refund count
    const refundSql = `
      SELECT COUNT(r.id) AS refund_count, COALESCE(SUM(r.amount), 0) AS total_refunded_amount
      FROM refunds r
      JOIN orders o ON r.order_id = o.id
      WHERE o.customer_id = ?
    `;
    const refundStats = (await query(refundSql, [customerId]))[0] || {};

    return {
      ...customer,
      recentOrders: orders,
      paymentMetrics: {
        totalAttempts: Number(paymentStats.total_payment_attempts) || 0,
        failedAttempts: Number(paymentStats.failed_payment_count) || 0,
        successfulAttempts: Number(paymentStats.successful_payment_count) || 0
      },
      refundMetrics: {
        refundCount: Number(refundStats.refund_count) || 0,
        totalRefundedAmount: Number(refundStats.total_refunded_amount) || 0
      }
    };
  }

  async getAtRiskCustomers() {
    // Queries customer churn signals using latest order date in database as reference
    const sql = `
      WITH max_date AS (
        SELECT COALESCE(MAX(order_date), NOW()) AS ref_date FROM orders
      )
      SELECT 
        c.id AS customer_id,
        c.customer_code,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.email,
        c.city,
        c.state,
        c.segment,
        c.total_orders_count,
        c.total_spend,
        c.last_order_date,
        DATEDIFF(md.ref_date, c.last_order_date) AS days_since_last_order,
        COUNT(CASE WHEN p.status = 'FAILED' AND p.initiated_at >= DATE_SUB(md.ref_date, INTERVAL 30 DAY) THEN 1 END) AS recent_payment_failures
      FROM customers c
      CROSS JOIN max_date md
      LEFT JOIN payments p ON c.id = p.customer_id
      WHERE c.segment IN ('LOYAL', 'REGULAR')
      GROUP BY c.id, c.customer_code, c.first_name, c.last_name, c.email, c.city, c.state, c.segment, c.total_orders_count, c.total_spend, c.last_order_date, md.ref_date
      HAVING (days_since_last_order >= 25 AND recent_payment_failures >= 2) OR (days_since_last_order >= 45)
      ORDER BY c.total_spend DESC
    `;
    const rows = await query(sql);
    return rows.map(r => ({
      customerId: r.customer_id,
      customerCode: r.customer_code,
      name: r.customer_name,
      email: r.email,
      city: r.city,
      segment: r.segment,
      totalSpend: Number(r.total_spend),
      totalOrders: Number(r.total_orders_count),
      lastOrderDate: r.last_order_date,
      daysSinceLastOrder: Number(r.days_since_last_order),
      recentPaymentFailures: Number(r.recent_payment_failures),
      churnRiskLevel: (r.recent_payment_failures >= 2 && r.segment === 'LOYAL') ? 'CRITICAL_FRICTION' : 'DORMANT'
    }));
  }
}

module.exports = new CustomerRepository();
