/**
 * MITRA AI — Root Cause Diagnostic Rules
 */

module.exports = {
  DIAGNOSTIC_PATTERNS: {
    PAYMENT_GATEWAY_TIMEOUT: {
      cause: 'BANK_TIMEOUT_GATEWAY_OUTAGE',
      description: 'Upstream banking gateway timeout error spike on primary payment rail',
      appliesTo: ['PAYMENT_FAILURE_SPIKE', 'PAYMENT_FAILURE_INCIDENT', 'PAYMENT_FAILURE_REASON_ANOMALY'],
      evidenceRules: [
        'Payment failure rate surged > 2.0x above historical 8% baseline',
        'BANK_TIMEOUT accounts for > 50% of all dropped transactions',
        'Failures concentrated during peak checkout hours'
      ]
    },
    REGIONAL_DELIVERY_SLA_BREACH: {
      cause: 'COURIER_TRANSIT_DELAYS',
      description: 'Courier hub transit bottleneck causing SLA delivery delays and customer return spikes',
      appliesTo: ['REGIONAL_DELIVERY_BOTTLENECK', 'REGIONAL_REFUND_ANOMALY'],
      evidenceRules: [
        'Carrier transit delivery delay rate exceeds 12% in specific regional hub',
        'Average delivery delay exceeds 4+ days past promised SLA',
        'DELIVERY_DELAY accounts for majority of regional refund claims'
      ]
    },
    SUPPLIER_BATCH_QUALITY_DEFECT: {
      cause: 'SUPPLIER_BATCH_DEFECT',
      description: 'Component or manufacturing defect in specific product batch from supplier',
      appliesTo: ['PRODUCT_REFUND_ANOMALY'],
      evidenceRules: [
        'Product return rate surged > 12% against normal 2-3% baseline',
        'DAMAGED_PRODUCT or DEFECT accounts for majority of return reasons',
        'Returns are isolated to single supplier production lot'
      ]
    },
    DEMAND_SURGE_SUPPLY_DEFICIT: {
      cause: 'DEMAND_SURGE_LEAD_TIME_DEFICIT',
      description: 'Sudden demand velocity surge depleting stock faster than supplier replenishment lead time',
      appliesTo: ['STOCKOUT_RISK', 'DEMAND_SURGE'],
      evidenceRules: [
        'Recent daily sales velocity surged > 1.8x above historical 90-day baseline',
        'Days of inventory remaining is strictly less than supplier reorder lead time',
        'Safety stock depleted to near-zero levels'
      ]
    }
  }
};
