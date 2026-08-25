/**
 * MITRA AI — System Constants, Detection Thresholds & Query Allow-Lists
 */

module.exports = {
  DOMAINS: {
    SALES: 'SALES',
    PAYMENTS: 'PAYMENTS',
    INVENTORY: 'INVENTORY',
    DELIVERY: 'DELIVERY',
    REFUNDS: 'REFUNDS',
    CUSTOMERS: 'CUSTOMERS',
    SUPPLIERS: 'SUPPLIERS',
    CROSS_DOMAIN: 'CROSS_DOMAIN'
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  ALLOWED_SORT_FIELDS: {
    PAYMENTS: ['initiated_at', 'amount', 'status', 'failure_reason'],
    ORDERS: ['order_date', 'total_amount', 'status', 'delivery_status', 'shipping_city'],
    PRODUCTS: ['selling_price', 'cost_price', 'name', 'sku', 'created_at'],
    CUSTOMERS: ['total_spend', 'total_orders_count', 'last_order_date', 'created_at'],
    REFUNDS: ['created_at', 'amount', 'reason_code', 'status'],
    INVENTORY: ['current_stock', 'reserved_stock', 'incoming_stock', 'updated_at']
  },

  // Deterministic Anomaly Detection Thresholds
  DETECTION_THRESHOLDS: {
    // Payment failure rate spike multiplier compared to baseline
    PAYMENT_FAILURE_SPIKE_MULTIPLIER: 2.0, // e.g. 8% baseline -> > 16% is an anomaly
    PAYMENT_BASELINE_FAILURE_RATE: 0.08,  // 8.0%

    // Refund rate thresholds
    REFUND_RATE_ANOMALY_PCT: 10.0,       // > 10% refund rate in cohort/city is anomalous
    REFUND_BASELINE_RATE: 0.035,         // 3.5%

    // Demand surge threshold (recent vs historical daily sales)
    DEMAND_SURGE_MULTIPLIER: 1.8,        // 80%+ increase in daily velocity

    // Regional logistics delay rate threshold
    REGIONAL_DELAY_RATE_ANOMALY_PCT: 12.0, // > 12% delay rate in city

    // Customer churn inactivity days
    LOYAL_CUSTOMER_INACTIVITY_DAYS: 25,
    CUSTOMER_CONSECUTIVE_PAYMENT_FAILURES: 2
  },

  INVENTORY_STATUS: {
    HEALTHY: 'HEALTHY',
    LOW: 'LOW',
    CRITICAL: 'CRITICAL',
    OUT_OF_STOCK: 'OUT_OF_STOCK'
  }
};
