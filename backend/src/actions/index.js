/**
 * MITRA AI — Master Action Orchestration Facade
 */

const { ACTION_TYPES, RISK_TIERS, ACTION_DEFINITIONS, getActionDefinition, getAllActionDefinitions } = require('./actionRegistry');
const { ACTION_STATES, VALID_TRANSITIONS, stateMachine } = require('./actionStateMachine');
const actionRisk = require('./actionRisk');
const actionPolicy = require('./actionPolicy');
const actionValidator = require('./actionValidator');
const actionPlanner = require('./actionPlanner');
const actionExecutor = require('./actionExecutor');
const actionVerifier = require('./actionVerifier');
const actionAudit = require('./actionAudit');

module.exports = {
  ACTION_TYPES,
  RISK_TIERS,
  ACTION_DEFINITIONS,
  ACTION_STATES,
  VALID_TRANSITIONS,
  stateMachine,
  actionRisk,
  actionPolicy,
  actionValidator,
  actionPlanner,
  actionExecutor,
  actionVerifier,
  actionAudit,
  getActionDefinition,
  getAllActionDefinitions,

  // Convenience delegates
  proposeAction: (input, context) => actionPlanner.proposeAction(input, context),
  approveAction: (id, actor, justification) => actionPlanner.approveAction(id, actor, justification),
  rejectAction: (id, actor, justification) => actionPlanner.rejectAction(id, actor, justification),
  executeAction: (id, context) => actionPlanner.executeAction(id, context),
  cancelAction: (id, actor, reason) => actionPlanner.cancelAction(id, actor, reason),
  getActions: (filter) => actionPlanner.getActions(filter),
  getActionById: (id, merchantId) => actionPlanner.getActionById(id, merchantId),
  getActionTimeline: (id) => actionAudit.getActionTimeline(id)
};
