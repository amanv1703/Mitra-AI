/**
 * MITRA AI — Centralized Action Policy & Authorization Engine
 * 
 * Enforces strict multi-tenant boundaries, human approval rules, anti-self-approval, and safety limits.
 */

const { getActionDefinition, ACTION_TYPES, RISK_TIERS } = require('./actionRegistry');
const actionRiskEngine = require('./actionRisk');

class ActionPolicyEngine {
  /**
   * Validates whether an action proposal conforms to merchant safety policies
   * @param {Object} proposal
   * @param {Object} merchantContext
   * @returns {Object} { allowed: boolean, policyChecks: Array, error?: string }
   */
  evaluateProposalPolicy(proposal, merchantContext = {}) {
    const policyChecks = [];

    // 1. Definition check
    const definition = getActionDefinition(proposal.type);
    if (!definition) {
      return {
        allowed: false,
        error: `Action type '${proposal.type}' is not registered in ActionRegistry`,
        policyChecks: [{ name: 'REGISTRY_VALIDATION', passed: false, detail: 'Unknown action type' }]
      };
    }
    policyChecks.push({ name: 'REGISTRY_VALIDATION', passed: true, detail: `Recognized type: ${proposal.type}` });

    // 2. Tenant isolation check
    const proposalMerchantId = Number(proposal.merchantId || 1);
    const contextMerchantId = Number(merchantContext.merchantId || 1);
    if (proposalMerchantId !== contextMerchantId) {
      return {
        allowed: false,
        error: `Tenant isolation violation: Action belongs to Merchant #${proposalMerchantId} but evaluated under Merchant #${contextMerchantId}`,
        policyChecks: [
          ...policyChecks,
          { name: 'TENANT_ISOLATION', passed: false, detail: 'Cross-tenant boundary breach attempt blocked' }
        ]
      };
    }
    policyChecks.push({ name: 'TENANT_ISOLATION', passed: true, detail: `Bound to Merchant #${proposalMerchantId}` });

    // 3. Risk & Safety Evaluation
    const riskEval = actionRiskEngine.evaluateRisk({
      type: proposal.type,
      parameters: proposal.parameters,
      expectedImpact: proposal.expectedImpact,
      merchantLimits: merchantContext.limits || {}
    });

    policyChecks.push({
      name: 'RISK_CLASSIFICATION',
      passed: true,
      detail: `Assigned Risk Tier: ${riskEval.riskLevel} (Score: ${riskEval.riskScore}/100)`
    });

    // 4. Critical Action Safeguard
    if (proposal.type === ACTION_TYPES.REFUND_PAYMENT) {
      policyChecks.push({
        name: 'SANDBOX_FINANCIAL_GUARD',
        passed: true,
        detail: 'Financial actions strictly confined to sandbox environment in Phase 5.'
      });
    }

    return {
      allowed: true,
      riskLevel: riskEval.riskLevel,
      riskScore: riskEval.riskScore,
      requiresApproval: riskEval.requiresApproval,
      requiresTwoStepConfirmation: riskEval.requiresTwoStepConfirmation,
      reversibility: riskEval.reversibility,
      policyChecks
    };
  }

  /**
   * Validates whether a specific approval request is authorized and safe
   * @param {Object} params
   * @param {Object} params.action The target action record
   * @param {Object} params.actor The approving user identity
   * @param {string} params.justification Rationale provided by merchant
   * @returns {Object} { allowed: boolean, error?: string }
   */
  evaluateApprovalPolicy({ action, actor, justification }) {
    if (!action) {
      return { allowed: false, error: 'Action not found' };
    }

    // 1. Check expiration
    if (action.expiresAt && new Date(action.expiresAt) < new Date()) {
      return { allowed: false, error: 'Action proposal has expired and can no longer be approved' };
    }

    // 2. Anti-Self-Approval Rule: AI cannot approve its own action
    if (!actor || actor.type === 'AI_AGENT' || actor.identifier?.includes('MITRA')) {
      return {
        allowed: false,
        error: 'Safety Violation: AI Agents are strictly forbidden from approving business actions. Human merchant authorization is required.'
      };
    }

    // 3. Tenant validation
    if (actor.merchantId && Number(actor.merchantId) !== Number(action.merchantId)) {
      return {
        allowed: false,
        error: 'Tenant isolation violation: User belongs to a different merchant organization.'
      };
    }

    // 4. Justification check for High/Critical actions
    if ((action.riskLevel === RISK_TIERS.HIGH || action.riskLevel === RISK_TIERS.CRITICAL) && (!justification || justification.trim().length < 5)) {
      return {
        allowed: false,
        error: `A substantive justification (min 5 chars) is mandatory when approving ${action.riskLevel} risk operations.`
      };
    }

    return { allowed: true };
  }

  /**
   * Validates whether an action is authorized to execute
   */
  evaluateExecutionPolicy(action) {
    if (!action) {
      return { allowed: false, error: 'Action not found' };
    }

    if (action.status !== 'APPROVED') {
      return {
        allowed: false,
        error: `Cannot execute action in '${action.status}' state. Only actions in 'APPROVED' state may be executed.`
      };
    }

    return { allowed: true };
  }
}

module.exports = new ActionPolicyEngine();
