/**
 * MITRA AI — Product Repository
 * Database access for product catalog, performance, margins, and supplier links
 */

const { query } = require('../config/db');

class ProductRepository {
  async findProducts({ limit, offset, categoryId, search, sortBy = 'selling_price', sortOrder = 'DESC' }) {
    const params = [];
    const whereClauses = ['p.status = "ACTIVE"'];

    if (categoryId) {
      whereClauses.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    
    const validSortFields = ['selling_price', 'cost_price', 'name', 'sku', 'created_at'];
    const safeSort = validSortFields.includes(sortBy) ? sortBy : 'selling_price';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.cost_price,
        p.selling_price,
        p.reorder_point,
        p.reorder_quantity,
        p.safety_stock,
        p.lead_time_days,
        p.status,
        c.name AS category_name,
        s.name AS supplier_name,
        i.current_stock,
        i.reserved_stock,
        (i.current_stock - i.reserved_stock) AS available_stock
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ${whereSql}
      ORDER BY p.${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    return await query(sql, params);
  }

  async countProducts({ categoryId, search }) {
    const params = [];
    const whereClauses = ['status = "ACTIVE"'];

    if (categoryId) {
      whereClauses.push('category_id = ?');
      params.push(categoryId);
    }
    if (search) {
      whereClauses.push('(name LIKE ? OR sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const sql = `SELECT COUNT(id) AS total FROM products ${whereSql}`;
    const rows = await query(sql, params);
    return Number(rows[0]?.total) || 0;
  }

  async findById(productId) {
    const sql = `
      SELECT 
        p.*,
        c.name AS category_name,
        s.name AS supplier_name,
        s.city AS supplier_city,
        s.lead_time_days AS supplier_lead_time_days,
        s.reliability_score AS supplier_reliability_score,
        i.current_stock,
        i.reserved_stock,
        i.incoming_stock,
        (i.current_stock - i.reserved_stock) AS available_stock,
        i.warehouse_location
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ?
    `;
    const rows = await query(sql, [productId]);
    if (rows.length === 0) return null;
    const product = rows[0];

    // Sales volume & revenue
    const salesSql = `
      SELECT 
        COALESCE(SUM(quantity), 0) AS total_units_sold,
        COALESCE(SUM(total_price), 0) AS gross_sales_revenue,
        COUNT(DISTINCT order_id) AS order_count
      FROM order_items
      WHERE product_id = ?
    `;
    const sales = (await query(salesSql, [productId]))[0] || {};

    // Refund stats
    const refundSql = `
      SELECT 
        COUNT(DISTINCT r.id) AS total_refund_count,
        COALESCE(SUM(r.amount), 0) AS total_refunded_amount
      FROM order_items oi
      JOIN refunds r ON oi.order_id = r.order_id
      WHERE oi.product_id = ?
    `;
    const refund = (await query(refundSql, [productId]))[0] || {};

    const totalSold = Number(sales.total_units_sold) || 0;
    const totalRefunds = Number(refund.total_refund_count) || 0;
    const refundRatePct = totalSold > 0 ? Number(((totalRefunds / totalSold) * 100).toFixed(2)) : 0;

    return {
      ...product,
      analytics: {
        unitsSold: totalSold,
        grossRevenue: Number(sales.gross_sales_revenue) || 0,
        orderCount: Number(sales.order_count) || 0,
        refundCount: totalRefunds,
        refundAmount: Number(refund.total_refunded_amount) || 0,
        refundRatePct
      }
    };
  }

  async getPerformanceList({ limit = 50, sortBy = 'revenue', sortOrder = 'DESC' }) {
    const sortColumnMap = {
      revenue: 'gross_revenue',
      units: 'total_units_sold',
      refundRate: 'refund_rate_pct',
      stockoutRisk: 'days_of_inventory_remaining'
    };

    const safeSort = sortColumnMap[sortBy] || 'gross_revenue';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      WITH product_sales AS (
        SELECT 
          oi.product_id,
          COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
          COALESCE(SUM(oi.total_price), 0) AS gross_revenue,
          ROUND(COALESCE(SUM(oi.quantity), 0) / 90.0, 2) AS avg_daily_demand
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'CANCELLED'
        GROUP BY oi.product_id
      ),
      product_refunds AS (
        SELECT 
          oi.product_id,
          COUNT(DISTINCT r.id) AS total_refunds
        FROM order_items oi
        JOIN refunds r ON oi.order_id = r.order_id
        GROUP BY oi.product_id
      )
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        c.name AS category_name,
        s.name AS supplier_name,
        p.cost_price,
        p.selling_price,
        (p.selling_price - p.cost_price) AS unit_margin,
        ROUND(((p.selling_price - p.cost_price) / p.selling_price) * 100, 2) AS margin_pct,
        COALESCE(ps.total_units_sold, 0) AS total_units_sold,
        COALESCE(ps.gross_revenue, 0) AS gross_revenue,
        COALESCE(ps.avg_daily_demand, 0) AS avg_daily_demand,
        COALESCE(pr.total_refunds, 0) AS total_refunds,
        ROUND((COALESCE(pr.total_refunds, 0) / NULLIF(COALESCE(ps.total_units_sold, 0), 0)) * 100, 2) AS refund_rate_pct,
        i.current_stock,
        (i.current_stock - i.reserved_stock) AS available_stock,
        CASE 
          WHEN COALESCE(ps.avg_daily_demand, 0) = 0 THEN 999.0
          ELSE ROUND((i.current_stock - i.reserved_stock) / ps.avg_daily_demand, 1)
        END AS days_of_inventory_remaining
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_sales ps ON p.id = ps.product_id
      LEFT JOIN product_refunds pr ON p.id = pr.product_id
      WHERE p.status = 'ACTIVE'
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }
}

module.exports = new ProductRepository();
