/**
 * MITRA AI — Action Planner & Lifecycle Orchestrator
 * 
 * Prepares standardized action proposals, evaluates policy/risk, manages human approvals,
 * and maintains the in-memory/database action ledger.
 */

const { getActionDefinition, ACTION_TYPES } = require('./actionRegistry');
const { stateMachine, ACTION_STATES } = require('./actionStateMachine');
const actionValidator = require('./actionValidator');
const actionPolicy = require('./actionPolicy');
const actionExecutor = require('./actionExecutor');
const actionAudit = require('./actionAudit');

class ActionPlanner {
  constructor() {
    this.actionsStore = new Map();
    this.idempotencyIndex = new Map(); // idempotencyKey -> actionId
    this.seedDefaultActions();
  }

  seedDefaultActions() {
    // Seed default restock and payment routing proposals for demo and tests
    this.proposeAction({
      id: 'ACT-RESTOCK-2026-001',
      type: ACTION_TYPES.CREATE_RESTOCK_RECOMMENDATION,
      merchantId: 1,
      reason: '140% demand surge consumed buffer; stock (45 units) will deplete in 2.2 days vs 5-day supplier lead time.',
      parameters: {
        productId: 2,
        sku: 'SKU-FIT-105',
        recommendedQuantity: 250,
        supplierName: 'Coimbatore Precision Gear',
        unitCost: 450,
        dailyVelocity: 20.4,
        coverageDaysTarget: 14.5
      },
      expectedImpact: {
        revenueProtectedInr: 292993.68,
        financialOutlayInr: 112500.0,
        stockCoverageGainDays: 12.3
      },
      createdBy: 'MITRA_AI_AGENT'
    });

    this.proposeAction({
      id: 'ACT-ROUTING-2026-002',
      type: ACTION_TYPES.REROUTE_PAYMENT_GATEWAY,
      merchantId: 1,
      reason: 'Primary HDFC Netbanking gateway failure rate spiked to 28.5% (450+ dropped checkouts).',
      parameters: {
        primaryRail: 'HDFC_NETBANKING',
        fallbackRail: 'UPI_AND_CARDS_DEFAULT',
        durationHours: 24
      },
      expectedImpact: {
        revenueProtectedInr: 15381341.52,
        recoveredTransactionCount: 450
      },
      createdBy: 'MITRA_AI_AGENT'
    });
  }

