/**
 * MITRA AI — Master Action Executor & Dispatcher
 * 
 * Enforces state machine bounds, idempotency, modular execution dispatch, and post-execution verification.
 */

const { ACTION_TYPES } = require('./actionRegistry');
const { stateMachine, ACTION_STATES } = require('./actionStateMachine');
const actionPolicy = require('./actionPolicy');
const actionVerifier = require('./actionVerifier');
const actionAudit = require('./actionAudit');

const restockExecutor = require('./executors/restockExecutor');
const reportExecutor = require('./executors/reportExecutor');
const notificationExecutor = require('./executors/notificationExecutor');
const insightExecutor = require('./executors/insightExecutor');

class ActionExecutor {
  /**
   * Executes an authorized action proposal and triggers automated verification
   * @param {Object} action The action record to execute
   * @param {Object} context Actor / tenant context
   */
  async executeAction(action, context = {}) {
    if (!action) {
      throw new Error('Action must be provided for execution.');
    }

    // 1. Idempotency Check
    if (action.status === ACTION_STATES.VERIFIED || action.status === ACTION_STATES.EXECUTED) {
      return {
        actionId: action.id,
        status: action.status,
        idempotentReplay: true,
        result: action.executionResult,
        verification: action.verificationResult,
        message: 'Action was already executed and verified. Returned idempotent cached outcome.'
      };
    }

    // 2. Policy Authorization
    const policyEval = actionPolicy.evaluateExecutionPolicy(action);
    if (!policyEval.allowed) {
      throw new Error(policyEval.error || 'Action is not authorized for execution');
    }

    // 3. State transition: APPROVED -> EXECUTING
    stateMachine.assertTransition(action.id, action.status, ACTION_STATES.EXECUTING);
    action.status = ACTION_STATES.EXECUTING;
    action.executionStartedAt = new Date().toISOString();

    await actionAudit.logEvent({
      actionId: action.id,
      eventType: 'ACTION_EXECUTION_STARTED',
      merchantId: action.merchantId,
      actor: context.actor || { type: 'MERCHANT_USER', identifier: action.approvedBy || 'MERCHANT' },
      justification: 'Starting execution pipeline',
      metadata: { parameters: action.parameters }
    });

    let executionResult = null;
    let executionError = null;

    try {
      // 4. Dispatch to modular executor
      switch (action.type) {
        case ACTION_TYPES.CREATE_RESTOCK_RECOMMENDATION:
          executionResult = await restockExecutor.execute(action);
          break;

        case ACTION_TYPES.CREATE_BUSINESS_REPORT:
          executionResult = await reportExecutor.execute(action);
          break;

        case ACTION_TYPES.CREATE_NOTIFICATION_DRAFT:
          executionResult = await notificationExecutor.execute(action);
          break;

        case ACTION_TYPES.MARK_INSIGHT_REVIEWED:
        case ACTION_TYPES.DISMISS_INSIGHT:
          executionResult = await insightExecutor.execute(action);
          break;

        default:
          // Generic mock execution for higher-risk sandbox types
          executionResult = {
            success: true,
            actionId: action.id,
            executedAt: new Date().toISOString(),
            message: `Mock sandbox execution completed for ${action.type}.`
          };
      }

      // Transition EXECUTING -> EXECUTED
      stateMachine.assertTransition(action.id, action.status, ACTION_STATES.EXECUTED);
      action.status = ACTION_STATES.EXECUTED;
      action.executedAt = new Date().toISOString();
      action.executionResult = executionResult;

      await actionAudit.logEvent({
        actionId: action.id,
        eventType: 'ACTION_EXECUTED',
        merchantId: action.merchantId,
        metadata: { executionResult }
      });
    } catch (err) {
      executionError = err;
      action.status = ACTION_STATES.FAILED;
      action.failedAt = new Date().toISOString();
      action.failureReason = err.message;

      await actionAudit.logEvent({
        actionId: action.id,
        eventType: 'ACTION_FAILED',
        merchantId: action.merchantId,
        metadata: { error: err.message }
      });

      throw new Error(`Action execution failed: ${err.message}`);
    }

    // 5. Automated Post-Execution Verification
    stateMachine.assertTransition(action.id, action.status, ACTION_STATES.VERIFYING);
    action.status = ACTION_STATES.VERIFYING;

    await actionAudit.logEvent({
      actionId: action.id,
      eventType: 'ACTION_VERIFICATION_STARTED',
      merchantId: action.merchantId
    });

    const verificationResult = await actionVerifier.verifyAction(action, executionResult);
    action.verificationResult = verificationResult;

    if (verificationResult.passed) {
      stateMachine.assertTransition(action.id, action.status, ACTION_STATES.VERIFIED);
      action.status = ACTION_STATES.VERIFIED;
      action.verifiedAt = verificationResult.verifiedAt;

      await actionAudit.logEvent({
        actionId: action.id,
        eventType: 'ACTION_VERIFIED',
        merchantId: action.merchantId,
        metadata: { checks: verificationResult.checks }
      });
    } else {
      action.status = ACTION_STATES.VERIFICATION_FAILED;
      action.verificationFailedAt = new Date().toISOString();
      action.verificationFailureReason = verificationResult.failureReason;

      await actionAudit.logEvent({
        actionId: action.id,
        eventType: 'ACTION_VERIFICATION_FAILED',
        merchantId: action.merchantId,
        metadata: { failureReason: verificationResult.failureReason, checks: verificationResult.checks }
      });
    }

    return {
      actionId: action.id,
      status: action.status,
      result: executionResult,
      verification: verificationResult
    };
  }
}

module.exports = new ActionExecutor();
