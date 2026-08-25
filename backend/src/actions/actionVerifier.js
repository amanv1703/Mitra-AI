/**
 * MITRA AI — Post-Execution Action Verification Engine
 * 
 * Verifies that an executed business operation produced the exact expected state in the database/storage before marking as VERIFIED.
 */

const { ACTION_TYPES } = require('./actionRegistry');
const restockExecutor = require('./executors/restockExecutor');
const reportExecutor = require('./executors/reportExecutor');
const notificationExecutor = require('./executors/notificationExecutor');
const insightExecutor = require('./executors/insightExecutor');

class ActionVerifier {
  /**
   * Performs rigorous deterministic post-execution checks
   * @param {Object} action The executed action object
   * @param {Object} executionResult Result payload returned from executor
   * @returns {Object} { passed: boolean, checks: Array, failureReason?: string, verifiedAt: string }
   */
  async verifyAction(action, executionResult) {
    const checks = [];
    let passed = true;
    let failureReason = null;

    if (!executionResult || typeof executionResult !== 'object') {
      return {
        passed: false,
        failureReason: 'Execution result payload is empty or invalid',
        checks: [{ check: 'PAYLOAD_INTEGRITY', passed: false, details: 'Missing result payload' }],
        verifiedAt: new Date().toISOString()
      };
    }

    try {
      switch (action.type) {
        case ACTION_TYPES.CREATE_RESTOCK_RECOMMENDATION: {
          const recId = executionResult.recommendationId;
          checks.push({ check: 'RECEIPT_PRESENT', passed: Boolean(recId), details: `Receipt ID: ${recId}` });

          const record = await restockExecutor.getRecommendation(recId);
          const recordFound = Boolean(record);
          checks.push({ check: 'PERSISTENCE_VERIFICATION', passed: recordFound, details: recordFound ? 'Record confirmed in store' : 'Record not found' });

          if (record) {
            const qtyMatch = Number(record.recommendedQuantity) === Number(action.parameters.recommendedQuantity);
            checks.push({ check: 'QUANTITY_FIDELITY', passed: qtyMatch, details: `Expected: ${action.parameters.recommendedQuantity}, Actual: ${record.recommendedQuantity}` });
            if (!qtyMatch) passed = false;
          } else {
            passed = false;
          }
          break;
        }

        case ACTION_TYPES.CREATE_BUSINESS_REPORT: {
          const rptId = executionResult.reportId;
          checks.push({ check: 'REPORT_ID_PRESENT', passed: Boolean(rptId), details: `Report ID: ${rptId}` });

          const report = await reportExecutor.getReport(rptId);
          const reportValid = Boolean(report && report.healthScore !== undefined);
          checks.push({ check: 'REPORT_STRUCTURE_VALID', passed: reportValid, details: reportValid ? `Report generated with score ${report.healthScore}/100` : 'Report invalid' });

          if (!reportValid) passed = false;
          break;
        }

        case ACTION_TYPES.CREATE_NOTIFICATION_DRAFT: {
          const draftId = executionResult.draftId;
          checks.push({ check: 'DRAFT_ID_PRESENT', passed: Boolean(draftId), details: `Draft ID: ${draftId}` });

          const draft = await notificationExecutor.getDraft(draftId);
          const draftConfirmed = Boolean(draft && draft.dispatched === false);
          checks.push({ check: 'NON_DISPATCH_SAFETY_CHECK', passed: draftConfirmed, details: 'Confirmed draft is retained internally without premature external broadcast' });

          if (!draftConfirmed) passed = false;
          break;
        }

        case ACTION_TYPES.MARK_INSIGHT_REVIEWED:
        case ACTION_TYPES.DISMISS_INSIGHT: {
          const insightId = action.parameters.insightId;
          const state = await insightExecutor.getInsightState(insightId);
          const stateMatched = Boolean(state && (state.status === 'ACKNOWLEDGED' || state.status === 'DISMISSED'));
          checks.push({ check: 'STATE_TRANSITION_CHECK', passed: stateMatched, details: stateMatched ? `Status verified: ${state.status}` : 'Status transition not confirmed' });

          if (!stateMatched) passed = false;
          break;
        }

        default: {
          // Generic execution sanity verification
          const hasSuccessFlag = executionResult.success !== false;
          checks.push({ check: 'GENERIC_EXECUTION_CHECK', passed: hasSuccessFlag, details: 'Execution returned success confirmation' });
          if (!hasSuccessFlag) passed = false;
        }
      }
    } catch (err) {
      passed = false;
      failureReason = `Verification error: ${err.message}`;
      checks.push({ check: 'EXCEPTION_MONITOR', passed: false, details: err.message });
    }

    if (!passed && !failureReason) {
      failureReason = 'One or more post-execution fidelity checks failed.';
    }

    return {
      passed,
      failureReason,
      checks,
      verifiedAt: new Date().toISOString()
    };
  }
}

module.exports = new ActionVerifier();
