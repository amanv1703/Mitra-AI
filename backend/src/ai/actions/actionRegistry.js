/**
 * MITRA AI — Action Registry & Governance Definitions
 */

module.exports = {
  ACTIONS: {
    CREATE_PURCHASE_ORDER: {
      type: 'CREATE_PURCHASE_ORDER',
      name: 'Expedited Supplier Purchase Order',
      riskTier: 'MEDIUM',
      requiresApproval: true,
      description: 'Generates a replenishment purchase order with expedited freight to mitigate lead-time stockout shortfall.',
      defaultParameters: {
        sku: 'SKU-FIT-105',
        quantity: 200,
        supplierName: 'Coimbatore Precision Gear',
        priority: 'EXPEDITED'
      }
    },
    REROUTE_PAYMENT_GATEWAY: {
      type: 'REROUTE_PAYMENT_GATEWAY',
      name: 'Payment Acquirer Failover Reroute',
      riskTier: 'HIGH',
      requiresApproval: true,
      description: 'Temporarily reroutes netbanking checkout transactions to secondary acquirer rail during primary bank outage.',
      defaultParameters: {
        primaryRail: 'HDFC_NETBANKING',
        fallbackRail: 'UPI_AND_CARDS_DEFAULT',
        durationHours: 24
      }
    },
    ISSUE_CUSTOMER_CREDIT: {
      type: 'ISSUE_CUSTOMER_CREDIT',
      name: 'VIP Checkout Recovery Campaign',
      riskTier: 'MEDIUM',
      requiresApproval: true,
      description: 'Dispatches personalized apologies with 5% discount credits to VIP buyers who suffered checkout payment drops.',
      defaultParameters: {
        targetCohort: 'VIP_FRICTION_CHURN',
        discountPct: 5.0,
        expiryDays: 7
      }
    },
    PAUSE_PRODUCT_SALES: {
      type: 'PAUSE_PRODUCT_SALES',
      name: 'Pause Defective Lot Sales & File Warranty Claim',
      riskTier: 'HIGH',
      requiresApproval: true,
      description: 'Halts storefront fulfillment of defective supplier batch and generates supplier warranty debit note.',
      defaultParameters: {
        sku: 'SKU-ELEC-104',
        supplierName: 'Noida Tech Components',
        claimAmountInr: 110000.0
      }
    },
    MARK_INSIGHT_REVIEWED: {
      type: 'MARK_INSIGHT_REVIEWED',
      name: 'Acknowledge & Mark Insight Reviewed',
      riskTier: 'LOW',
      requiresApproval: false,
      description: 'Marks an intelligence anomaly as reviewed and monitored by merchant.',
      defaultParameters: {}
    }
  }
};
