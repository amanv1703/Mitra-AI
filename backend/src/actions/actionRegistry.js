/**
 * MITRA AI — Master Action Registry & Governance Catalog
 * 
 * Defines all bounded business actions, risk tiers, schema contracts, reversibility, and default safety limits.
 */

const ACTION_TYPES = {
  CREATE_RESTOCK_RECOMMENDATION: 'CREATE_RESTOCK_RECOMMENDATION',
  CREATE_BUSINESS_REPORT: 'CREATE_BUSINESS_REPORT',
  CREATE_NOTIFICATION_DRAFT: 'CREATE_NOTIFICATION_DRAFT',
  MARK_INSIGHT_REVIEWED: 'MARK_INSIGHT_REVIEWED',
  DISMISS_INSIGHT: 'DISMISS_INSIGHT',
  MODIFY_INVENTORY: 'MODIFY_INVENTORY',
  REROUTE_PAYMENT_GATEWAY: 'REROUTE_PAYMENT_GATEWAY',
  REFUND_PAYMENT: 'REFUND_PAYMENT'
};

const RISK_TIERS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const ACTION_DEFINITIONS = {
  [ACTION_TYPES.CREATE_RESTOCK_RECOMMENDATION]: {
    type: ACTION_TYPES.CREATE_RESTOCK_RECOMMENDATION,
    name: 'Draft Restock Recommendation',
    domain: 'INVENTORY',
    defaultRisk: RISK_TIERS.MEDIUM,
    requiresApproval: true,
    reversible: true,
    description: 'Generates an internal restock recommendation draft for warehouse and supplier replenishment without placing live purchase orders.',
    requiredParameters: ['productId', 'recommendedQuantity'],
    optionalParameters: ['supplierName', 'priority', 'unitCost', 'dailyVelocity', 'coverageDaysTarget'],
    targetType: 'PRODUCT',
    impactCalculator: 'calculateRestockImpact'
  },

  [ACTION_TYPES.CREATE_BUSINESS_REPORT]: {
    type: ACTION_TYPES.CREATE_BUSINESS_REPORT,
    name: 'Generate Executive Business Health Report',
    domain: 'ANALYTICS',
    defaultRisk: RISK_TIERS.LOW,
    requiresApproval: false, // Low risk, auto-approved or on-demand
    reversible: true,
    description: 'Synthesizes cross-domain 90-day telemetry into a structured executive report detailing business health, top risks, and financial loss factors.',
    requiredParameters: ['reportType'],
    optionalParameters: ['from', 'to', 'sections'],
    targetType: 'SYSTEM',
    impactCalculator: 'calculateReportScope'
  },

  [ACTION_TYPES.CREATE_NOTIFICATION_DRAFT]: {
    type: ACTION_TYPES.CREATE_NOTIFICATION_DRAFT,
    name: 'Draft Customer or Logistics Notification',
    domain: 'COMMUNICATIONS',
    defaultRisk: RISK_TIERS.MEDIUM,
    requiresApproval: true,
    reversible: true,
    description: 'Creates a draft alert message (e.g. VIP checkout apology, carrier SLA delay escalation) without sending external communications.',
    requiredParameters: ['channel', 'targetAudience', 'messageBody'],
    optionalParameters: ['discountCreditPct', 'templateId', 'priority'],
    targetType: 'NOTIFICATION',
    impactCalculator: 'calculateNotificationAudience'
  },

  [ACTION_TYPES.MARK_INSIGHT_REVIEWED]: {
    type: ACTION_TYPES.MARK_INSIGHT_REVIEWED,
    name: 'Acknowledge & Mark Insight Reviewed',
    domain: 'INSIGHTS',
    defaultRisk: RISK_TIERS.LOW,
    requiresApproval: false,
    reversible: true,
    description: 'Marks an intelligence anomaly as reviewed and monitored by the merchant operator.',
    requiredParameters: ['insightId'],
    optionalParameters: ['notes'],
    targetType: 'INSIGHT',
    impactCalculator: null
  },

  [ACTION_TYPES.DISMISS_INSIGHT]: {
    type: ACTION_TYPES.DISMISS_INSIGHT,
    name: 'Dismiss Anomaly as False Positive / Known',
    domain: 'INSIGHTS',
    defaultRisk: RISK_TIERS.LOW,
    requiresApproval: false,
    reversible: true,
    description: 'Dismisses an anomaly signal with operator reasoning.',
    requiredParameters: ['insightId', 'reason'],
    optionalParameters: [],
    targetType: 'INSIGHT',
    impactCalculator: null
  },

  [ACTION_TYPES.MODIFY_INVENTORY]: {
    type: ACTION_TYPES.MODIFY_INVENTORY,
    name: 'Direct Inventory Stock Adjustment',
    domain: 'INVENTORY',
    defaultRisk: RISK_TIERS.HIGH,
    requiresApproval: true,
    reversible: true,
    description: 'Directly adjusts on-hand available stock level in inventory database with mandatory operator approval.',
    requiredParameters: ['productId', 'quantityDelta', 'reasonCode'],
    optionalParameters: ['warehouseId'],
    targetType: 'INVENTORY',
    impactCalculator: 'calculateInventoryAdjustmentImpact'
  },

  [ACTION_TYPES.REROUTE_PAYMENT_GATEWAY]: {
    type: ACTION_TYPES.REROUTE_PAYMENT_GATEWAY,
    name: 'Payment Acquirer Failover Reroute',
    domain: 'PAYMENTS',
    defaultRisk: RISK_TIERS.HIGH,
    requiresApproval: true,
    reversible: true,
    description: 'Activates secondary payment acquirer rail fallback during gateway downtime.',
    requiredParameters: ['primaryRail', 'fallbackRail'],
    optionalParameters: ['durationHours'],
    targetType: 'PAYMENT_RAIL',
    impactCalculator: 'calculateRoutingRecoveryImpact'
  },

  [ACTION_TYPES.REFUND_PAYMENT]: {
    type: ACTION_TYPES.REFUND_PAYMENT,
    name: 'Process Sandbox Financial Refund',
    domain: 'PAYMENTS',
    defaultRisk: RISK_TIERS.CRITICAL,
    requiresApproval: true,
    reversible: false,
    description: 'Processes a refund transaction in sandbox mock environment with two-step manager confirmation. Real financial bank payouts are disabled in Phase 5.',
    requiredParameters: ['paymentId', 'orderId', 'amount'],
    optionalParameters: ['reasonCode', 'customerNotes'],
    targetType: 'PAYMENT',
    impactCalculator: 'calculateRefundImpact'
  }
};

module.exports = {
  ACTION_TYPES,
  RISK_TIERS,
  ACTION_DEFINITIONS,
  getActionDefinition: (type) => ACTION_DEFINITIONS[type] || null,
  getAllActionDefinitions: () => Object.values(ACTION_DEFINITIONS)
};
