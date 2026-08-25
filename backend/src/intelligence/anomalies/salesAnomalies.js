/**
 * MITRA AI — Sales & Demand Anomaly Detector
 */

const { query } = require('../../config/db');
const { ANOMALY_THRESHOLDS } = require('../config/intelligenceConfig');

class SalesAnomalies {
  async detectSalesAnomalies() {
    const anomalies = [];

    // 1. Demand Surge per Product (compares 5d velocity vs 90d baseline)
    const demandSql = `
      WITH max_date AS (
        SELECT COALESCE(MAX(order_date), NOW()) AS max_date FROM orders
      ),
      recent_velocity AS (
        SELECT 
          oi.product_id,
          COALESCE(SUM(oi.quantity), 0) AS units_last_5_days,
          ROUND(COALESCE(SUM(oi.quantity), 0) / 5.0, 2) AS recent_daily_velocity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        CROSS JOIN max_date md
        WHERE o.order_date >= DATE_SUB(md.max_date, INTERVAL 5 DAY) AND o.status != 'CANCELLED'
        GROUP BY oi.product_id
      ),
      historical_velocity AS (
        SELECT 
          oi.product_id,
          COALESCE(SUM(oi.quantity), 0) AS total_units_90_days,
          ROUND(COALESCE(SUM(oi.quantity), 0) / 90.0, 2) AS historical_daily_velocity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'CANCELLED'
        GROUP BY oi.product_id
      )
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        c.name AS category_name,
        s.lead_time_days AS supplier_lead_time_days,
        (i.current_stock - i.reserved_stock) AS available_stock,
        rv.recent_daily_velocity,
        hv.historical_daily_velocity,
        ROUND((rv.recent_daily_velocity / NULLIF(hv.historical_daily_velocity, 0)), 2) AS velocity_multiplier,
        ROUND(((rv.recent_daily_velocity - hv.historical_daily_velocity) / NULLIF(hv.historical_daily_velocity, 0)) * 100, 1) AS surge_percentage,
        ROUND((i.current_stock - i.reserved_stock) / NULLIF(rv.recent_daily_velocity, 0), 1) AS days_to_stockout_at_surged_rate
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN inventory i ON p.id = i.product_id
      JOIN recent_velocity rv ON p.id = rv.product_id
      JOIN historical_velocity hv ON p.id = hv.product_id
      WHERE rv.recent_daily_velocity >= (hv.historical_daily_velocity * ?)
      ORDER BY surge_percentage DESC
    `;

    const thresholdMultiplier = ANOMALY_THRESHOLDS.DEMAND_SURGE.CRITICAL_MULTIPLIER;
    const surgedProducts = await query(demandSql, [thresholdMultiplier]);

    if (surgedProducts.length > 0) {
      anomalies.push({
        type: 'DEMAND_SURGE',
        domain: 'SALES',
        title: 'Sudden Product Demand Surge Detected',
        severity: 'HIGH',
        surgedProductsCount: surgedProducts.length,
        products: surgedProducts.map(p => ({
          productId: p.product_id,
          sku: p.sku,
          productName: p.product_name,
          categoryName: p.category_name,
          availableStock: Number(p.available_stock),
          historicalVelocity: Number(p.historical_daily_velocity),
          surgedVelocity: Number(p.recent_daily_velocity),
          velocityMultiplier: Number(p.velocity_multiplier),
          surgePercentage: Number(p.surge_percentage),
          daysToStockout: Number(p.days_to_stockout_at_surged_rate),
          supplierLeadTimeDays: Number(p.supplier_lead_time_days)
        })),
        evidence: `${surgedProducts.length} products experienced sudden demand spikes > 1.8x over their historical 90-day baseline.`
      });
    }

    return anomalies;
  }
}

module.exports = new SalesAnomalies();
