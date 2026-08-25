/**
 * MITRA AI — Master AI Agent Facade
 */

const agent = require('./agent/agent');
const toolRegistry = require('./tools/toolRegistry');
const approvalManager = require('./actions/approvalManager');
const auditLogger = require('./actions/auditLogger');

module.exports = {
  agent,
  toolRegistry,
  approvalManager,
  auditLogger,
  chat: (params) => agent.processMessage(params),
  getProposals: () => approvalManager.getAllProposals(),
  approveAction: (id, actor, justification) => approvalManager.approveProposal(id, actor, justification),
  rejectAction: (id, actor, justification) => approvalManager.rejectProposal(id, actor, justification),
  getAuditLogs: (limit) => auditLogger.getRecentLogs(limit)
};
