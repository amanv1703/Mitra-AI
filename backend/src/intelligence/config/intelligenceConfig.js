/**
 * MITRA AI — Intelligence Engine Configuration
 * Centralized statistical thresholds, baseline windows, severity bands, and scoring weights
 */

module.exports = {
  // Baseline Evaluation Windows
  BASELINE_WINDOWS: {
    HISTORICAL_DAYS: 90,
    RECENT_SHORT_DAYS: 5,
    RECENT_MEDIUM_DAYS: 14,
    RECENT_LONG_DAYS: 30,
    CORRELATION_WINDOW_DAYS: 7
  },

  // Statistical Anomaly Thresholds (Multipliers over baseline & absolute rates)
  ANOMALY_THRESHOLDS: {
    PAYMENT_FAILURE_RATE: {
      BASELINE: 0.08, // 8% historical baseline
      WARNING_MULTIPLIER: 1.5, // 12%
      CRITICAL_MULTIPLIER: 2.2, // 17.6% (flags 28.5% spike)
      CONCENTRATION_RATIO: 0.50 // >50% of failures sharing single reason code
    },
    REFUND_RATE: {
      BASELINE: 0.045, // 4.5% historical baseline
      WARNING_RATE_PCT: 8.0,
      CRITICAL_RATE_PCT: 12.0, // (flags Bhopal 19.4% & SKU-ELEC-104 24.8%)
      MIN_ORDER_COUNT: 20
    },
    DEMAND_SURGE: {
      WARNING_MULTIPLIER: 1.5, // +50% surge
      CRITICAL_MULTIPLIER: 1.8, // +80% surge (flags SKU-FIT-105 +140%)
      MIN_HISTORICAL_UNITS: 30
    },
    STOCKOUT_RISK: {
      CRITICAL_LEAD_TIME_BUFFER_DAYS: 0, // daysOfStock < leadTime
      WARNING_LEAD_TIME_BUFFER_DAYS: 3 // daysOfStock < leadTime + 3d
    },
    DELIVERY_DELAY: {
      BASELINE_DELAY_RATE: 0.05, // 5% normal delay rate
      WARNING_DELAY_RATE_PCT: 10.0,
      CRITICAL_DELAY_RATE_PCT: 15.0 // (flags Bhopal 19.45%)
    },
    CUSTOMER_CHURN: {
      INACTIVITY_DAYS_THRESHOLD: 25,
      FAILED_CHECKOUT_ATTEMPTS: 2,
      DORMANT_DAYS_THRESHOLD: 45
    }
  },

  // Severity Classification Tiers
  SEVERITY_LEVELS: {
    NORMAL: 'NORMAL',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },

  // Root Cause Scoring Model Weights (Sum = 100)
  ROOT_CAUSE_WEIGHTS: {
    TEMPORAL_PROXIMITY: 25,
    MAGNITUDE_CORRELATION: 25,
    ENTITY_OVERLAP: 25,
    HISTORICAL_CONSISTENCY: 25
  },

  // Business Health Score Component Weights (Sum = 100)
  HEALTH_SCORE_WEIGHTS: {
    SALES_GROWTH: 25,
    PAYMENT_HEALTH: 25,
    INVENTORY_HEALTH: 20,
    REFUND_HEALTH: 15,
    DELIVERY_HEALTH: 15
  },

  // Risk Score Band Boundaries (0 - 100)
  RISK_BANDS: {
    HEALTHY: { min: 0, max: 20, label: 'HEALTHY', color: 'emerald' },
    LOW: { min: 21, max: 40, label: 'LOW', color: 'blue' },
    MODERATE: { min: 41, max: 60, label: 'MODERATE', color: 'amber' },
    HIGH: { min: 61, max: 80, label: 'HIGH', color: 'orange' },
    CRITICAL: { min: 81, max: 100, label: 'CRITICAL', color: 'red' }
  }
};
