/**
 * MITRA AI — Proactive Run Store & Ledger
 * 
 * Tracks the execution history, metrics, and outcomes of all scheduled proactive jobs.
 */

const { query } = require('../config/db');

class ProactiveRunStore {
  constructor() {
    this.runs = [];
    this.maxRunsInMemory = 200;
    this.alerts = new Map(); // Keyed by fingerprint
  }

  recordRunStart({ runId, jobType, merchantId }) {
    const record = {
      runId: runId || `RUN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      jobType,
      merchantId: Number(merchantId || 1),
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      endTime: null,
      durationMs: null,
      alertsCreated: 0,
      alertsUpdated: 0,
      alertsDeduplicated: 0,
      error: null,
      summary: null
    };

    this.runs.unshift(record);
    if (this.runs.length > this.maxRunsInMemory) {
      this.runs.pop();
    }

    return record;
  }

  recordRunComplete(runId, { alertsCreated = 0, alertsUpdated = 0, alertsDeduplicated = 0, summary = '' }) {
    const record = this.runs.find(r => r.runId === runId);
    if (record) {
      record.status = 'COMPLETED';
      record.endTime = new Date().toISOString();
      record.durationMs = Date.now() - new Date(record.startTime).getTime();
      record.alertsCreated = alertsCreated;
      record.alertsUpdated = alertsUpdated;
      record.alertsDeduplicated = alertsDeduplicated;
      record.summary = summary;
    }
    return record;
  }

  recordRunFailure(runId, error) {
    const record = this.runs.find(r => r.runId === runId);
    if (record) {
      record.status = 'FAILED';
      record.endTime = new Date().toISOString();
      record.durationMs = Date.now() - new Date(record.startTime).getTime();
      record.error = error?.message || String(error);
    }
    return record;
  }

  saveAlert(alert) {
    if (!alert || !alert.fingerprint) return null;
    const existing = this.alerts.get(alert.fingerprint);
    if (existing) {
      // Update existing alert
      const updated = {
        ...existing,
        ...alert,
        occurrences: (existing.occurrences || 1) + 1,
        lastDetectedAt: new Date().toISOString()
      };
      this.alerts.set(alert.fingerprint, updated);
      return { alert: updated, isNew: false };
    } else {
      const newAlert = {
        ...alert,
        occurrences: 1,
        firstDetectedAt: new Date().toISOString(),
        lastDetectedAt: new Date().toISOString(),
        status: 'ACTIVE'
      };
      this.alerts.set(alert.fingerprint, newAlert);
      return { alert: newAlert, isNew: true };
    }
  }

  getAlerts({ merchantId = 1, status, severity, domain } = {}) {
    let list = Array.from(this.alerts.values()).filter(a => Number(a.merchantId) === Number(merchantId));
    if (status) list = list.filter(a => a.status === status);
    if (severity) list = list.filter(a => a.severity === severity);
    if (domain) list = list.filter(a => a.domain === domain);
    return list.sort((a, b) => new Date(b.lastDetectedAt) - new Date(a.lastDetectedAt));
  }

  getStats(merchantId = 1) {
    const tenantRuns = this.runs.filter(r => Number(r.merchantId) === Number(merchantId));
    const totalRuns = tenantRuns.length;
    const successfulRuns = tenantRuns.filter(r => r.status === 'COMPLETED').length;
    const failedRuns = tenantRuns.filter(r => r.status === 'FAILED').length;
    const tenantAlerts = this.getAlerts({ merchantId });

    return {
      merchantId: Number(merchantId),
      totalRuns,
      successfulRuns,
      failedRuns,
      successRatePct: totalRuns > 0 ? Number(((successfulRuns / totalRuns) * 100).toFixed(1)) : 100.0,
      activeAlertsCount: tenantAlerts.filter(a => a.status === 'ACTIVE').length,
      totalAlertsTracked: tenantAlerts.length,
      lastSuccessfulRun: tenantRuns.find(r => r.status === 'COMPLETED') || null,
      lastFailedRun: tenantRuns.find(r => r.status === 'FAILED') || null,
      recentRuns: tenantRuns.slice(0, 10)
    };
  }

  clear() {
    this.runs = [];
    this.alerts.clear();
  }
}

module.exports = new ProactiveRunStore();
