/**
 * MITRA AI — Action Finite State Machine
 * 
 * Enforces strict, deterministic lifecycle transitions. Arbitrary state jumps are strictly disallowed.
 */

const ACTION_STATES = {
  PROPOSED: 'PROPOSED',
  VALIDATING: 'VALIDATING',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXECUTING: 'EXECUTING',
  EXECUTED: 'EXECUTED',
  VERIFYING: 'VERIFYING',
  VERIFIED: 'VERIFIED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

const VALID_TRANSITIONS = {
  [ACTION_STATES.PROPOSED]: [
    ACTION_STATES.VALIDATING,
    ACTION_STATES.PENDING_APPROVAL,
    ACTION_STATES.APPROVED, // For low-risk auto-approved actions
    ACTION_STATES.CANCELLED
  ],
  [ACTION_STATES.VALIDATING]: [
    ACTION_STATES.PENDING_APPROVAL,
    ACTION_STATES.APPROVED,
    ACTION_STATES.FAILED
  ],
  [ACTION_STATES.PENDING_APPROVAL]: [
    ACTION_STATES.APPROVED,
    ACTION_STATES.REJECTED,
    ACTION_STATES.EXPIRED,
    ACTION_STATES.CANCELLED
  ],
  [ACTION_STATES.APPROVED]: [
    ACTION_STATES.EXECUTING,
    ACTION_STATES.CANCELLED,
    ACTION_STATES.EXPIRED
  ],
  [ACTION_STATES.EXECUTING]: [
    ACTION_STATES.EXECUTED,
    ACTION_STATES.FAILED
  ],
  [ACTION_STATES.EXECUTED]: [
    ACTION_STATES.VERIFYING,
    ACTION_STATES.VERIFIED,
    ACTION_STATES.VERIFICATION_FAILED
  ],
  [ACTION_STATES.VERIFYING]: [
    ACTION_STATES.VERIFIED,
    ACTION_STATES.VERIFICATION_FAILED
  ],
  // Terminal states (no transitions permitted)
  [ACTION_STATES.VERIFIED]: [],
  [ACTION_STATES.REJECTED]: [],
  [ACTION_STATES.FAILED]: [],
  [ACTION_STATES.VERIFICATION_FAILED]: [],
  [ACTION_STATES.EXPIRED]: [],
  [ACTION_STATES.CANCELLED]: []
};

class ActionStateMachine {
  /**
   * Checks if a transition from currentState to targetState is mathematically valid
   */
  canTransition(currentState, targetState) {
    if (!ACTION_STATES[currentState] || !ACTION_STATES[targetState]) {
      return false;
    }
    const allowed = VALID_TRANSITIONS[currentState] || [];
    return allowed.includes(targetState);
  }

  /**
   * Asserts that a state transition is valid or throws an error
   */
  assertTransition(actionId, currentState, targetState) {
    if (!this.canTransition(currentState, targetState)) {
      const error = new Error(
        `Illegal State Machine Transition: Action '${actionId}' cannot transition from '${currentState}' to '${targetState}'. Allowed transitions: [${(VALID_TRANSITIONS[currentState] || []).join(', ')}]`
      );
      error.statusCode = 400;
      error.code = 'ILLEGAL_STATE_TRANSITION';
      throw error;
    }
    return true;
  }
}

module.exports = {
  ACTION_STATES,
  VALID_TRANSITIONS,
  stateMachine: new ActionStateMachine()
};
