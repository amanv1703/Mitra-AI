/**
 * MITRA AI — Insight Status Management Executor
 * 
 * Safely marks intelligence anomalies as reviewed or dismissed.
 */

const insightStateStore = new Map();

class InsightExecutor {
  async execute({ actionId, merchantId, type, parameters }) {
    const { insightId, notes = '', reason = '' } = parameters;
    const isDismiss = type === 'DISMISS_INSIGHT';
    const newStatus = isDismiss ? 'DISMISSED' : 'ACKNOWLEDGED';

    const updateRecord = {
      insightId,
      actionId,
      merchantId: Number(merchantId || 1),
      status: newStatus,
      notes: notes || reason,
      updatedAt: new Date().toISOString()
    };

    insightStateStore.set(insightId, updateRecord);

    return {
      insightId,
      newStatus,
      updateRecord,
      summary: `Insight '${insightId}' successfully updated to '${newStatus}'.`
    };
  }

  async getInsightState(insightId) {
    return insightStateStore.get(insightId) || null;
  }
}

module.exports = new InsightExecutor();
