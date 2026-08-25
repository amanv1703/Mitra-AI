/**
 * MITRA AI — Customer Metrics Engine
 */

const { query } = require('../../config/db');

class CustomerMetrics {
  async calculateCustomerMetrics() {
    const sql = `
      SELECT 
        COUNT(id) AS total_customers,
        SUM(CASE WHEN segment = 'LOYAL' THEN 1 ELSE 0 END) AS loyal_count,
        SUM(CASE WHEN segment = 'REGULAR' THEN 1 ELSE 0 END) AS regular_count,
        SUM(CASE WHEN segment = 'OCCASIONAL' THEN 1 ELSE 0 END) AS occasional_count,
        COALESCE(SUM(total_spend), 0) AS total_historical_ltv,
        COALESCE(AVG(total_spend), 0) AS avg_ltv
      FROM customers
    `;
    const rows = await query(sql);
    const res = rows[0] || {};

    return {
      totalCustomers: Number(res.total_customers) || 0,
      loyalCount: Number(res.loyal_count) || 0,
      regularCount: Number(res.regular_count) || 0,
      occasionalCount: Number(res.occasional_count) || 0,
      totalLtv: Number(res.total_historical_ltv) || 0,
      avgLtv: Number(res.avg_ltv) || 0
    };
  }

  async getBehavioralRiskCohorts() {
    const sql = `
      WITH max_date AS (
        SELECT COALESCE(MAX(order_date), NOW()) AS ref_date FROM orders
      )
      SELECT 
        c.id AS customer_id,
        c.customer_code,
        CONCAT(c.first_name, ' ', c.last_name) AS name,
        c.email,
        c.city,
        c.segment,
        c.total_orders_count,
        c.total_spend,
        c.last_order_date,
        DATEDIFF(md.ref_date, c.last_order_date) AS days_since_last_order,
        COUNT(CASE WHEN p.status = 'FAILED' AND p.initiated_at >= DATE_SUB(md.ref_date, INTERVAL 30 DAY) THEN 1 END) AS recent_payment_failures
      FROM customers c
      CROSS JOIN max_date md
      LEFT JOIN payments p ON c.id = p.customer_id
      GROUP BY c.id, c.customer_code, c.first_name, c.last_name, c.email, c.city, c.segment, c.total_orders_count, c.total_spend, c.last_order_date, md.ref_date
      HAVING (days_since_last_order >= 25 AND recent_payment_failures >= 2) OR (days_since_last_order >= 45)
      ORDER BY c.total_spend DESC
    `;
    const rows = await query(sql);
    return rows.map(r => {
      let riskScore = 20;
      const days = Number(r.days_since_last_order);
      const failures = Number(r.recent_payment_failures);

      // Scoring factors
      if (days >= 45) riskScore += 35;
      else if (days >= 25) riskScore += 20;

      if (failures >= 3) riskScore += 45;
      else if (failures >= 2) riskScore += 30;
      else if (failures === 1) riskScore += 10;

      if (r.segment === 'LOYAL') riskScore += 10;

      riskScore = Math.min(100, Math.max(0, riskScore));

      return {
        customerId: r.customer_id,
        customerCode: r.customer_code,
        name: r.name,
        email: r.email,
        city: r.city,
        segment: r.segment,
        totalOrders: Number(r.total_orders_count),
        totalSpend: Number(r.total_spend),
        lastOrderDate: r.last_order_date,
        daysSinceLastOrder: days,
        recentPaymentFailures: failures,
        behavioralRiskScore: riskScore,
        riskLevel: riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : 'MEDIUM'
      };
    });
  }
}

module.exports = new CustomerMetrics();
