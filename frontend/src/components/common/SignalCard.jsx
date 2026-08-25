import React from 'react';
import { AlertTriangle, TrendingUp, AlertOctagon, Package, ArrowRight, ShieldAlert } from 'lucide-react';
import { SeverityBadge } from './StatusBadge';
import { formatCurrency } from '../../utils/formatters';

export function SignalCard({ signal, onViewDetails }) {
  if (!signal) return null;

  const domainIcons = {
    PAYMENTS: AlertOctagon,
    INVENTORY: Package,
    REFUNDS: AlertTriangle,
    DELIVERY: TrendingUp
  };

  const Icon = domainIcons[signal.domain] || ShieldAlert;

  return (
    <div className="card-clean p-5 hover:border-surface-300 hover:shadow-card-hover transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${signal.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">{signal.domain || 'SIGNAL'}</span>
          </div>
          <SeverityBadge severity={signal.severity} />
        </div>

        <h3 className="text-sm font-semibold text-surface-900 mt-3">{signal.title}</h3>
        <p className="text-xs text-surface-600 mt-1 leading-relaxed line-clamp-2">{signal.explanation || signal.title}</p>

        {/* Metric Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-2 bg-surface-50 p-2.5 rounded-lg border border-surface-100 text-xs">
          {signal.type === 'PAYMENT_FAILURE_SPIKE' && (
            <>
              <div>
                <span className="text-surface-400 block text-[11px]">Peak Failure</span>
                <span className="font-semibold text-red-600">{signal.peakFailureRatePct}%</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Baseline Delta</span>
                <span className="font-semibold text-surface-800">{signal.changeMultiplier}× Surge</span>
              </div>
            </>
          )}

          {signal.type === 'STOCKOUT_RISK' && (
            <>
              <div>
                <span className="text-surface-400 block text-[11px]">Critical SKUs</span>
                <span className="font-semibold text-red-600">{signal.criticalProductCount} Products</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Projected Loss</span>
                <span className="font-semibold text-surface-800">{formatCurrency(signal.totalProjectedLostRevenue, true)}</span>
              </div>
            </>
          )}

          {signal.type === 'REFUND_SURGE' && (
            <>
              <div>
                <span className="text-surface-400 block text-[11px]">Regional Spikes</span>
                <span className="font-semibold text-amber-600">{signal.regionalSpikes?.length || 0} Cities</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Product Spikes</span>
                <span className="font-semibold text-amber-600">{signal.productSpikes?.length || 0} SKUs</span>
              </div>
            </>
          )}

          {signal.type === 'DEMAND_SURGE' && (
            <>
              <div>
                <span className="text-surface-400 block text-[11px]">Surged Products</span>
                <span className="font-semibold text-brand-600">{signal.surgedProductsCount} SKUs</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Velocity Trigger</span>
                <span className="font-semibold text-surface-800">&gt; 1.8× Baseline</span>
              </div>
            </>
          )}

          {signal.type === 'REGIONAL_DELIVERY_BOTTLENECK' && (
            <>
              <div>
                <span className="text-surface-400 block text-[11px]">Delayed Hubs</span>
                <span className="font-semibold text-red-600">{signal.bottleneckCount} Cities</span>
              </div>
              <div>
                <span className="text-surface-400 block text-[11px]">Threshold Delay</span>
                <span className="font-semibold text-surface-800">&gt; {signal.thresholdDelayRatePct}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between">
        <span className="text-[11px] text-surface-400 font-medium">Deterministic Rule Signal</span>
        <button
          onClick={() => onViewDetails && onViewDetails(signal)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>View Evidence</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default SignalCard;
