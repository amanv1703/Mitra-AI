/**
 * MITRA AI — Deterministic Anomaly Detection Engine
 * 
 * Implements rule-based, explainable statistical anomaly detectors across 5 business vectors:
 * 1. Payment Failure Rate Spike
 * 2. Refund / Return Surge
 * 3. Inventory Stockout Risk
 * 4. Demand Surge
 * 5. Regional Logistics Delay Bottleneck
 * 
 * Every detector outputs structured evidence, baseline deltas, and affected financial impact.
 */

const { query } = require('../config/db');
const { DETECTION_THRESHOLDS } = require('../config/constants');
const inventoryRepository = require('../repositories/inventoryRepository');
const analyticsRepository = require('../repositories/analyticsRepository');

class DetectionService {
  /**
   * Detector 1: Payment Failure Spike
   */
  async detectPaymentFailureSpike() {
    // Look at daily payment failure rates across the full dataset window
    const sql = `
      SELECT 
        DATE(initiated_at) AS date,
        COUNT(id) AS total_attempts,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_attempts,
        ROUND((SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) / COUNT(id)) * 100, 2) AS failure_rate_pct,
        COALESCE(SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END), 0) AS failed_amount,
        SUM(CASE WHEN failure_reason = 'BANK_TIMEOUT' THEN 1 ELSE 0 END) AS bank_timeout_count
      FROM payments
      GROUP BY DATE(initiated_at)
      HAVING failure_rate_pct >= ?
      ORDER BY failure_rate_pct DESC
    `;

    const thresholdPct = DETECTION_THRESHOLDS.PAYMENT_BASELINE_FAILURE_RATE * DETECTION_THRESHOLDS.PAYMENT_FAILURE_SPIKE_MULTIPLIER * 100;
    const spikeDays = await query(sql, [thresholdPct]);

    if (spikeDays.length === 0) {
      return {
        type: 'PAYMENT_FAILURE_SPIKE',
        detected: false,
        baselineRatePct: DETECTION_THRESHOLDS.PAYMENT_BASELINE_FAILURE_RATE * 100,
        thresholdRatePct: thresholdPct,
        evidence: []
      };
    }

    const totalSpikeFailedAttempts = spikeDays.reduce((sum, d) => sum + Number(d.failed_attempts), 0);
    const totalSpikeFailedAmount = spikeDays.reduce((sum, d) => sum + Number(d.failed_amount), 0);
    const totalBankTimeouts = spikeDays.reduce((sum, d) => sum + Number(d.bank_timeout_count), 0);
    const peakFailureRate = Math.max(...spikeDays.map(d => Number(d.failure_rate_pct)));

    return {
      type: 'PAYMENT_FAILURE_SPIKE',
      detected: true,
      severity: 'HIGH',
      domain: 'PAYMENTS',
      title: 'Payment Gateway Failure Rate Spike Detected',
      baselineRatePct: DETECTION_THRESHOLDS.PAYMENT_BASELINE_FAILURE_RATE * 100,
      peakFailureRatePct: peakFailureRate,
      changeMultiplier: Number((peakFailureRate / (DETECTION_THRESHOLDS.PAYMENT_BASELINE_FAILURE_RATE * 100)).toFixed(2)),
      affectedRevenueInSpike: Number(totalSpikeFailedAmount.toFixed(2)),
      affectedFailedAttempts: totalSpikeFailedAttempts,
      primaryReason: totalBankTimeouts / totalSpikeFailedAttempts > 0.5 ? 'BANK_TIMEOUT' : 'MULTIPLE_ERRORS',
      spikeDates: spikeDays.map(d => ({
        date: d.date,
        failureRatePct: Number(d.failure_rate_pct),
        failedAttempts: Number(d.failed_attempts),
        lostVolume: Number(d.failed_amount),
        bankTimeouts: Number(d.bank_timeout_count)
      })),
      explanation: `Payment failure rate surged from a historical baseline of 7.8% up to a peak of ${peakFailureRate}%, predominantly driven by BANK_TIMEOUT errors resulting in ₹${Math.round(totalSpikeFailedAmount).toLocaleString('en-IN')} in dropped checkouts.`
    };
  }

