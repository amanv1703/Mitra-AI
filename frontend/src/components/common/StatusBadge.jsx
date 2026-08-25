import React from 'react';

export function StatusBadge({ status, type = 'general' }) {
  if (!status) return null;
  const s = String(status).toUpperCase();

  let colorClasses = 'bg-surface-100 text-surface-700 border-surface-200';
  let dotColor = 'bg-surface-400';

  // 1. Payments & Transaction statuses
  if (['SUCCESS', 'DELIVERED', 'HEALTHY', 'COMPLETED', 'PROCESSED', 'ACTIVE'].includes(s)) {
    colorClasses = 'bg-status-success-bg text-status-success-text border-status-success-border';
    dotColor = 'bg-status-success-dot';
  } else if (['PENDING', 'PROCESSING', 'LOW', 'LOW_STOCK', 'SHIPPED', 'REQUESTED', 'WARNING'].includes(s)) {
    colorClasses = 'bg-status-warning-bg text-status-warning-text border-status-warning-border';
    dotColor = 'bg-status-warning-dot';
  } else if (['FAILED', 'CANCELLED', 'OUT_OF_STOCK', 'CRITICAL', 'CRITICAL_STOCKOUT_RISK', 'DELAYED', 'CRITICAL_FRICTION'].includes(s)) {
    colorClasses = 'bg-status-danger-bg text-status-danger-text border-status-danger-border';
    dotColor = 'bg-status-danger-dot';
  } else if (['LOYAL', 'VIP', 'REFUNDED'].includes(s)) {
    colorClasses = 'bg-status-info-bg text-status-info-text border-status-info-border';
    dotColor = 'bg-status-info-dot';
  }

  // Readable labels
  const labelMap = {
    CRITICAL_STOCKOUT_RISK: 'Stockout Risk',
    OUT_OF_STOCK: 'Out of Stock',
    CRITICAL_FRICTION: 'At-Risk Churn',
    DELIVERY_DELAY: 'Delivery Delay',
    DAMAGED_PRODUCT: 'Damaged Product',
    BANK_TIMEOUT: 'Bank Timeout',
    LOW_STOCK: 'Low Stock'
  };

  const label = labelMap[s] || s.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span className="capitalize">{label}</span>
    </span>
  );
}

export function SeverityBadge({ severity }) {
  if (!severity) return null;
  const s = String(severity).toUpperCase();

  const configs = {
    CRITICAL: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      label: 'Critical'
    },
    HIGH: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      label: 'High Severity'
    },
    MEDIUM: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Medium'
    },
    LOW: {
      bg: 'bg-surface-100 text-surface-700 border-surface-200',
      label: 'Low'
    }
  };

  const cfg = configs[s] || configs.MEDIUM;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

export default StatusBadge;
