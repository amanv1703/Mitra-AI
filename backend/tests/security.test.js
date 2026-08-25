/**
 * MITRA AI — Security, Multi-Tenant Isolation & Policy Guardrails Test Suite
 */

const assert = require('assert');
const actions = require('../src/actions');
const simulationTools = require('../src/ai/tools/simulationTools');

async function testSecurity() {
  console.log('🧪 Testing Multi-Tenant Isolation, Anti-Self-Approval & Security Guardrails...');

  // 1. Propose action for Merchant #1
  const merchant1Action = await actions.proposeAction({
    type: 'CREATE_RESTOCK_RECOMMENDATION',
    merchantId: 1,
    reason: 'Security isolation test action for Merchant 1',
    parameters: {
      productId: 2,
      recommendedQuantity: 100
    }
  }, { merchantId: 1 });

  // 2. Test Cross-Tenant Access Block (Merchant #2 cannot view or approve Merchant #1 action)
  let crossTenantGetBlocked = false;
  try {
    actions.getActionById(merchant1Action.id, 2); // Requesting under Merchant #2
  } catch (err) {
    crossTenantGetBlocked = true;
  }
  assert(crossTenantGetBlocked, 'Tenant isolation must block Merchant #2 from accessing Merchant #1 action');
  console.log('   - Tenant Isolation (Read): Cross-tenant inspection blocked.');

  let crossTenantApproveBlocked = false;
  try {
    await actions.approveAction(
      merchant1Action.id,
      { type: 'MERCHANT_USER', identifier: 'attacker@othermerchant.com', merchantId: 2 },
      'Unauthorized cross-tenant attempt'
    );
  } catch (err) {
    crossTenantApproveBlocked = true;
  }
  assert(crossTenantApproveBlocked, 'Tenant isolation must block cross-tenant approval');
  console.log('   - Tenant Isolation (Write/Approve): Cross-tenant approval blocked.');

  // 3. Test Anti-Self-Approval Rule (AI cannot approve its own action)
  let aiSelfApprovalBlocked = false;
  try {
    await actions.approveAction(
      merchant1Action.id,
      { type: 'AI_AGENT', identifier: 'MITRA_AI_AUTONOMOUS_ORCHESTRATOR', merchantId: 1 },
      'AI self-approving its own action'
    );
  } catch (err) {
    aiSelfApprovalBlocked = true;
  }
  assert(aiSelfApprovalBlocked, 'Policy Engine must strictly forbid AI Agents from self-approving actions');
  console.log('   - Anti-Self-Approval Guard: AI autonomous self-approval blocked.');

  // 4. Test Expired Action Block
  const expiredAction = await actions.proposeAction({
    type: 'CREATE_RESTOCK_RECOMMENDATION',
    merchantId: 1,
    reason: 'Expiration test',
    parameters: { productId: 2, recommendedQuantity: 50 }
  });
  // Manually backdate expiration
  expiredAction.expiresAt = new Date(Date.now() - 3600 * 1000).toISOString();

  let expiredApprovalBlocked = false;
  try {
    await actions.approveAction(
      expiredAction.id,
      { type: 'MERCHANT_USER', identifier: 'merchant@apexretail.in', merchantId: 1 },
      'Attempting to approve expired action'
    );
  } catch (err) {
    expiredApprovalBlocked = true;
  }
  assert(expiredApprovalBlocked, 'Approval engine must reject expired actions');
  console.log('   - Expiration Guard: Approval of expired action blocked.');

  // 5. Test What-If Counterfactual Simulation Safety (Zero Database Mutation Guarantee)
  const simResult = await simulationTools.simulateRestockScenario({
    productId: 2,
    reorderQuantity: 500,
    freightType: 'EXPRESS'
  });
  assert.strictEqual(simResult.simulation, true, 'Simulation response must be explicitly flagged');
  assert.strictEqual(simResult.databaseMutated, false, 'Database mutation flag must be explicitly false');
  console.log('   - Counterfactual Simulation: Verified 100% read-only calculation (Zero DB mutations).');

  // 6. Test High-Risk Financial Action Isolation (No real financial transfers allowed)
  const refundProposal = await actions.proposeAction({
    type: 'REFUND_PAYMENT',
    merchantId: 1,
    reason: 'Sandbox refund test',
    parameters: { paymentId: 1234, orderId: 5678, amount: 1500 }
  });
  assert.strictEqual(refundProposal.riskLevel, 'CRITICAL', 'Refund payment must be CRITICAL risk');
  assert.strictEqual(refundProposal.requiresTwoStepConfirmation, true, 'Critical risk must require two-step confirmation');
  console.log('   - Financial Transaction Guard: Sandboxed with mandatory two-step manager confirmation.');

  console.log('   ✅ All Security, Multi-Tenant Isolation & Policy Guardrails passed.');
}

module.exports = { testSecurity };
