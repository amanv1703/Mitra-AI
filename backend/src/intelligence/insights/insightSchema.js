/**
 * MITRA AI — Structured Insight Schema & Validator
 */

const crypto = require('crypto');

class InsightSchema {
  createInsight({
    id,
    type,
    category,
    severity,
    title,
    summary,
    detectedAt = new Date().toISOString(),
    timeRange = {},
    affectedEntities = [],
    metrics = {},
    evidence = [],
    baseline = 0,
    currentValue = 0,
    deviation = 0,
    changeFactor = 1,
    rootCauseCandidates = [],
    impact = {},
    risk = {},
    recommendations = [],
    confidence = 0.90,
    status = 'ACTIVE'
  }) {
    const fingerprint = this.generateFingerprint(type, affectedEntities, timeRange);

    return {
      id: id || `INSIGHT-${fingerprint.slice(0, 10).toUpperCase()}`,
      fingerprint,
      type,
      category,
      severity,
      title,
      summary,
      detectedAt,
      timeRange,
      affectedEntities,
      metrics,
      evidence,
      baseline,
      currentValue,
      deviation,
      changeFactor,
      rootCauseCandidates,
      impact,
      risk,
      recommendations,
      confidence,
      status
    };
  }

  generateFingerprint(type, affectedEntities = [], timeRange = {}) {
    const entityKey = affectedEntities.map(e => `${e.type || 'E'}:${e.id || e.sku || e.city}`).sort().join('|');
    const rangeKey = `${timeRange.from || 'ALL'}_${timeRange.to || 'ALL'}`;
    const raw = `${type}::${entityKey}::${rangeKey}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}

module.exports = new InsightSchema();
