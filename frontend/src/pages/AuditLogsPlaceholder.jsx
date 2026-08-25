import React from 'react';
import { ScrollText, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export function AuditLogsPlaceholder() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">AI Governance & Action Audit Ledger</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Immutable event ledger tracking autonomous recommendations, policy checks, human approvals, and rollback actions
        </p>
      </div>

      <div className="card-clean p-12 text-center max-w-2xl mx-auto space-y-5 border-dashed border-2">
        <div className="w-14 h-14 rounded-2xl bg-surface-100 text-surface-700 flex items-center justify-center mx-auto shadow-sm">
          <ScrollText className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Planned for Phase 4: Autonomous Human-in-the-Loop Governance</span>
          </div>
          <h2 className="text-lg font-bold text-surface-900">Cryptographically Auditable Decision Trail</h2>
          <p className="text-xs text-surface-600 max-w-md mx-auto leading-relaxed">
            Every action proposed by Mitra AI (e.g. initiating supplier purchase orders, rerouting payments, issuing goodwill credits) will be recorded in the `audit_logs` database table with full pre-action verification, policy constraint evaluation, merchant approval timestamp, and reversible compensation handlers.
          </p>
        </div>

        <div className="pt-4 border-t border-surface-100 flex items-center justify-center gap-6 text-xs text-surface-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Policy Tier Checks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Human Sign-Off State Machine</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsPlaceholder;
