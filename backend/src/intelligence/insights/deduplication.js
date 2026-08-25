/**
 * MITRA AI — Insight Deduplication & Lifecycle Manager
 */

class DeduplicationManager {
  constructor() {
    this.seenFingerprints = new Map();
  }

  deduplicate(insights = []) {
    const unique = [];
    const seen = new Set();

    for (const item of insights) {
      const fp = item.fingerprint || item.id;
      if (!seen.has(fp)) {
        seen.add(fp);
        unique.push(item);
      }
    }

    return unique;
  }
}

class InsightLifecycle {
  resolveStatus(insight, isAnomalyStillActive = true) {
    if (!isAnomalyStillActive) {
      return {
        ...insight,
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString()
      };
    }
    return insight;
  }
}

module.exports = {
  deduplicationManager: new DeduplicationManager(),
  insightLifecycle: new InsightLifecycle()
};
