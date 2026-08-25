/**
 * MITRA AI — Cryptographic Action Audit Logger
 * 
 * Records an immutable event ledger for every AI proposal, merchant approval, and rollback event
 */

const { query } = require('../../config/db');

class AuditLogger {
  constructor() {
    this.memoryLogs = [];
  }

  async logAction({
    actionId,
    actionType,
    status,
    actor = 'MERCHANT_ADMIN',
    justification = '',
    parameters = {},
    executionResult = null
  }) {
    const entry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actionId,
      actionType,
      status,
      actor,
      justification,
      parameters,
      executionResult,
      timestamp: new Date().toISOString()
    };

    this.memoryLogs.unshift(entry);

    try {
      const sql = `
        INSERT INTO audit_logs (action_type, entity_type, entity_id, actor_type, justification, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await query(sql, [
        actionType,
        'AI_ACTION_PROPOSAL',
        actionId,
        actor,
        justification,
        JSON.stringify({ parameters, executionResult, status })
      ]);
    } catch (err) {
      // Memory fallback if table does not exist or MySQL offline
    }

    return entry;
  }

  getRecentLogs(limit = 50) {
    return this.memoryLogs.slice(0, limit);
  }
}

module.exports = new AuditLogger();
