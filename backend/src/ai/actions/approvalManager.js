/**
 * MITRA AI — Human-in-the-Loop Approval Manager
 * 
 * Manages action proposal lifecycle (PENDING -> APPROVED -> EXECUTED or REJECTED)
 */

const { ACTIONS } = require('./actionRegistry');
const auditLogger = require('./auditLogger');

class ApprovalManager {
  constructor() {
    this.proposals = new Map();
    this.seedDefaultProposals();
  }

  seedDefaultProposals() {
    this.createProposal({
      id: 'ACT-PO-2026-001',
      actionType: 'CREATE_PURCHASE_ORDER',
      title: 'Expedited Purchase Order for SKU-FIT-105',
      target: 'Ergonomic High-Density Yoga Mat',
      reason: 'Available stock (45 units) will exhaust in 2.2 days vs 5-day supplier lead time.',
      estimatedImpactInr: 292993.68,
      parameters: {
        sku: 'SKU-FIT-105',
        quantity: 200,
        supplierName: 'Coimbatore Precision Gear',
        freightType: 'PRIORITY_EXPRESS'
      }
    });

    this.createProposal({
      id: 'ACT-FAILOVER-2026-002',
      actionType: 'REROUTE_PAYMENT_GATEWAY',
      title: 'Payment Gateway Dynamic Rail Failover',
      target: 'Primary HDFC Netbanking Rail',
      reason: 'Bank timeout error spike causing 28.5% peak checkout drop rate.',
      estimatedImpactInr: 15381341.52,
      parameters: {
        primaryRail: 'HDFC_NETBANKING',
        fallbackRail: 'UPI_AND_CARDS_DEFAULT',
        durationHours: 24
      }
    });
  }

  createProposal({
    id = `ACT-${Date.now()}`,
    actionType,
    title,
    target,
    reason,
    estimatedImpactInr = 0,
    parameters = {},
    requiresApproval = true
  }) {
    const proposal = {
      id,
      actionType,
      title: title || ACTIONS[actionType]?.name || actionType,
      target: target || 'Business Operations',
      reason,
      estimatedImpactInr,
      parameters,
      requiresApproval,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.proposals.set(id, proposal);
    return proposal;
  }

  getAllProposals() {
    return Array.from(this.proposals.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getProposalById(id) {
    return this.proposals.get(id) || null;
  }

  async approveProposal(id, actor = 'MERCHANT_ADMIN', justification = 'Approved via Mitra AI Control Center') {
    const proposal = this.proposals.get(id);
    if (!proposal) {
      throw new Error(`Action proposal '${id}' not found`);
    }

    if (proposal.status !== 'PENDING') {
      throw new Error(`Proposal '${id}' is already ${proposal.status}`);
    }

    proposal.status = 'APPROVED';
    proposal.updatedAt = new Date().toISOString();
    proposal.approvedBy = actor;
    proposal.approvedAt = new Date().toISOString();

    // Execute mock handler
    proposal.executionResult = {
      success: true,
      executedAt: new Date().toISOString(),
      referenceCode: `EXEC-${Math.floor(100000 + Math.random() * 900000)}`,
      message: `Action '${proposal.title}' successfully executed and verified.`
    };
    proposal.status = 'EXECUTED';

    await auditLogger.logAction({
      actionId: proposal.id,
      actionType: proposal.actionType,
      status: 'EXECUTED',
      actor,
      justification,
      parameters: proposal.parameters,
      executionResult: proposal.executionResult
    });

    return proposal;
  }

  async rejectProposal(id, actor = 'MERCHANT_ADMIN', justification = 'Rejected by Merchant') {
    const proposal = this.proposals.get(id);
    if (!proposal) {
      throw new Error(`Action proposal '${id}' not found`);
    }

    if (proposal.status !== 'PENDING') {
      throw new Error(`Proposal '${id}' is already ${proposal.status}`);
    }

    proposal.status = 'REJECTED';
    proposal.updatedAt = new Date().toISOString();
    proposal.rejectedBy = actor;
    proposal.rejectedAt = new Date().toISOString();
    proposal.rejectionReason = justification;

    await auditLogger.logAction({
      actionId: proposal.id,
      actionType: proposal.actionType,
      status: 'REJECTED',
      actor,
      justification,
      parameters: proposal.parameters
    });

    return proposal;
  }
}

module.exports = new ApprovalManager();
