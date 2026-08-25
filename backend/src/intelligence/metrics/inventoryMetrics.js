/**
 * MITRA AI — Inventory Metrics Engine
 */

const { query } = require('../../config/db');

class InventoryMetrics {
  async calculateInventoryMetrics() {
    const sql = `
      SELECT 
        COUNT(p.id) AS total_products,
        COALESCE(SUM(i.current_stock * p.cost_price), 0) AS total_stock_valuation,
        SUM(CASE WHEN (i.current_stock - i.reserved_stock) <= 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        SUM(CASE WHEN (i.current_stock - i.reserved_stock) > 0 AND (i.current_stock - i.reserved_stock) <= p.safety_stock THEN 1 ELSE 0 END) AS critical_stock_count,
        SUM(CASE WHEN (i.current_stock - i.reserved_stock) > p.safety_stock AND (i.current_stock - i.reserved_stock) <= p.reorder_point THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN (i.current_stock - i.reserved_stock) > p.reorder_point THEN 1 ELSE 0 END) AS healthy_stock_count
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE p.status = 'ACTIVE'
    `;

    const rows = await query(sql);
    const res = rows[0] || {};

    return {
      totalProducts: Number(res.total_products) || 0,
      totalStockValuation: Number(res.total_stock_valuation) || 0,
      outOfStockCount: Number(res.out_of_stock_count) || 0,
      criticalStockCount: Number(res.critical_stock_count) || 0,
      lowStockCount: Number(res.low_stock_count) || 0,
      healthyStockCount: Number(res.healthy_stock_count) || 0
    };
  }

  async getProductVelocityMatrix() {
    const sql = `
      WITH max_date AS (
        SELECT COALESCE(MAX(order_date), NOW()) AS ref_date FROM orders
      ),
      sales_14d AS (
        SELECT 
          oi.product_id,
          COALESCE(SUM(oi.quantity), 0) AS units_sold_14d,
          ROUND(COALESCE(SUM(oi.quantity), 0) / 14.0, 2) AS daily_velocity_14d
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        CROSS JOIN max_date md
        WHERE o.order_date >= DATE_SUB(md.ref_date, INTERVAL 14 DAY) AND o.status != 'CANCELLED'
        GROUP BY oi.product_id
      ),
      sales_90d AS (
        SELECT 
          oi.product_id,
          COALESCE(SUM(oi.quantity), 0) AS units_sold_90d,
          ROUND(COALESCE(SUM(oi.quantity), 0) / 90.0, 2) AS daily_velocity_90d
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'CANCELLED'
        GROUP BY oi.product_id
      )
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        p.cost_price,
        p.selling_price,
        p.reorder_point,
        p.reorder_quantity,
        s.id AS supplier_id,
        s.name AS supplier_name,
        s.lead_time_days AS supplier_lead_time_days,
        i.current_stock,
        i.reserved_stock,
        (i.current_stock - i.reserved_stock) AS available_stock,
        COALESCE(s14.daily_velocity_14d, 0) AS daily_velocity_14d,
        COALESCE(s90.daily_velocity_90d, 0) AS daily_velocity_90d,
        CASE 
          WHEN COALESCE(s14.daily_velocity_14d, 0) = 0 THEN 999.0
          ELSE ROUND((i.current_stock - i.reserved_stock) / s14.daily_velocity_14d, 1)
        END AS days_of_stock_remaining
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN inventory i ON p.id = i.product_id
      LEFT JOIN sales_14d s14 ON p.id = s14.product_id
      LEFT JOIN sales_90d s90 ON p.id = s90.product_id
      WHERE p.status = 'ACTIVE'
    `;

    const rows = await query(sql);
    return rows.map(r => ({
      productId: r.product_id,
      sku: r.sku,
      productName: r.product_name,
      costPrice: Number(r.cost_price),
      sellingPrice: Number(r.selling_price),
      reorderPoint: Number(r.reorder_point),
      reorderQuantity: Number(r.reorder_quantity),
      supplierId: r.supplier_id,
      supplierName: r.supplier_name,
      supplierLeadTimeDays: Number(r.supplier_lead_time_days),
      currentStock: Number(r.current_stock),
      reservedStock: Number(r.reserved_stock),
      availableStock: Number(r.available_stock),
      dailyVelocity14d: Number(r.daily_velocity_14d),
      dailyVelocity90d: Number(r.daily_velocity_90d),
      daysOfStockRemaining: Number(r.days_of_stock_remaining),
      leadTimeShortfallDays: Number(r.days_of_stock_remaining) < Number(r.supplier_lead_time_days)
        ? Number((Number(r.supplier_lead_time_days) - Number(r.days_of_stock_remaining)).toFixed(1))
        : 0
    }));
  }
}

module.exports = new InventoryMetrics();
