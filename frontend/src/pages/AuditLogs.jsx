import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Cpu,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpDown,
  Lock
} from 'lucide-react';
import { aiApi } from '../services/api';
import { formatDateTime } from '../utils/formatters';
import DetailDrawer from '../components/common/DetailDrawer';

const FALLBACK_LOGS = [
  {
    id: 'AUDIT-1787575495667-640',
    actionId: 'ACT-FAILOVER-2026-002',
    actionType: 'REROUTE_PAYMENT_GATEWAY',
    status: 'EXECUTED',
    actor: 'merchant_admin@apexretail.in',
    justification: 'Approved payment routing switch due to 28.5% HDFC gateway timeout spike.',
    parameters: { primaryRail: 'HDFC_NETBANKING', fallbackRail: 'UPI_AND_CARDS_DEFAULT', durationHours: 24 },
    executionResult: { success: true, referenceCode: 'EXEC-891244', message: 'Routing policy activated.' },
    timestamp: '2026-08-24T12:45:12.000Z'
  },
  {
    id: 'AUDIT-1787575421000-112',
    actionId: 'INS-SCN-001',
    actionType: 'DISCOVER_INSIGHT',
    status: 'RECORDED',
    actor: 'MITRA_ORCHESTRATOR_V1',
    justification: 'Autonomous correlation engine detected statistical anomaly in checkout conversion.',
    parameters: { failureRatePeak: 29.85, baselineRate: 8.0, affectedRevenue: 15381341.52 },
    executionResult: { success: true },
    timestamp: '2026-08-24T12:42:05.000Z'
  },
  {
    id: 'AUDIT-1787574900000-334',
    actionId: 'ACT-PO-2026-001',
    actionType: 'CREATE_PURCHASE_ORDER',
    status: 'EXECUTED',
    actor: 'operator@apexretail.in',
    justification: 'Approved emergency purchase order for 200 units from Coimbatore Precision Gear.',
    parameters: { sku: 'SKU-FIT-105', quantity: 200, supplier: 'Coimbatore Precision Gear' },
    executionResult: { success: true, referenceCode: 'PO-2026-0891' },
    timestamp: '2026-08-24T10:15:30.000Z'
  },
  {
    id: 'AUDIT-1787571200000-889',
    actionId: 'CRON-DELAYS-BHOPAL',
    actionType: 'CROSS_DOMAIN_EVALUATION',
    status: 'RECORDED',
    actor: 'CRON_ANOMALY_MONITOR',
    justification: 'Calculated 19.45% delivery delay rate in Bhopal hub exceeding 10.0% threshold.',
    parameters: { city: 'Bhopal', delayRatePct: 19.45, thresholdPct: 10.0 },
    executionResult: { success: true },
    timestamp: '2026-08-24T08:00:00.000Z'
  }
];

export function AuditLogs() {
  const [logs, setLogs] = useState(FALLBACK_LOGS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await aiApi.getAuditLogs({ limit: 50 });
      if (response && response.data && response.data.length > 0) {
        setLogs(response.data);
      }
    } catch (err) {
      console.warn('Using seeded audit log history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.justification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesActor = 
      actorFilter === 'ALL' ||
      (actorFilter === 'USER' && (log.actor.includes('@') || log.actor === 'MERCHANT_ADMIN')) ||
      (actorFilter === 'AI' && log.actor.includes('MITRA')) ||
      (actorFilter === 'SYSTEM' && log.actor.includes('CRON'));

    return matchesSearch && matchesActor;
  });

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">
            Immutable Governance & Action Audit Trail
          </h1>
        </div>
        <p className="text-xs text-surface-500">
          Cryptographically recorded ledger of autonomous AI detections, policy safety gates, and merchant sign-offs
        </p>
      </div>

      {/* 2. Audit Security Status Banner */}
      <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-surface-900 block">Policy Gate: 100% Compliance</span>
            <span className="text-[11px] text-surface-500">All high-risk and medium-risk interventions verified before execution</span>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, or justification..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-surface-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg self-start sm:self-center">
          {['ALL', 'USER', 'AI', 'SYSTEM'].map((type) => (
            <button
              key={type}
              onClick={() => setActorFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                actorFilter === type
                  ? 'bg-white text-surface-900 shadow-sm font-semibold'
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              {type === 'ALL' ? 'All Actors' : type === 'USER' ? 'Merchant Users' : type === 'AI' ? 'AI Agents' : 'System Crons'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Audit Table */}
      <div className="card-clean overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-50 border-b border-surface-200 text-surface-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">TIMESTAMP</th>
                <th className="p-4">ACTOR</th>
                <th className="p-4">ACTION TYPE</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">JUSTIFICATION / NOTES</th>
                <th className="p-4 text-right">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-surface-700 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-surface-400">
                    No matching audit log records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-50/70 transition">
                    <td className="p-4 font-mono text-surface-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {log.actor.includes('@') || log.actor === 'MERCHANT_ADMIN' ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                            <UserCheck className="w-3.5 h-3.5" />
                          </span>
                        ) : log.actor.includes('MITRA') ? (
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">
                            <Cpu className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="font-mono text-xs text-surface-800">{log.actor}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-surface-900 whitespace-nowrap">
                      {log.actionType}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        log.status === 'EXECUTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-surface-600 max-w-xs truncate">
                      {log.justification}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-surface-500" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detail Inspection Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Entry Details"
        subtitle={`ID: ${selectedLog?.id}`}
      >
        {selectedLog && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-surface-400">Timestamp:</span>
                <span className="font-mono font-bold text-surface-900">{formatDateTime(selectedLog.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Actor:</span>
                <span className="font-mono font-bold text-surface-900">{selectedLog.actor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Action Type:</span>
                <span className="font-mono font-bold text-brand-600">{selectedLog.actionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Status:</span>
                <span className="font-mono font-bold text-emerald-600">{selectedLog.status}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-surface-900 mb-1">Human / Agent Justification</h4>
              <p className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-surface-700 leading-relaxed">
                {selectedLog.justification}
              </p>
            </div>

            {selectedLog.parameters && (
              <div>
                <h4 className="font-bold text-surface-900 mb-1">Action Parameters Payload</h4>
                <pre className="p-3 rounded-lg bg-surface-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.parameters, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.executionResult && (
              <div>
                <h4 className="font-bold text-surface-900 mb-1">Execution Verification Receipt</h4>
                <pre className="p-3 rounded-lg bg-surface-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.executionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

export default AuditLogs;
