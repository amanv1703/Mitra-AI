import React, { useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export function DetailDrawer({ isOpen, onClose, title, subtitle, badge, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-drawer border-l border-surface-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-surface-200 flex items-start justify-between bg-surface-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-surface-900">{title}</h2>
                {badge}
              </div>
              {subtitle && <p className="text-xs text-surface-500 mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
              aria-label="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-200 bg-surface-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-white border border-surface-200 hover:bg-surface-100 text-surface-700 shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HealthIndicator({ status, label }) {
  const configs = {
    HEALTHY: {
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      label: 'Healthy'
    },
    WARNING: {
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      label: 'Warning'
    },
    CRITICAL: {
      icon: XCircle,
      color: 'text-red-600 bg-red-50 border-red-200',
      label: 'Critical'
    },
    INFO: {
      icon: Info,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      label: 'Info'
    }
  };

  const cfg = configs[status] || configs.HEALTHY;
  const Icon = cfg.icon;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${cfg.color}`}>
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium text-surface-900">{label}</span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider">{cfg.label}</span>
    </div>
  );
}

export default DetailDrawer;
