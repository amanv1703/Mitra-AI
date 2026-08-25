/**
 * MITRA AI — Dashboard Repository
 * Database access for executive KPI aggregations
 */

const { query } = require('../config/db');

class DashboardRepository {
  async getSummary(startDate, endDate) {
    // 1. Order & Sales Aggregates
    const orderSql = `
      SELECT 
        COUNT(id) AS total_orders,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) AS total_sales,
        COALESCE(AVG(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE NULL END), 0) AS average_order_value,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
        COUNT(DISTINCT CASE WHEN status != 'CANCELLED' THEN customer_id END) AS active_customers
      FROM orders
      WHERE order_date BETWEEN ? AND ?
    `;
    const orderRows = await query(orderSql, [startDate, endDate]);
    const orderStats = orderRows[0] || {};

    // 2. Payment Aggregates
    const paymentSql = `
      SELECT 
        COUNT(id) AS total_payments,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS successful_payments,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_payments,
        COALESCE(SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END), 0) AS failed_payment_volume
      FROM payments
      WHERE initiated_at BETWEEN ? AND ?
    `;
    const paymentRows = await query(paymentSql, [startDate, endDate]);
    const paymentStats = paymentRows[0] || {};

    // 3. Refund Aggregates
    const refundSql = `
      SELECT 
        COUNT(id) AS total_refunds,
        COALESCE(SUM(amount), 0) AS total_refund_amount
      FROM refunds
      WHERE created_at BETWEEN ? AND ?
    `;
    const refundRows = await query(refundSql, [startDate, endDate]);
    const refundStats = refundRows[0] || {};

    // 4. Low Stock / Stockout Count
    const stockSql = `
      SELECT 
        COUNT(p.id) AS low_stock_count,
        SUM(CASE WHEN (i.current_stock - i.reserved_stock) <= 0 THEN 1 ELSE 0 END) AS out_of_stock_count
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE p.status = 'ACTIVE' AND (i.current_stock - i.reserved_stock) <= p.reorder_point
    `;
    const stockRows = await query(stockSql);
    const stockStats = stockRows[0] || {};

    return {
      totalSales: Number(orderStats.total_sales) || 0,
      totalOrders: Number(orderStats.total_orders) || 0,
      averageOrderValue: Number(orderStats.average_order_value) || 0,
      pendingOrders: Number(orderStats.pending_orders) || 0,
      activeCustomers: Number(orderStats.active_customers) || 0,
      successfulPayments: Number(paymentStats.successful_payments) || 0,
      failedPayments: Number(paymentStats.failed_payments) || 0,
      failedPaymentVolume: Number(paymentStats.failed_payment_volume) || 0,
      totalRefunds: Number(refundStats.total_refunds) || 0,
      refundAmount: Number(refundStats.total_refund_amount) || 0,
      lowStockCount: Number(stockStats.low_stock_count) || 0,
      outOfStockCount: Number(stockStats.out_of_stock_count) || 0
    };
  }
}

module.exports = new DashboardRepository();
