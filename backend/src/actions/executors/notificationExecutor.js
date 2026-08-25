/**
 * MITRA AI — Notification Draft Executor
 * 
 * Prepares safe notification drafts without auto-sending external communications.
 */

const notificationDraftsStore = new Map();

class NotificationExecutor {
  async execute({ actionId, merchantId, parameters }) {
    const {
      channel = 'EMAIL',
      targetAudience = 'VIP_FRICTION_COHORT',
      messageBody,
      discountCreditPct = 5.0,
      priority = 'NORMAL'
    } = parameters;

    const draftId = `DRAFT-NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const draft = {
      draftId,
      actionId,
      merchantId: Number(merchantId || 1),
      channel,
      targetAudience,
      messageBody,
      discountCreditPct,
      priority,
      status: 'DRAFT_READY_FOR_REVIEW',
      dispatched: false,
      createdAt: new Date().toISOString()
    };

    notificationDraftsStore.set(draftId, draft);

    return {
      draftId,
      draft,
      summary: `Notification draft created for ${targetAudience} via ${channel}. External dispatch is held pending manual merchant send approval.`
    };
  }

  async getDraft(draftId) {
    return notificationDraftsStore.get(draftId) || null;
  }
}

module.exports = new NotificationExecutor();
