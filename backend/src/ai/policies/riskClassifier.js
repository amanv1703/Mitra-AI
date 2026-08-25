/**
 * MITRA AI — Policy Engine & Action Risk Classifier
 * Enforces guardrails and human approval requirements
 */

const { RISK_LEVELS, DEFAULT_SAFETY_LIMITS } = require('../../config/constants');

/**
 * Classifies an action proposal into a risk tier and determines if human approval is mandatory.
 */
function evaluateActionPolicy(actionType, parameters = {}, merchantSettings = {}) {
  const maxRefund = merchantSettings.max_auto_refund_limit || DEFAULT_SAFETY_LIMITS.MAX_AUTO_REFUND_LIMIT;
  const maxReorder = merchantSettings.max_auto_reorder_limit || DEFAULT_SAFETY_LIMITS.MAX_AUTO_REORDER_VALUE;
  const maxPriceAdjPct = merchantSettings.max_auto_price_adjust_pct || DEFAULT_SAFETY_LIMITS.MAX_PRICE_ADJUSTMENT_PCT;

  let riskLevel = RISK_LEVELS.LOW;
  let requiresHumanApproval = false;
  let policyViolation = null;

  switch (actionType) {
    case 'SWITCH_PAYMENT_ROUTING':
    case 'NOTIFY_CARRIER_ISSUE':
    case 'CUSTOMER_RECOVERY_CAMPAIGN':
      riskLevel = RISK_LEVELS.LOW;
      requiresHumanApproval = false;
      break;

    case 'INVENTORY_REORDER':
      const orderValue = (parameters.reorder_units || 0) * (parameters.unit_cost || 0);
      if (orderValue > maxReorder) {
        riskLevel = RISK_LEVELS.HIGH;
        requiresHumanApproval = true;
      } else {
        riskLevel = RISK_LEVELS.MEDIUM;
        requiresHumanApproval = true; // Medium actions by default seek confirmation
      }
      break;

    case 'PRICE_ADJUSTMENT':
      const priceAdjPct = Math.abs(parameters.price_change_pct || 0);
      if (priceAdjPct > maxPriceAdjPct) {
        riskLevel = RISK_LEVELS.HIGH;
        requiresHumanApproval = true;
      } else {
        riskLevel = RISK_LEVELS.HIGH;
        requiresHumanApproval = true;
      }
      break;

    case 'ISSUE_REFUND_CREDIT':
      const refundAmount = parameters.amount || 0;
      if (refundAmount > maxRefund) {
        riskLevel = RISK_LEVELS.HIGH;
        requiresHumanApproval = true;
      } else {
        riskLevel = RISK_LEVELS.MEDIUM;
        requiresHumanApproval = false;
      }
      break;

    case 'FLAG_DEFECTIVE_BATCH':
      riskLevel = RISK_LEVELS.MEDIUM;
      requiresHumanApproval = true;
      break;

    default:
      riskLevel = RISK_LEVELS.HIGH;
      requiresHumanApproval = true;
  }

  return {
    actionType,
    riskLevel,
    requiresHumanApproval,
    policyViolation,
    isPolicyCompliant: !policyViolation
  };
}

module.exports = { evaluateActionPolicy };
