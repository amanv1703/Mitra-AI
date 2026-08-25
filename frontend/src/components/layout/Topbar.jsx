import React, { useState } from 'react';
import { Menu, RefreshCw, Bell, Store, ChevronDown, Sparkles } from 'lucide-react';
import { useDateRange } from '../../context/DateRangeContext';
import DateRangePicker from '../common/DateRangePicker';

export function Topbar({ onToggleSidebar, onOpenCopilot }) {
  const { triggerRefresh } = useDateRange();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="h-16 bg-white border-b border-surface-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Merchant Switcher */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-50 border border-surface-200">
          <Store className="w-4 h-4 text-brand-600 shrink-0" />
          <div className="text-left">
            <span className="text-xs font-bold text-surface-900 block leading-tight">Apex Retail India</span>
            <span className="text-[10px] text-surface-400 block leading-tight">Mumbai Multi-Category Hub</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-surface-400 ml-1" />
        </div>
      </div>

      {/* Right: Date Picker, Copilot, Refresh & Profile */}
      <div className="flex items-center gap-3">
        {/* Mitra AI Copilot Trigger */}
        <button
          onClick={onOpenCopilot}
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
          title="Open Mitra AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Ask Mitra AI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        {/* Global Date Range */}
        <DateRangePicker />

        {/* Refresh button */}
        <button
          onClick={handleRefreshClick}
          className="p-2 rounded-lg border border-surface-200 bg-white hover:bg-surface-50 text-surface-600 transition-colors"
          title="Refresh telemetry"
          aria-label="Refresh telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="p-2 rounded-lg border border-surface-200 bg-white hover:bg-surface-50 text-surface-600 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          </button>
        </div>

        <div className="h-6 w-px bg-surface-200 hidden sm:block"></div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-surface-900 text-white flex items-center justify-center text-xs font-semibold">
            AR
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
