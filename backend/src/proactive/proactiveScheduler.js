/**
 * MITRA AI — Proactive Intelligence Scheduler
 * 
 * Manages reliable scheduled execution of:
 * - RISK_SCAN (Continuous anomaly & friction scan)
 * - OPPORTUNITY_SCAN (Growth & product demand scan)
 * - DAILY_BRIEF (Executive operational brief)
 * - OUTCOME_CHECK (Post-action outcome evaluation)
 */

const { proactiveJob, JOB_TYPES } = require('./proactiveJob');
const proactiveRunStore = require('./proactiveRunStore');

class ProactiveScheduler {
  constructor() {
    this.isRunning = false;
    this.timers = new Map();
    this.activeMerchants = [1]; // List of active tenant IDs

    // Configurable intervals with safe production/demo defaults
    this.intervals = {
      [JOB_TYPES.RISK_SCAN]: Number(process.env.PROACTIVE_SCAN_INTERVAL_MS) || (process.env.NODE_ENV === 'test' ? 60000 : 300000), // 5 min
      [JOB_TYPES.OPPORTUNITY_SCAN]: Number(process.env.OPPORTUNITY_SCAN_INTERVAL_MS) || 600000, // 10 min
      [JOB_TYPES.DAILY_BRIEF]: Number(process.env.DAILY_BRIEF_INTERVAL_MS) || 86400000, // 24 hours
      [JOB_TYPES.OUTCOME_CHECK]: Number(process.env.OUTCOME_CHECK_INTERVAL_MS) || 600000 // 10 min
    };
  }

  /**
   * Starts the proactive scheduler and triggers an initial scan
   */
  start({ runInitialScan = true } = {}) {
    if (this.isRunning) {
      console.log('⚠️ ProactiveScheduler is already running.');
      return;
    }

    this.isRunning = true;
    console.log('=============================================================================');
    console.log('⏰ MITRA AI Proactive Intelligence Scheduler Started');
    console.log(`📡 Scan Interval: ${this.intervals[JOB_TYPES.RISK_SCAN] / 1000}s | Active Tenants: [${this.activeMerchants.join(', ')}]`);
    console.log('=============================================================================');

    // Register interval timers for each job type
    Object.keys(this.intervals).forEach(jobType => {
      const intervalMs = this.intervals[jobType];
      const timerId = setInterval(async () => {
        await this.runJobAcrossTenants(jobType);
      }, intervalMs);

      // Allow process to exit cleanly if timer is only active handle
      if (timerId.unref) timerId.unref();
      this.timers.set(jobType, timerId);
    });

    // Run initial scan immediately if requested and not in test
    if (runInitialScan && process.env.NODE_ENV !== 'test') {
      this.runJobAcrossTenants(JOB_TYPES.RISK_SCAN).catch(err => {
        console.error('Initial proactive scan error:', err.message);
      });
    }
  }

  /**
   * Stops the proactive scheduler and clears all timers
   */
  stop() {
    if (!this.isRunning) return;

    this.timers.forEach((timerId) => {
      clearInterval(timerId);
    });
    this.timers.clear();
    this.isRunning = false;
    console.log('🛑 MITRA AI Proactive Intelligence Scheduler Stopped.');
  }

  /**
   * Executes a specific job across all active merchant tenants with fault isolation
   */
  async runJobAcrossTenants(jobType) {
    const results = [];

    for (const merchantId of this.activeMerchants) {
      try {
        const result = await proactiveJob.execute({ jobType, merchantId });
        results.push(result);
      } catch (err) {
        // Fault isolation: one tenant error does NOT crash other tenants or the scheduler
        console.error(`❌ Proactive Job [${jobType}] failed for tenant ${merchantId}:`, err.message);
        results.push({
          success: false,
          jobType,
          merchantId,
          error: err.message
        });
      }
    }

    return results;
  }

  /**
   * Manual trigger endpoint for Buildathon demo or API invocations
   */
  async triggerManualRun({ jobType = JOB_TYPES.RISK_SCAN, merchantId = 1 } = {}) {
    return await proactiveJob.execute({ jobType, merchantId });
  }

  /**
   * Returns current scheduler health and telemetry
   */
  getStatus(merchantId = 1) {
    return {
      status: this.isRunning ? 'RUNNING' : 'STOPPED',
      isRunning: this.isRunning,
      intervals: this.intervals,
      activeMerchants: this.activeMerchants,
      activeTimers: Array.from(this.timers.keys()),
      stats: proactiveRunStore.getStats(merchantId)
    };
  }

  /**
   * Registers a new tenant merchant ID
   */
  registerMerchant(merchantId) {
    const mId = Number(merchantId);
    if (!this.activeMerchants.includes(mId)) {
      this.activeMerchants.push(mId);
    }
  }
}

module.exports = {
  ProactiveScheduler,
  proactiveScheduler: new ProactiveScheduler(),
  JOB_TYPES
};