  /**
   * Detector 2: Refund Surge by Product or City
   */
  async detectRefundSpike() {
    // 2.1 Regional Refund Anomalies
    const regionalSql = `
      SELECT 
        o.shipping_city AS city,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT r.id) AS refund_count,
        COALESCE(SUM(r.amount), 0) AS total_refund_amount,
        ROUND((COUNT(DISTINCT r.id) / COUNT(DISTINCT o.id)) * 100, 2) AS refund_rate_pct,
        SUM(CASE WHEN r.reason_code = 'DELIVERY_DELAY' THEN 1 ELSE 0 END) AS delivery_delay_refunds
      FROM orders o
      LEFT JOIN refunds r ON o.id = r.order_id
      WHERE o.status != 'CANCELLED'
      GROUP BY o.shipping_city
      HAVING refund_rate_pct >= ?
      ORDER BY refund_rate_pct DESC
    `;

    // 2.2 Product-specific Refund Anomalies
    const productSql = `
      SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        s.name AS supplier_name,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COUNT(DISTINCT r.id) AS refund_count,
        COALESCE(SUM(r.amount), 0) AS total_refunded_amount,
        ROUND((COUNT(DISTINCT r.id) / NULLIF(COUNT(DISTINCT oi.order_id), 0)) * 100, 2) AS refund_rate_pct,
        SUM(CASE WHEN r.reason_code = 'DAMAGED_PRODUCT' THEN 1 ELSE 0 END) AS damaged_product_refunds
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN refunds r ON oi.order_id = r.order_id
      GROUP BY p.id, p.sku, p.name, s.name
      HAVING refund_rate_pct >= ?
      ORDER BY refund_rate_pct DESC
    `;

    const threshold = DETECTION_THRESHOLDS.REFUND_RATE_ANOMALY_PCT;
    const [regionalAnomalies, productAnomalies] = await Promise.all([
      query(regionalSql, [threshold]),
      query(productSql, [threshold])
    ]);

    const detected = regionalAnomalies.length > 0 || productAnomalies.length > 0;

    return {
      type: 'REFUND_SURGE',
      detected,
      severity: 'HIGH',
      domain: 'REFUNDS',
      title: 'Abnormal Return / Refund Spikes Detected',
      baselineRefundRatePct: DETECTION_THRESHOLDS.REFUND_BASELINE_RATE * 100,
      thresholdPct: threshold,
      regionalSpikes: regionalAnomalies.map(r => ({
        city: r.city,
        totalOrders: Number(r.total_orders),
        refundCount: Number(r.refund_count),
        refundAmount: Number(r.total_refund_amount),
        refundRatePct: Number(r.refund_rate_pct),
        deliveryDelayRatio: Number(((Number(r.delivery_delay_refunds) / Number(r.refund_count)) * 100).toFixed(1))
      })),
      productSpikes: productAnomalies.map(p => ({
        productId: p.product_id,
        sku: p.sku,
        productName: p.product_name,
        supplierName: p.supplier_name,
        unitsSold: Number(p.units_sold),
        refundCount: Number(p.refund_count),
        refundAmount: Number(p.total_refunded_amount),
        refundRatePct: Number(p.refund_rate_pct),
        damagedRatio: Number(((Number(p.damaged_product_refunds) / Number(p.refund_count)) * 100).toFixed(1))
      }))
    };
  }

  /**
   * Detector 3: Inventory Stockout Risk
   */
  async detectStockoutRisk() {
    const risks = await inventoryRepository.getStockoutRisks();
    const criticalRisks = risks.filter(r => 
      r.stock_risk_status === 'OUT_OF_STOCK' || 
      r.stock_risk_status === 'CRITICAL_STOCKOUT_RISK' ||
      Number(r.days_of_inventory_remaining) <= Number(r.supplier_lead_time_days)
    );

    let projectedLossTotal = 0;
    const formattedRisks = criticalRisks.map(r => {
      const dailyRevenue = (Number(r.avg_daily_velocity) || 0) * Number(r.selling_price);
      const shortfallDays = Math.max(0, Number(r.supplier_lead_time_days) - Number(r.days_of_inventory_remaining));
      const projectedLoss = dailyRevenue * shortfallDays;
      projectedLossTotal += projectedLoss;

      return {
        productId: r.product_id,
        sku: r.sku,
        productName: r.product_name,
        categoryName: r.category_name,
        supplierName: r.supplier_name,
        supplierLeadTimeDays: Number(r.supplier_lead_time_days),
        availableStock: Number(r.available_stock),
        avgDailyVelocity: Number(r.avg_daily_velocity),
        daysOfInventoryRemaining: Number(r.days_of_inventory_remaining),
        stockRiskStatus: r.stock_risk_status,
        leadTimeGapDays: Number(shortfallDays.toFixed(1)),
        projectedLostRevenue: Number(projectedLoss.toFixed(2))
      };
    });

    return {
      type: 'STOCKOUT_RISK',
      detected: criticalRisks.length > 0,
      severity: 'CRITICAL',
      domain: 'INVENTORY',
      title: 'Impending Stockout & Supply Chain Shortfall Risk',
      criticalProductCount: criticalRisks.length,
      totalProjectedLostRevenue: Number(projectedLossTotal.toFixed(2)),
      affectedProducts: formattedRisks
    };
  }

