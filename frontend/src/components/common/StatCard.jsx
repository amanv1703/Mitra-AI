import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function MetricChange({ value, suffix = 'vs prev period', inverse = false }) {
  if (value === undefined || value === null) return null;
  const num = Number(value);

  // If inverse is true (e.g. failure rate, refunds), a decrease is positive/green, increase is negative/red
  const isPositive = inverse ? num < 0 : num > 0;
  const isNeutral = num === 0;

  let colorClass = isPositive 
    ? 'bg-status-success-bg text-status-success-text border-status-success-border' 
    : 'bg-status-danger-bg text-status-danger-text border-status-danger-border';

  if (isNeutral) {
    colorClass = 'bg-surface-100 text-surface-600 border-surface-200';
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}>
      {isNeutral ? (
        <Minus className="w-3 h-3" />
      ) : num > 0 ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      <span>{num > 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`}</span>
      {suffix && <span className="opacity-75 ml-0.5">{suffix}</span>}
    </div>
  );
}

export function StatCard({
  title,
  value,
  change,
  changeSuffix,
  inverseChange = false,
  subtitle,
  icon: Icon,
  iconBg = 'bg-brand-50 text-brand-600',
  badge,
  badgeType = 'info'
}) {
  return (
    <div className="card-clean p-5 hover:border-surface-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-surface-900 font-sans">
          {value}
        </div>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-surface-100 text-surface-700">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-surface-500">
        {change !== undefined && (
          <MetricChange value={change} suffix={changeSuffix} inverse={inverseChange} />
        )}
        {subtitle && (
          <span className="truncate">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