  /**
   * Proposes a new business action with full schema, policy, and risk validation
   */
  async proposeAction(input = {}, merchantContext = { merchantId: 1 }) {
    // 1. Schema validation
    const validation = actionValidator.validateProposalInput(input);
    if (!validation.valid) {
      const err = new Error(`Action validation failed: ${validation.errors.join(', ')}`);
      err.statusCode = 400;
      err.code = 'INVALID_ACTION_SCHEMA';
      throw err;
    }

    const merchantId = Number(input.merchantId || merchantContext.merchantId || 1);
    const idempotencyKey = input.idempotencyKey || actionValidator.generateIdempotencyKey(input.type, merchantId, input.parameters);

    // Idempotency check: if action with same idempotency key exists, return existing
    if (this.idempotencyIndex.has(idempotencyKey)) {
      const existingId = this.idempotencyIndex.get(idempotencyKey);
      return this.actionsStore.get(existingId);
    }

    const actionId = input.id || `ACT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 2. Policy & Risk Evaluation
    const policyResult = actionPolicy.evaluateProposalPolicy(
      { type: input.type, merchantId, parameters: input.parameters, expectedImpact: input.expectedImpact || {} },
      merchantContext
    );

    if (!policyResult.allowed) {
      const err = new Error(`Action blocked by policy engine: ${policyResult.error}`);
      err.statusCode = 403;
      err.code = 'POLICY_VIOLATION';
      throw err;
    }

    // Determine initial state: If low risk and approval not required, set APPROVED; else PENDING_APPROVAL
    const initialState = policyResult.requiresApproval ? ACTION_STATES.PENDING_APPROVAL : ACTION_STATES.APPROVED;

    // TTL Expiration: 48 hours for pending actions
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    const action = {
      id: actionId,
      type: input.type,
      name: getActionDefinition(input.type)?.name || input.type,
      status: initialState,
      riskLevel: policyResult.riskLevel,
      riskScore: policyResult.riskScore,
      requiresApproval: policyResult.requiresApproval,
      requiresTwoStepConfirmation: policyResult.requiresTwoStepConfirmation,
      reversibility: policyResult.reversibility,
      merchantId,
      conversationId: input.conversationId || null,
      insightId: input.insightId || null,
      reason: input.reason,
      target: input.target || { type: getActionDefinition(input.type)?.targetType || 'GENERAL' },
      parameters: input.parameters,
      expectedImpact: input.expectedImpact || {},
      idempotencyKey,
      createdBy: input.createdBy || 'MITRA_AI_AGENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      executionResult: null,
      verificationResult: null
    };

    this.actionsStore.set(actionId, action);
    this.idempotencyIndex.set(idempotencyKey, actionId);

    // Audit proposal event
    await actionAudit.logEvent({
      actionId,
      eventType: 'ACTION_PROPOSED',
      merchantId,
      actor: { type: 'AI_AGENT', identifier: action.createdBy },
      justification: action.reason,
      metadata: {
        type: action.type,
        riskLevel: action.riskLevel,
        parameters: action.parameters,
        expectedImpact: action.expectedImpact
      }
    });

    return action;
  }

  /**
   * Approves an action proposal (by human merchant)
   */
  async approveAction(actionId, actor = { type: 'MERCHANT_USER', identifier: 'merchant@apexretail.in', merchantId: 1 }, justification = '') {
    const action = this.actionsStore.get(actionId);
    if (!action) {
      const err = new Error(`Action '${actionId}' not found.`);
      err.statusCode = 404;
      err.code = 'ACTION_NOT_FOUND';
      throw err;
    }

    // Check expiration before approval
    if (action.expiresAt && new Date(action.expiresAt) < new Date()) {
      action.status = ACTION_STATES.EXPIRED;
      action.updatedAt = new Date().toISOString();
      await actionAudit.logEvent({
        actionId,
        eventType: 'ACTION_EXPIRED',
        merchantId: action.merchantId,
        justification: 'Action approval window expired'
      });
      const err = new Error(`Action '${actionId}' has expired and cannot be approved.`);
      err.statusCode = 400;
      err.code = 'ACTION_EXPIRED';
      throw err;
    }

    // Policy check for approval
    const approvalPolicy = actionPolicy.evaluateApprovalPolicy({ action, actor, justification });
    if (!approvalPolicy.allowed) {
      const err = new Error(approvalPolicy.error);
      err.statusCode = 403;
      err.code = 'APPROVAL_POLICY_REJECTED';
      throw err;
    }

    // State machine check
    stateMachine.assertTransition(action.id, action.status, ACTION_STATES.APPROVED);

    action.status = ACTION_STATES.APPROVED;
    action.approvedBy = actor.identifier || 'MERCHANT_USER';
    action.approvedAt = new Date().toISOString();
    action.approvalJustification = justification || 'Approved via Mitra AI Action Center';
    action.updatedAt = new Date().toISOString();

    await actionAudit.logEvent({
      actionId,
      eventType: 'ACTION_APPROVED',
      merchantId: action.merchantId,
      actor,
      justification: action.approvalJustification,
      metadata: { approvedBy: action.approvedBy }
    });

    return action;
  }

  /**
   * Rejects an action proposal
   */
  async rejectAction(actionId, actor = { type: 'MERCHANT_USER', identifier: 'merchant@apexretail.in', merchantId: 1 }, justification = 'Rejected by merchant') {
    const action = this.actionsStore.get(actionId);
    if (!action) {
      const err = new Error(`Action '${actionId}' not found.`);
      err.statusCode = 404;
      err.code = 'ACTION_NOT_FOUND';
      throw err;
    }

    stateMachine.assertTransition(action.id, action.status, ACTION_STATES.REJECTED);

    action.status = ACTION_STATES.REJECTED;
    action.rejectedBy = actor.identifier || 'MERCHANT_USER';
    action.rejectedAt = new Date().toISOString();
    action.rejectionReason = justification;
    action.updatedAt = new Date().toISOString();

    await actionAudit.logEvent({
      actionId,
      eventType: 'ACTION_REJECTED',
      merchantId: action.merchantId,
      actor,
      justification,
      metadata: { reason: justification }
    });

    return action;
  }

  /**
   * Executes an approved action with automated verification
   */
  async executeAction(actionId, actorContext = { type: 'MERCHANT_USER', identifier: 'MERCHANT' }) {
    const action = this.actionsStore.get(actionId);
    if (!action) {
      const err = new Error(`Action '${actionId}' not found.`);
      err.statusCode = 404;
      err.code = 'ACTION_NOT_FOUND';
      throw err;
    }

    return await actionExecutor.executeAction(action, { actor: actorContext });
  }

  /**
   * Cancels a pending action
   */
  async cancelAction(actionId, actor = { type: 'MERCHANT_USER', identifier: 'MERCHANT' }, reason = 'Cancelled by operator') {
    const action = this.actionsStore.get(actionId);
    if (!action) {
      const err = new Error(`Action '${actionId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    stateMachine.assertTransition(action.id, action.status, ACTION_STATES.CANCELLED);

    action.status = ACTION_STATES.CANCELLED;
    action.cancelledAt = new Date().toISOString();
    action.cancellationReason = reason;
    action.updatedAt = new Date().toISOString();

    await actionAudit.logEvent({
      actionId,
      eventType: 'ACTION_CANCELLED',
      merchantId: action.merchantId,
      actor,
      justification: reason
    });

    return action;
  }

  /**
   * Retrieves all actions with optional filters
   */
  getActions({ merchantId = 1, status, riskLevel, search } = {}) {
    let list = Array.from(this.actionsStore.values())
      .filter(a => Number(a.merchantId) === Number(merchantId));

    if (status) {
      list = list.filter(a => a.status === status.toUpperCase());
    }
    if (riskLevel) {
      list = list.filter(a => a.riskLevel === riskLevel.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Retrieves single action detail by ID
   */
  getActionById(actionId, merchantId = 1) {
    const action = this.actionsStore.get(actionId);
    if (!action) return null;
    if (Number(action.merchantId) !== Number(merchantId)) {
      const err = new Error('Tenant isolation violation');
      err.statusCode = 403;
      throw err;
    }
    return action;
  }
}

module.exports = new ActionPlanner();
