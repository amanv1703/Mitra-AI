import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Truck,
  Activity,
  CheckCircle2,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

import { useDashboard } from '../hooks/useDashboard';
import { useAnalytics } from '../hooks/useAnalytics';
import { useDetections } from '../hooks/useDetections';
import { useIntelligence } from '../hooks/useIntelligence';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

import StatCard from '../components/common/StatCard';
import StatusBadge, { SeverityBadge } from '../components/common/StatusBadge';
import SignalCard from '../components/common/SignalCard';
import DetailDrawer, { HealthIndicator } from '../components/common/DetailDrawer';
import { StatCardSkeleton, ChartSkeleton } from '../components/common/SkeletonLoader';
import ErrorState from '../components/common/ErrorState';

export function Dashboard() {
  const navigate = useNavigate();
  const [timeGrain, setTimeGrain] = useState('day');
  const [selectedSignal, setSelectedSignal] = useState(null);

  const { dashboard, loading: dashLoading, error: dashError, refetch: refetchDash } = useDashboard();
  const { sales, loading: analyticsLoading } = useAnalytics(timeGrain);
  const { detections, loading: detectLoading } = useDetections();
  const { businessHealth, domainRisks, insights, loading: intelLoading } = useIntelligence();

  const loading = dashLoading || analyticsLoading || detectLoading || intelLoading;

  if (dashError) {
    return <ErrorState title="Failed to load dashboard" message={dashError} onRetry={refetchDash} />;
  }

  const activeSignals = detections.filter(d => d.detected);

  return (
    <div className="space-y-8">
      {/* 1. Page Title & Revenue at Risk Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">Business Operations Overview</h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Real-time multi-channel telemetry, automated baseline tracking & deterministic reasoning
          </p>
        </div>

        {dashboard?.revenueAtRisk && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-red-50/70 border border-red-200 text-red-900 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-700 block">Total Revenue at Risk</span>
              <span className="text-sm font-bold font-sans">
                {formatCurrency(dashboard.revenueAtRisk.total)}
              </span>
            </div>
            <div className="h-6 w-px bg-red-200 mx-1 hidden sm:block"></div>
            <div className="text-[11px] text-red-600 hidden sm:block">
              Confirmed: {formatCurrency(dashboard.revenueAtRisk.confirmed, true)} | Stockout Gap: {formatCurrency(dashboard.revenueAtRisk.estimated, true)}
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Metric Cards */}
      {loading && !dashboard ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Gross Revenue"
            value={formatCurrency(dashboard?.overview?.totalSales || 0)}
            change={dashboard?.overview?.growth?.salesGrowthPct}
            icon={IndianRupee}
            iconBg="bg-emerald-50 text-emerald-600"
            subtitle={`${formatNumber(dashboard?.overview?.totalOrders || 0)} orders completed`}
          />
          <StatCard
            title="Total Orders"
            value={formatNumber(dashboard?.overview?.totalOrders || 0)}
            change={dashboard?.overview?.growth?.ordersGrowthPct}
            icon={ShoppingBag}
            iconBg="bg-blue-50 text-blue-600"
            subtitle={`${dashboard?.overview?.pendingOrders || 0} pending fulfillment`}
          />
          <StatCard
            title="Average Order Value"
            value={formatCurrency(dashboard?.overview?.averageOrderValue || 0)}
            icon={TrendingUp}
            iconBg="bg-indigo-50 text-indigo-600"
            subtitle="Calculated across delivered checkouts"
          />
          <StatCard
            title="Payment Failure Rate"
            value={formatPercent(dashboard?.payments?.failureRatePct || 0)}
            inverseChange={true}
            icon={CreditCard}
            iconBg={dashboard?.payments?.failureRatePct > 10 ? 'bg-red-50 text-red-600' : 'bg-surface-100 text-surface-600'}
            subtitle={dashboard?.payments?.failureRatePct > 10 ? '⚠️ High gateway timeout spike' : 'Operating within normal SLA'}
          />
        </div>
      )}

      {/* 3. Live Business Health Score & Risk Matrix (Phase 3 Intelligence) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1/3: Business Health Meter */}
        <div className="card-clean p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-surface-900">Business Health Score</h3>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 uppercase">
              Deterministic 0-100
            </span>
          </div>

          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={businessHealth?.overallScore >= 75 ? 'text-emerald-500' : businessHealth?.overallScore >= 60 ? 'text-amber-500' : 'text-red-500'}
                  strokeDasharray={`${businessHealth?.overallScore || 63}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-surface-900 font-sans tracking-tight">
                  {businessHealth?.overallScore || 63}
                </span>
                <span className="text-[9px] text-surface-400 font-semibold uppercase">out of 100</span>
              </div>
            </div>

            <div className="mt-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                businessHealth?.overallScore >= 75
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : businessHealth?.overallScore >= 60
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {businessHealth?.statusLabel || 'Friction Detected'}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-100 text-xs space-y-1.5">
            {businessHealth?.topNegativeFactors?.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-red-700 text-[11px]">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2/3: 5-Domain Risk Meter Matrix */}
        <div className="card-clean p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <h3 className="text-sm font-bold text-surface-900">5-Domain Operational Friction Breakdown</h3>
            <span className="text-xs text-surface-500">Lower risk score is healthier</span>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {domainRisks && Object.values(domainRisks).map((dom) => (
              <div key={dom.domain} className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-surface-900">{dom.domain}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    dom.score <= 20 ? 'bg-emerald-100 text-emerald-800' :
                    dom.score <= 40 ? 'bg-blue-100 text-blue-800' :
                    dom.score <= 60 ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Risk: {dom.score}/100 ({dom.label})
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      dom.score <= 20 ? 'bg-emerald-500' :
                      dom.score <= 40 ? 'bg-blue-500' :
                      dom.score <= 60 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${dom.score}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-surface-600 line-clamp-1">{dom.primaryDriver}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Active Detected Signals Banner */}
      {activeSignals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <h2 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                Needs Immediate Attention ({activeSignals.length} Active Anomalies)
              </h2>
            </div>
            <button
              onClick={() => navigate('/insights')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
            >
              <span>View Reasoning Evidence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSignals.slice(0, 3).map((sig, idx) => (
              <SignalCard
                key={sig.type || idx}
                signal={sig}
                onViewDetails={(s) => setSelectedSignal(s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Sales Performance Area Chart */}
      <div className="card-clean p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-surface-100">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Gross Revenue & Order Velocity</h3>
            <p className="text-xs text-surface-500">Historical performance across the selected window</p>
          </div>

          <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg self-start">
            {['day', 'week', 'month'].map((grain) => (
              <button
                key={grain}
                onClick={() => setTimeGrain(grain)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  timeGrain === grain
                    ? 'bg-white text-surface-900 shadow-sm font-semibold'
                    : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                {grain}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 h-72">
          {loading && !sales ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => val ? val.slice(5) : ''}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-surface-200 text-xs space-y-1">
                          <span className="font-semibold text-surface-900 block">{d.date}</span>
                          <span className="text-brand-600 font-bold block">{formatCurrency(d.revenue)}</span>
                          <span className="text-surface-500 block">{d.orders} orders (AOV: {formatCurrency(d.aov)})</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 6. Detail Drawer for Signal Inspection */}
      <DetailDrawer
        isOpen={Boolean(selectedSignal)}
        onClose={() => setSelectedSignal(null)}
        title={selectedSignal?.title || 'Signal Details'}
        subtitle={`Domain: ${selectedSignal?.domain} | Deterministic Engine`}
        badge={<SeverityBadge severity={selectedSignal?.severity} />}
      >
        {selectedSignal && (
          <div className="space-y-6 text-xs">
            <div>
              <h4 className="font-semibold text-surface-900 mb-1">Diagnostic Summary</h4>
              <p className="text-surface-600 leading-relaxed bg-surface-50 p-3 rounded-lg border border-surface-200">
                {selectedSignal.explanation || selectedSignal.title}
              </p>
            </div>
            {selectedSignal.financialImpactInr && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
                <span className="text-[11px] font-semibold text-red-600 uppercase block">Quantified Impact</span>
                <span className="text-base font-bold font-sans mt-0.5 block">
                  {formatCurrency(selectedSignal.financialImpactInr)} at risk
                </span>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

export default Dashboard;
