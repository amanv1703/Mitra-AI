import React, { useState } from 'react';
import {
  Sparkles,
  AlertOctagon,
  Package,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  SlidersHorizontal,
  Bot,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';

import { useIntelligence } from '../hooks/useIntelligence';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/formatters';

import StatusBadge, { SeverityBadge } from '../components/common/StatusBadge';
import DetailDrawer from '../components/common/DetailDrawer';
import ErrorState from '../components/common/ErrorState';

export function DetectedSignals() {
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [selectedInsight, setSelectedInsight] = useState(null);

  const { insights, businessHealth, domainRisks, loading, error, refetch } = useIntelligence();

  const filteredInsights = insights.filter(i => {
    if (domainFilter === 'ALL') return true;
    return i.category === domainFilter || i.type.includes(domainFilter);
  });

  if (error) {
    return <ErrorState title="Failed to load intelligence insights" message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">Business Intelligence & Reasoning Center</h1>
        </div>
        <p className="text-xs text-surface-500">
          Deterministic statistical baseline deviations, cross-domain event correlations & scored root-cause diagnostics
        </p>
      </div>

      {/* 2. System Status Bar */}
      <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
          <span className="font-semibold text-surface-900">
            {insights.length} High-Confidence Structured Insights Diagnosed across 6 Telemetry Vectors
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-50 text-brand-700 border border-brand-200">
            Health Score: {businessHealth?.overallScore || 63}/100
          </span>
        </div>
      </div>

      {/* 3. Domain Filter Tabs */}
      <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg self-start overflow-x-auto">
        {['ALL', 'PAYMENTS', 'INVENTORY', 'REFUNDS', 'LOGISTICS', 'CUSTOMERS'].map((dom) => (
          <button
            key={dom}
            onClick={() => setDomainFilter(dom)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors shrink-0 ${
              domainFilter === dom
                ? 'bg-white text-surface-900 shadow-sm font-semibold'
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            {dom === 'ALL' ? 'All Domains' : dom.toLowerCase()}
          </button>
        ))}
      </div>

      {/* 4. Structured Insights List */}
      {loading ? (
        <div className="space-y-4">
          <div className="card-clean p-6 h-48 animate-pulse bg-surface-100/50"></div>
          <div className="card-clean p-6 h-48 animate-pulse bg-surface-100/50"></div>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="card-clean p-12 text-center text-surface-500 text-xs">
          No active anomalies diagnosed for the selected domain filter. All business parameters operating within healthy bounds.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className="card-clean p-6 hover:shadow-md transition-shadow border-l-4 border-l-brand-600 space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-surface-100">
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={insight.severity} />
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-surface-400 uppercase tracking-wider block">
                      {insight.category} • {insight.id}
                    </span>
                    <h3 className="text-base font-bold text-surface-900">{insight.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-surface-400 font-semibold uppercase block">Diagnostic Confidence</span>
                    <span className="text-xs font-bold text-emerald-600 font-sans">
                      {(insight.confidence * 100).toFixed(0)}% (Deterministic)
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedInsight(insight)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <span>View Evidence Graph</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3-Column Structured Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
                {/* Column 1: WHAT HAPPENED & EVIDENCE */}
                <div className="space-y-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div>
                    <span className="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">
                      1. What Happened
                    </span>
                    <p className="text-surface-700 leading-relaxed font-medium">
                      {insight.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-surface-200">
                    <span className="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1.5">
                      Telemetry Evidence
                    </span>
                    <ul className="space-y-1 text-surface-600">
                      {insight.evidence?.map((e, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-brand-600 font-bold">•</span>
                          <span>
                            {e.metric ? `${e.metric}: ${e.current || e.value || e.count}` : JSON.stringify(e)}
                            {e.changeFactor && ` (${e.changeFactor}x over baseline)`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Column 2: LIKELY ROOT CAUSES */}
                <div className="space-y-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
                  <div>
                    <span className="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">
                      2. Likely Root Cause Candidate
                    </span>
                    {insight.rootCauseCandidates?.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-surface-900">
                            {insight.rootCauseCandidates[0].cause.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                            Score: {insight.rootCauseCandidates[0].score}/100
                          </span>
                        </div>
                        <ul className="space-y-1 text-surface-600 pt-1">
                          {insight.rootCauseCandidates[0].evidence?.map((line, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <span className="text-surface-500">Evaluating root cause candidates...</span>
                    )}
                  </div>
                </div>

                {/* Column 3: IMPACT & RECOMMENDED NEXT STEP */}
                <div className="space-y-3 p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">
                      3. Business Impact
                    </span>
                    <div className="p-3 rounded-lg bg-white border border-surface-200">
                      <span className="text-[10px] text-surface-400 uppercase font-semibold block">
                        {insight.impact?.category || 'CONFIRMED'} Impact
                      </span>
                      <span className="text-base font-extrabold text-red-600 font-sans mt-0.5 block">
                        {formatCurrency(
                          insight.impact?.confirmedLostRevenue ||
                          insight.impact?.estimatedLostRevenue ||
                          insight.impact?.estimatedAbnormalRefunds ||
                          insight.impact?.supplierWarrantyClaims ||
                          insight.impact?.quarterlyRecurringRevenueAtRisk ||
                          0
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-surface-200">
                    <span className="text-[11px] font-bold text-surface-400 uppercase tracking-wider block mb-1">
                      Recommended Next Step
                    </span>
                    <p className="text-surface-800 font-medium text-[11px]">
                      {insight.recommendations?.[0]?.description || 'Investigate operational telemetry and adjust safety buffers.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedInsight)}
        onClose={() => setSelectedInsight(null)}
        title={selectedInsight?.title || 'Insight Diagnostic Evidence'}
        subtitle={`ID: ${selectedInsight?.id} | ${selectedInsight?.category}`}
        badge={<SeverityBadge severity={selectedInsight?.severity} />}
      >
        {selectedInsight && (
          <div className="space-y-6 text-xs">
            {/* Overview */}
            <div>
              <h4 className="font-semibold text-surface-900 mb-1">Diagnostic Narrative</h4>
              <p className="text-surface-600 leading-relaxed bg-surface-50 p-3 rounded-lg border border-surface-200">
                {selectedInsight.summary}
              </p>
            </div>

            {/* Scored Root Causes */}
            {selectedInsight.rootCauseCandidates?.length > 0 && (
              <div>
                <h4 className="font-semibold text-surface-900 mb-2">Ranked Root Cause Candidates (0-100 Transparent Model)</h4>
                <div className="space-y-3">
                  {selectedInsight.rootCauseCandidates.map((c, i) => (
                    <div key={i} className="p-4 rounded-xl border border-surface-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-surface-900">{c.cause.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                          Total Score: {c.score}/100
                        </span>
                      </div>

                      {c.scoringBreakdown && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-center pt-2 border-t border-surface-100">
                          <div className="p-2 bg-surface-50 rounded-md">
                            <span className="text-surface-400 block">Temporal</span>
                            <span className="font-bold text-surface-800">{c.scoringBreakdown.temporalProximity}/25</span>
                          </div>
                          <div className="p-2 bg-surface-50 rounded-md">
                            <span className="text-surface-400 block">Magnitude</span>
                            <span className="font-bold text-surface-800">{c.scoringBreakdown.magnitudeCorrelation}/25</span>
                          </div>
                          <div className="p-2 bg-surface-50 rounded-md">
                            <span className="text-surface-400 block">Overlap</span>
                            <span className="font-bold text-surface-800">{c.scoringBreakdown.entityOverlap}/25</span>
                          </div>
                          <div className="p-2 bg-surface-50 rounded-md">
                            <span className="text-surface-400 block">Consistency</span>
                            <span className="font-bold text-surface-800">{c.scoringBreakdown.historicalConsistency}/25</span>
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-surface-600 pt-1">
                        <span className="font-semibold block text-surface-900 mb-1">Recommended Investigation:</span>
                        <p className="bg-surface-50 p-2.5 rounded-lg border border-surface-200">{c.investigationRecommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Risk Details */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <span className="font-bold block">Financial Exposure Quantification</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Calculated directly from transactional records and lead-time shortfall projections. In Phase 4, the autonomous action engine will enforce policy tier thresholds before executing interventions.
              </p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

export default DetectedSignals;
