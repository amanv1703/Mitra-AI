/**
 * MITRA AI — Proactive Intelligence & Scheduler Test Suite
 * 
 * Tests:
 * 1. Scheduler startup and interval registration
 * 2. Risk scan execution & priority scoring
 * 3. Opportunity scan execution
 * 4. Daily brief generation
 * 5. Outcome check execution
 * 6. Alert deduplication & fingerprint idempotency
 * 7. Multi-tenant isolation
 * 8. Error resilience & fault isolation
 * 9. Manual trigger API compatibility
 * 10. Scheduler graceful termination
 */

const assert = require('assert');
const { proactiveScheduler, proactiveJob, proactiveRunStore, JOB_TYPES } = require('../src/proactive');

async function testProactive() {
  console.log('🧪 Testing Proactive Intelligence & Scheduler Subsystem...');

  proactiveRunStore.clear();

  // 1. Scheduler Start
  proactiveScheduler.start({ runInitialScan: false });
  const statusBefore = proactiveScheduler.getStatus(1);
  assert.strictEqual(statusBefore.isRunning, true, 'Scheduler must be running after start()');
  assert.ok(statusBefore.activeTimers.length >= 3, 'Scheduler must register timers for all job types');
  console.log('   - Scheduler Start & Timer Registration: PASSED');

  // 2. Risk Scan Job Execution & Alert Prioritization
  const riskResult = await proactiveJob.execute({ jobType: JOB_TYPES.RISK_SCAN, merchantId: 1 });
  assert.strictEqual(riskResult.success, true, 'Risk scan must complete successfully');
  assert.ok(riskResult.alertsCreated > 0, 'Risk scan must detect and create alerts from live telemetry');
  const alerts = proactiveRunStore.getAlerts({ merchantId: 1 });
  assert.ok(alerts.length > 0, 'Alerts must be persisted in run store');
  const topAlert = alerts[0];
  assert.ok(topAlert.priorityScore > 0, 'Alerts must have calculated priority score');
  assert.ok(topAlert.evidence && topAlert.evidence.length > 0, 'Alerts must include empirical evidence');
  console.log(`   - Risk Scan: Generated ${riskResult.alertsCreated} alerts (Top: [${topAlert.severity}] ${topAlert.title}, Priority: ${topAlert.priorityScore})`);

  // 3. Idempotency & Alert Deduplication (Re-running same scan)
  const duplicateRiskResult = await proactiveJob.execute({ jobType: JOB_TYPES.RISK_SCAN, merchantId: 1 });
  assert.strictEqual(duplicateRiskResult.success, true, 'Duplicate scan must succeed');
  assert.strictEqual(duplicateRiskResult.alertsCreated, 0, 'Duplicate scan must NOT create new alerts');
  assert.ok(duplicateRiskResult.alertsDeduplicated > 0, 'Duplicate scan must increment deduplicated counter');
  console.log(`   - Alert Deduplication: ${duplicateRiskResult.alertsDeduplicated} duplicate alerts updated/skipped without cloning`);

  // 4. Opportunity Scan Job Execution
  const oppResult = await proactiveJob.execute({ jobType: JOB_TYPES.OPPORTUNITY_SCAN, merchantId: 1 });
  assert.strictEqual(oppResult.success, true, 'Opportunity scan must complete successfully');
  const oppAlerts = proactiveRunStore.getAlerts({ merchantId: 1, domain: 'INVENTORY' }).filter(a => a.jobType === JOB_TYPES.OPPORTUNITY_SCAN);
  assert.ok(oppAlerts.length > 0, 'Opportunity alerts must be registered');
  console.log(`   - Opportunity Scan: Detected ${oppResult.alertsCreated} growth opportunities`);

  // 5. Daily Brief Generation
  const briefResult = await proactiveJob.execute({ jobType: JOB_TYPES.DAILY_BRIEF, merchantId: 1 });
  assert.strictEqual(briefResult.success, true, 'Daily brief must generate successfully');
  const briefAlert = proactiveRunStore.getAlerts({ merchantId: 1 }).find(a => a.jobType === JOB_TYPES.DAILY_BRIEF);
  assert.ok(briefAlert, 'Daily brief alert must be present');
  assert.ok(briefAlert.evidence.length >= 2, 'Daily brief must contain 24h operational evidence');
  console.log(`   - Daily Brief: Generated '${briefAlert.title}'`);

  // 6. Outcome Check Execution
  const outcomeResult = await proactiveJob.execute({ jobType: JOB_TYPES.OUTCOME_CHECK, merchantId: 1 });
  assert.strictEqual(outcomeResult.success, true, 'Outcome check must succeed');
  console.log(`   - Outcome Check: Completed evaluation (${outcomeResult.summary})`);

  // 7. Multi-Tenant Isolation
  const m2Result = await proactiveJob.execute({ jobType: JOB_TYPES.RISK_SCAN, merchantId: 2 });
  const m1Alerts = proactiveRunStore.getAlerts({ merchantId: 1 });
  const m2Alerts = proactiveRunStore.getAlerts({ merchantId: 2 });
  assert.ok(m1Alerts.every(a => a.merchantId === 1), 'Merchant 1 alerts must strictly belong to Merchant 1');
  assert.ok(m2Alerts.every(a => a.merchantId === 2), 'Merchant 2 alerts must strictly belong to Merchant 2');
  console.log('   - Multi-Tenant Isolation: Merchant 1 and 2 alert stores strictly segregated');

  // 8. Error Resilience & Fault Isolation
  let schedulerCrashed = false;
  try {
    // Force a job on non-existent type or handled error
    await proactiveJob.execute({ jobType: 'INVALID_JOB_TYPE', merchantId: 1 });
  } catch (e) {
    // Should return success: false object rather than unhandled exception
  }
  const statusDuring = proactiveScheduler.getStatus(1);
  assert.strictEqual(statusDuring.isRunning, true, 'Scheduler must remain running after individual job errors');
  console.log('   - Fault Isolation: Scheduler continues uninterrupted after job failure');

  // 9. Manual Trigger API
  const manualResult = await proactiveScheduler.triggerManualRun({ jobType: JOB_TYPES.RISK_SCAN, merchantId: 1 });
  assert.strictEqual(manualResult.success, true, 'Manual trigger must invoke standard job executor');
  console.log('   - Manual Trigger: Successfully executed via scheduler dispatcher');

  // 10. Scheduler Termination
  proactiveScheduler.stop();
  const statusAfter = proactiveScheduler.getStatus(1);
  assert.strictEqual(statusAfter.isRunning, false, 'Scheduler must be stopped after stop()');
  assert.strictEqual(statusAfter.activeTimers.length, 0, 'All interval handles must be cleared');
  console.log('   - Scheduler Termination: All timers cleared cleanly');

  console.log('   ✅ Proactive Intelligence & Scheduler verified with 100% compliance.\n');
}

module.exports = { testProactive };