  /**
   * Detector 4: Demand Surge
   */
  async detectDemandSurge() {
    // Compares 5-day velocity vs historical 90-day velocity per product
    const sql = `
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

    const multiplier = DETECTION_THRESHOLDS.DEMAND_SURGE_MULTIPLIER;
    const surgedProducts = await query(sql, [multiplier]);

    return {
      type: 'DEMAND_SURGE',
      detected: surgedProducts.length > 0,
      severity: 'HIGH',
      domain: 'INVENTORY',
      title: 'Sudden Product Demand Surge Detected',
      thresholdMultiplier: multiplier,
      surgedProductsCount: surgedProducts.length,
      products: surgedProducts.map(p => ({
        productId: p.product_id,
        sku: p.sku,
        productName: p.product_name,
        categoryName: p.category_name,
        availableStock: Number(p.available_stock),
        historicalDailyVelocity: Number(p.historical_daily_velocity),
        surgedDailyVelocity: Number(p.recent_daily_velocity),
        surgePercentage: Number(p.surge_percentage),
        daysToStockoutAtSurgedRate: Number(p.days_to_stockout_at_surged_rate),
        supplierLeadTimeDays: Number(p.supplier_lead_time_days),
        isImminentRunout: Number(p.days_to_stockout_at_surged_rate) < Number(p.supplier_lead_time_days)
      }))
    };
  }

  /**
   * Detector 5: Regional Delivery Delay Bottlenecks
   */
  async detectRegionalDeliveryProblems() {
    const cityPerformance = await analyticsRepository.getDeliveryPerformanceByCity(
      '2000-01-01 00:00:00',
      '2099-12-31 23:59:59'
    );

    const threshold = DETECTION_THRESHOLDS.REGIONAL_DELAY_RATE_ANOMALY_PCT;
    const bottleneckCities = cityPerformance.filter(c => c.delayedRatePct >= threshold);

    return {
      type: 'REGIONAL_DELIVERY_BOTTLENECK',
      detected: bottleneckCities.length > 0,
      severity: 'HIGH',
      domain: 'DELIVERY',
      title: 'Regional Logistics Carrier SLA Bottlenecks',
      thresholdDelayRatePct: threshold,
      bottleneckCount: bottleneckCities.length,
      affectedCities: bottleneckCities.map(c => ({
        city: c.city,
        state: c.state,
        totalOrders: c.totalOrders,
        delayedOrders: c.delayedCount,
        delayedRatePct: c.delayedRatePct,
        avgDelayDays: c.avgDelayDays
      }))
    };
  }

  /**
   * Aggregate all 5 detectors into a unified diagnostic report
   */
  async getAllDetections() {
    const [paymentSpike, refundSpike, stockoutRisk, demandSurge, regionalDelays] = await Promise.all([
      this.detectPaymentFailureSpike(),
      this.detectRefundSpike(),
      this.detectStockoutRisk(),
      this.detectDemandSurge(),
      this.detectRegionalDeliveryProblems()
    ]);

    const detections = [
      paymentSpike,
      refundSpike,
      stockoutRisk,
      demandSurge,
      regionalDelays
    ];

    const activeAnomalies = detections.filter(d => d.detected);

    return {
      timestamp: new Date().toISOString(),
      totalDetectorsEvaluated: detections.length,
      activeAnomaliesCount: activeAnomalies.length,
      detections
    };
  }
}

module.exports = new DetectionService();
