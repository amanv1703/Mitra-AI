/**
 * MITRA AI — Master Business Intelligence & Reasoning Engine
 * 
 * Exports the complete intelligence pipeline modules and single-call analysis executor
 */

const insightEngine = require('./insights/insightEngine');
const riskScoring = require('./risk/riskScoring');
const businessHealthScore = require('./risk/businessHealthScore');
const rootCauseEngine = require('./rootCause/rootCauseEngine');
const correlationEngine = require('./correlation/correlationEngine');
const revenueImpact = require('./impact/revenueImpact');
const baselineEngine = require('./baselines/baselineEngine');
const anomalyEngine = require('./anomalies/anomalyEngine');

// Domain metrics
const salesMetrics = require('./metrics/salesMetrics');
const paymentMetrics = require('./metrics/paymentMetrics');
const inventoryMetrics = require('./metrics/inventoryMetrics');
const refundMetrics = require('./metrics/refundMetrics');
const customerMetrics = require('./metrics/customerMetrics');
const deliveryMetrics = require('./metrics/deliveryMetrics');

class IntelligenceFacade {
  async runAnalysis(fromSql, toSql) {
    return await insightEngine.runIntelligenceAnalysis(fromSql, toSql);
  }

  async getOverview(fromSql, toSql) {
    const analysis = await insightEngine.runIntelligenceAnalysis(fromSql, toSql);
    return {
      runContext: analysis.runContext,
      businessHealth: analysis.health,
      domainRisks: analysis.domainRisks,
      revenueAtRisk: analysis.impact.revenueAtRisk,
      activeAnomaliesCount: analysis.anomalies.length,
      insightsCount: analysis.insights.length,
      topInsights: analysis.insights.slice(0, 3)
    };
  }

  async getInsights(fromSql, toSql, filters = {}) {
    const analysis = await insightEngine.runIntelligenceAnalysis(fromSql, toSql);
    let list = analysis.insights;

    if (filters.severity) {
      list = list.filter(i => i.severity === filters.severity);
    }
    if (filters.category) {
      list = list.filter(i => i.category === filters.category);
    }
    if (filters.type) {
      list = list.filter(i => i.type === filters.type);
    }

    return {
      total: list.length,
      insights: list
    };
  }

  async getInsightById(id) {
    const analysis = await insightEngine.runIntelligenceAnalysis();
    const insight = analysis.insights.find(i => i.id === id || i.fingerprint === id);
    return insight || null;
  }

  async getAnomalies(fromSql, toSql) {
    const analysis = await insightEngine.runIntelligenceAnalysis(fromSql, toSql);
    return {
      totalAnomalies: analysis.anomalies.length,
      anomalies: analysis.anomalies
    };
  }

  async getRisks(fromSql, toSql) {
    const analysis = await insightEngine.runIntelligenceAnalysis(fromSql, toSql);
    return analysis.domainRisks;
  }

  async getBusinessHealth(fromSql, toSql) {
    const analysis = await insightEngine.runIntelligenceAnalysis(fromSql, toSql);
    return analysis.health;
  }
}

module.exports = new IntelligenceFacade();
