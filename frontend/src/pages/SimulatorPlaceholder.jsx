import React from 'react';
import { SlidersHorizontal, ArrowRight, LineChart, Sparkles } from 'lucide-react';

export function SimulatorPlaceholder() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">What-If Counterfactual Simulator</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Simulate elasticity, reorder lead-time buffers, and dynamic pricing interventions before execution
        </p>
      </div>

      <div className="card-clean p-12 text-center max-w-2xl mx-auto space-y-5 border-dashed border-2">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
          <SlidersHorizontal className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Planned for Phase 3: AI Intelligence Engine</span>
          </div>
          <h2 className="text-lg font-bold text-surface-900">Interactive Merchant Scenario Sandbox</h2>
          <p className="text-xs text-surface-600 max-w-md mx-auto leading-relaxed">
            The Simulator will allow merchants to model "What if I reorder 300 units of SKU-FIT-105 via express freight?" or "What if I shift payment routing from Gateway A to Gateway B?" with instant margin and revenue-at-risk projections.
          </p>
        </div>

        <div className="pt-4 border-t border-surface-100 flex items-center justify-center gap-6 text-xs text-surface-500">
          <div className="flex items-center gap-1.5">
            <LineChart className="w-4 h-4 text-brand-600" />
            <span>Price Elasticity Curves</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <span>Lead Time Buffer Projections</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulatorPlaceholder;
