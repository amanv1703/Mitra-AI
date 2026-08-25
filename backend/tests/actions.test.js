/**
 * MITRA AI — Comprehensive Action Orchestration & State Machine Test Suite
 */

const assert = require('assert');
const actions = require('../src/actions');

async function testActions() {
  console.log('🧪 Testing Action Orchestration, State Machine, Idempotency & Verification...');

  // 1. Propose Restock Action
  const proposal = await actions.proposeAction({
    type: 'CREATE_RESTOCK_RECOMMENDATION',
    merchantId: 1,
    reason: 'Demand surge (+140%) consumed inventory buffer; stock will exhaust in 2.2 days vs 5-day lead time.',
    parameters: {
      productId: 2,
      sku: 'SKU-FIT-105',
      recommendedQuantity: 250,
      supplierName: 'Coimbatore Precision Gear',
      unitCost: 450,
      dailyVelocity: 20.4
    },
    expectedImpact: {
      financialOutlayInr: 112500.0,
      stockCoverageGainDays: 12.3,
      revenueProtectedInr: 292993.68
    },
    createdBy: 'MITRA_AI_AGENT'
  });

  assert(proposal, 'Proposal must be created');
  assert.strictEqual(proposal.status, 'PENDING_APPROVAL', 'Initial status for medium-risk restock must be PENDING_APPROVAL');
  assert.strictEqual(proposal.riskLevel, 'MEDIUM', 'Risk level must be classified as MEDIUM');
  assert(proposal.idempotencyKey, 'Proposal must have an idempotency key');
  console.log(`   - Proposed Action: [${proposal.id}] Type: ${proposal.type} Risk: ${proposal.riskLevel} (${proposal.status})`);

  // 2. Test Invalid State Transition (Attempting to execute before approval)
  let illegalTransitionCaught = false;
  try {
    await actions.executeAction(proposal.id, { identifier: 'operator' });
  } catch (err) {
    illegalTransitionCaught = true;
  }
  assert(illegalTransitionCaught, 'State machine must block executing an unapproved action');
  console.log('   - State Machine Guard: Successfully blocked executing unapproved action.');

  // 3. Human Approval Gate
  const approved = await actions.approveAction(
    proposal.id,
    { type: 'MERCHANT_USER', identifier: 'operations_lead@apexretail.in', merchantId: 1 },
    'Verified demand surge and confirmed supplier capacity'
  );
  assert.strictEqual(approved.status, 'APPROVED', 'Status after approval must be APPROVED');
  assert.strictEqual(approved.approvedBy, 'operations_lead@apexretail.in', 'ApprovedBy must record human actor');
  console.log(`   - Human Approval: [${approved.id}] Approved by ${approved.approvedBy}`);

  // 4. Execution & Automated Verification
  const execResult = await actions.executeAction(proposal.id, { identifier: 'operations_lead@apexretail.in' });
  assert.strictEqual(execResult.status, 'VERIFIED', 'Status after execution and verification must be VERIFIED');
  assert(execResult.verification && execResult.verification.passed, 'Post-execution verification must pass');
  assert(execResult.verification.checks.length >= 2, 'Verification must perform multiple checks');
  console.log(`   - Execution & Verification: [${proposal.id}] Status: ${execResult.status} (${execResult.verification.checks.length} checks passed)`);

  // 5. Idempotency Check: Calling execute again must not duplicate execution
  const duplicateExec = await actions.executeAction(proposal.id, { identifier: 'operations_lead@apexretail.in' });
  assert.strictEqual(duplicateExec.status, 'VERIFIED', 'Duplicate execution returns cached VERIFIED state');
  assert(duplicateExec.idempotentReplay, 'Idempotency replay flag must be true');
  console.log('   - Idempotency Guarantee: Replay successfully prevented duplicate database execution.');

  // 6. Test Business Report Action (Low Risk / Auto-Approved)
  const reportAction = await actions.proposeAction({
    type: 'CREATE_BUSINESS_REPORT',
    merchantId: 1,
    reason: 'Monthly business health synthesis',
    parameters: { reportType: 'EXECUTIVE_HEALTH_SUMMARY' }
  });
  assert.strictEqual(reportAction.status, 'APPROVED', 'Low-risk report proposal should be auto-approved');
  const reportExec = await actions.executeAction(reportAction.id);
  assert.strictEqual(reportExec.status, 'VERIFIED', 'Report execution must verify successfully');
  console.log(`   - Report Action: [${reportAction.id}] Generated and verified report.`);

  // 7. Test Notification Draft Action
  const notifAction = await actions.proposeAction({
    type: 'CREATE_NOTIFICATION_DRAFT',
    merchantId: 1,
    reason: 'VIP checkout payment friction alert',
    parameters: {
      channel: 'EMAIL',
      targetAudience: 'VIP_FRICTION_COHORT',
      messageBody: 'Apologies for the recent checkout issue. Here is a 5% credit.'
    }
  });
  assert.strictEqual(notifAction.status, 'PENDING_APPROVAL');
  await actions.approveAction(notifAction.id, { type: 'MERCHANT_USER', identifier: 'merchant@apexretail.in', merchantId: 1 }, 'Approved email draft');
  const notifExec = await actions.executeAction(notifAction.id);
  assert.strictEqual(notifExec.status, 'VERIFIED');
  console.log(`   - Notification Draft Action: [${notifAction.id}] Draft created and verified without external dispatch.`);

  // 8. Timeline Event Audit
  const timeline = actions.getActionTimeline(proposal.id);
  assert(timeline.length >= 4, 'Timeline must record all lifecycle events');
  console.log(`   - Action Audit Trail: Recorded ${timeline.length} sequential lifecycle events.`);

  console.log('   ✅ Action Orchestration, State Machine & Verification verified successfully.');
}

module.exports = { testActions };
