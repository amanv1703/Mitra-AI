import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useDateRange, DATE_PRESETS } from '../../context/DateRangeContext';

export function DateRangePicker() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const dropdownRef = useRef(null);

  const currentLabel = DATE_PRESETS.find(p => p.value === preset)?.label || 'Last 90 Days';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (value) => {
    if (value === 'custom') {
      setShowCustomModal(true);
      setIsOpen(false);
    } else {
      setPreset(value);
      setIsOpen(false);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (customFrom && customTo) {
      setPreset('custom');
      setShowCustomModal(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 shadow-sm transition-colors"
      >
        <Calendar className="w-3.5 h-3.5 text-surface-500" />
        <span>{preset === 'custom' ? `${customFrom} to ${customTo}` : currentLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-white border border-surface-200 shadow-lg py-1 z-30 animate-in fade-in duration-100">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-surface-400 border-b border-surface-100">
            Time Window
          </div>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleSelectPreset(p.value)}
              className="w-full text-left px-3 py-2 text-xs text-surface-700 hover:bg-surface-50 flex items-center justify-between transition-colors"
            >
              <span>{p.label}</span>
              {preset === p.value && <Check className="w-3.5 h-3.5 text-brand-600" />}
            </button>
          ))}
        </div>
      )}

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-surface-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-surface-200 shadow-xl max-w-sm w-full p-5">
            <h3 className="text-sm font-semibold text-surface-900 mb-3">Custom Date Range</h3>
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">From Date</label>
                <input
                  type="date"
                  required
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">To Date</label>
                <input
                  type="date"
                  required
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-200 hover:bg-surface-50 text-surface-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                >
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
