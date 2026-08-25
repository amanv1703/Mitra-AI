/**
 * MITRA AI — Deterministic Action Risk Scoring Engine
 * 
 * Computes transparent, explainable 0–100 risk scores and categorizes into LOW / MEDIUM / HIGH / CRITICAL.
 */

const { RISK_TIERS, ACTION_TYPES } = require('./actionRegistry');

class ActionRiskEngine {
  /**
   * Evaluates the risk profile of an action proposal
   * @param {Object} actionParams
   * @param {string} actionParams.type Action type from ACTION_TYPES
   * @param {Object} actionParams.parameters Action parameters
   * @param {Object} actionParams.expectedImpact Calculated financial & operational impact
   * @param {Object} actionParams.merchantLimits Merchant safety configuration
   * @returns {Object} { riskLevel, riskScore, riskFactors, requiresApproval, requiresTwoStepConfirmation, reversibility }
   */
  evaluateRisk({ type, parameters = {}, expectedImpact = {}, merchantLimits = {} }) {
    let baseScore = 20;
    const riskFactors = [];

    switch (type) {
      case ACTION_TYPES.MARK_INSIGHT_REVIEWED:
      case ACTION_TYPES.DISMISS_INSIGHT:
        baseScore = 10;
        riskFactors.push({ factor: 'METADATA_MUTATION_ONLY', weight: 10, description: 'Modifies internal telemetry review status only' });
        break;

      case ACTION_TYPES.CREATE_BUSINESS_REPORT:
        baseScore = 15;
        riskFactors.push({ factor: 'READ_ONLY_AGGREGATION', weight: 15, description: 'Generates analytical report without database writes' });
        break;

      case ACTION_TYPES.CREATE_NOTIFICATION_DRAFT:
        baseScore = 40;
        riskFactors.push({ factor: 'COMMUNICATION_DRAFT', weight: 40, description: 'Creates draft alert message held for human approval before sending' });
        break;

      case ACTION_TYPES.CREATE_RESTOCK_RECOMMENDATION: {
        const capitalOutlay = expectedImpact.financialOutlayInr || (parameters.recommendedQuantity || 0) * (parameters.unitCost || 450);
        baseScore = 50;
        riskFactors.push({
          factor: 'INTERNAL_RESTOCK_DRAFT',
          weight: 50,
          description: `Internal restock recommendation draft for ${parameters.recommendedQuantity || 250} units (Est. ₹${capitalOutlay.toLocaleString('en-IN')})`
        });
        break;
      }

      case ACTION_TYPES.MODIFY_INVENTORY: {
        baseScore = 75;
        riskFactors.push({ factor: 'DIRECT_STOCK_MUTATION', weight: 75, description: 'Directly alters on-hand warehouse inventory count' });
        break;
      }

      case ACTION_TYPES.REROUTE_PAYMENT_GATEWAY: {
        baseScore = 75;
        riskFactors.push({ factor: 'CHECKOUT_TRAFFIC_REROUTING', weight: 75, description: 'Shifts live checkout payment conversion to secondary gateway' });
        break;
      }

      case ACTION_TYPES.REFUND_PAYMENT: {
        baseScore = 95;
        riskFactors.push({ factor: 'FINANCIAL_TRANSACTION_OUTFLOW', weight: 95, description: 'Sandbox financial refund execution requiring strict supervisor confirmation' });
        break;
      }

      default:
        baseScore = 60;
        riskFactors.push({ factor: 'CUSTOM_ACTION_TYPE', weight: 60, description: 'Custom action type evaluation' });
    }

    // Clamp risk score to [0, 100]
    const riskScore = Math.min(100, Math.max(0, baseScore));

    let riskLevel = RISK_TIERS.LOW;
    if (riskScore >= 90) riskLevel = RISK_TIERS.CRITICAL;
    else if (riskScore >= 70) riskLevel = RISK_TIERS.HIGH;
    else if (riskScore >= 30) riskLevel = RISK_TIERS.MEDIUM;
    else riskLevel = RISK_TIERS.LOW;

    // Approval requirement policy
    const requiresApproval = riskLevel !== RISK_TIERS.LOW;
    const requiresTwoStepConfirmation = riskLevel === RISK_TIERS.CRITICAL || riskLevel === RISK_TIERS.HIGH;

    return {
      riskLevel,
      riskScore,
      riskFactors,
      requiresApproval,
      requiresTwoStepConfirmation,
      reversibility: type !== ACTION_TYPES.REFUND_PAYMENT
    };
  }
}

module.exports = new ActionRiskEngine();
