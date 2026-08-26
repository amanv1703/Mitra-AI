/**
 * MITRA AI — Inventory Repository
 * Database access for stock levels, movements, and stockout risk calculations
 */

const { query } = require('../config/db');

class InventoryRepository {
  async getInventory({ limit, offset, search, categoryId }) {
    const params = [];
    const whereClauses = ["p.status = 'ACTIVE'"];

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      whereClauses.push('p.category_id = ?');
      params.push(categoryId);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const sql = `
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        c.name AS category_name,
        s.name AS supplier_name,
        s.lead_time_days AS supplier_lead_time_days,
        p.cost_price,
        p.selling_price,
        p.reorder_point,
        p.reorder_quantity,
        p.safety_stock,
        i.current_stock,
        i.reserved_stock,
        i.incoming_stock,
        (i.current_stock - i.reserved_stock) AS available_stock,
        i.warehouse_location,
        i.last_restocked_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN inventory i ON p.id = i.product_id
      ${whereSql}
      ORDER BY available_stock ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    return await query(sql, params);
  }

  async countInventory({ search, categoryId }) {
    const params = [];
    const whereClauses = ["p.status = 'ACTIVE'"];

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      whereClauses.push('p.category_id = ?');
      params.push(categoryId);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const sql = `
      SELECT COUNT(p.id) AS total
      FROM products p
      ${whereSql}
    `;
    const rows = await query(sql, params);
    return Number(rows[0]?.total) || 0;
  }

  async getLowStockProducts() {
    const sql = `
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        c.name AS category_name,
        s.name AS supplier_name,
        s.lead_time_days AS supplier_lead_time_days,
        i.current_stock,
        i.reserved_stock,
        (i.current_stock - i.reserved_stock) AS available_stock,
        p.reorder_point,
        p.reorder_quantity
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN inventory i ON p.id = i.product_id
      WHERE p.status = 'ACTIVE' AND (i.current_stock - i.reserved_stock) <= p.reorder_point
      ORDER BY (i.current_stock - i.reserved_stock) ASC
    `;
    return await query(sql);
  }

  async getStockoutRisks() {
    // Calculates sales velocity over the latest 14-day window in the database
    const sql = `
      WITH max_date AS (
        SELECT COALESCE(MAX(order_date), NOW()) AS max_order_date FROM orders
      ),
      recent_sales AS (
        SELECT 
          oi.product_id,
          COALESCE(SUM(oi.quantity), 0) AS units_sold_last_14_days,
          ROUND(COALESCE(SUM(oi.quantity), 0) / 14.0, 2) AS avg_daily_velocity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        CROSS JOIN max_date md
        WHERE o.order_date >= DATE_SUB(md.max_order_date, INTERVAL 14 DAY)
          AND o.status != 'CANCELLED'
        GROUP BY oi.product_id
      )
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        c.name AS category_name,
        s.id AS supplier_id,
        s.name AS supplier_name,
        s.lead_time_days AS supplier_lead_time_days,
        p.cost_price,
        p.selling_price,
        i.current_stock,
        i.reserved_stock,
        i.incoming_stock,
        (i.current_stock - i.reserved_stock) AS available_stock,
        p.reorder_point,
        p.reorder_quantity,
        COALESCE(rs.avg_daily_velocity, 0) AS avg_daily_velocity,
        CASE 
          WHEN COALESCE(rs.avg_daily_velocity, 0) = 0 THEN 999.0
          ELSE ROUND((i.current_stock - i.reserved_stock) / rs.avg_daily_velocity, 1)
        END AS days_of_inventory_remaining,
        CASE 
          WHEN (i.current_stock - i.reserved_stock) <= 0 THEN 'OUT_OF_STOCK'
          WHEN (i.current_stock - i.reserved_stock) / NULLIF(rs.avg_daily_velocity, 0) <= s.lead_time_days THEN 'CRITICAL_STOCKOUT_RISK'
          WHEN (i.current_stock - i.reserved_stock) <= p.reorder_point THEN 'REORDER_REQUIRED'
          ELSE 'HEALTHY'
        END AS stock_risk_status
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN inventory i ON p.id = i.product_id
      LEFT JOIN recent_sales rs ON p.id = rs.product_id
      WHERE p.status = 'ACTIVE'
      ORDER BY days_of_inventory_remaining ASC
    `;
    return await query(sql);
  }

  async getInventoryHealthSummary() {
    const risks = await this.getStockoutRisks();
    let healthyCount = 0;
    let lowStockCount = 0;
    let criticalRiskCount = 0;
    let outOfStockCount = 0;
    let totalStockValuation = 0;

    for (const r of risks) {
      totalStockValuation += (Number(r.current_stock) * Number(r.cost_price));
      if (r.stock_risk_status === 'OUT_OF_STOCK') outOfStockCount++;
      else if (r.stock_risk_status === 'CRITICAL_STOCKOUT_RISK') criticalRiskCount++;
      else if (r.stock_risk_status === 'REORDER_REQUIRED') lowStockCount++;
      else healthyCount++;
    }

    return {
      totalProducts: risks.length,
      healthyCount,
      lowStockCount,
      criticalRiskCount,
      outOfStockCount,
      totalStockValuation: Number(totalStockValuation.toFixed(2))
    };
  }
}

module.exports = new InventoryRepository();
