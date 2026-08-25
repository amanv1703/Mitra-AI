/**
 * MITRA AI — Comprehensive Action Audit Event Ledger
 * 
 * Records an immutable event stream for every state transition in the action lifecycle.
 */

const { query } = require('../config/db');

const memoryActionEvents = [];

class ActionAudit {
  /**
   * Records a granular lifecycle event for an action
   * @param {Object} params
   * @param {string} params.actionId The ID of the action
   * @param {string} params.eventType e.g. ACTION_PROPOSED, ACTION_APPROVED, ACTION_VERIFIED
   * @param {number} params.merchantId Tenant ID
   * @param {Object} params.actor { type: 'MERCHANT_USER' | 'AI_AGENT' | 'SYSTEM', identifier: string }
   * @param {string} params.justification Optional reasoning
   * @param {Object} params.metadata Any parameters, deltas, or verification receipts
   */
  async logEvent({
    actionId,
    eventType,
    merchantId = 1,
    actor = { type: 'SYSTEM', identifier: 'MITRA_ACTION_ENGINE' },
    justification = '',
    metadata = {}
  }) {
    const event = {
      eventId: `EVT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actionId,
      eventType,
      merchantId: Number(merchantId),
      actorType: actor.type || 'SYSTEM',
      actorIdentifier: actor.identifier || 'SYSTEM',
      justification,
      metadata,
      timestamp: new Date().toISOString()
    };

    memoryActionEvents.unshift(event);

    try {
      const sql = `
        INSERT INTO audit_logs (merchant_id, actor_type, actor_identifier, action_name, entity_name, entity_id, notes, new_values)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await query(sql, [
        event.merchantId,
        event.actorType,
        event.actorIdentifier,
        event.eventType,
        'ai_actions',
        event.actionId,
        justification.slice(0, 250),
        JSON.stringify(metadata)
      ]);
    } catch (err) {
      // Fallback in-memory ledger if database table offline
    }

    return event;
  }

  /**
   * Retrieves the complete timeline events for a specific action ID
   */
  getActionTimeline(actionId) {
    return memoryActionEvents
      .filter(e => e.actionId === actionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Retrieves all action events across the tenant
   */
  getAllEvents(merchantId = 1, limit = 50) {
    return memoryActionEvents
      .filter(e => Number(e.merchantId) === Number(merchantId))
      .slice(0, limit);
  }
}

module.exports = new ActionAudit();
