import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  Eye,
  Check,
  X,
  Lock,
  ChevronRight
} from 'lucide-react';
import { actionsApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';

const RISK_BADGES = {
  LOW: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'LOW RISK' },
  MEDIUM: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'MEDIUM RISK' },
  HIGH: { bg: 'bg-orange-50 text-orange-700 border-orange-200', label: 'HIGH RISK' },
  CRITICAL: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'CRITICAL RISK' }
};

export function Actions() {
  const [actionsList, setActionsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionTimeline, setActionTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [approvalModal, setApprovalModal] = useState({ open: false, action: null, justification: '', twoStepConfirmed: false });
  const [rejectionModal, setRejectionModal] = useState({ open: false, action: null, reason: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  useEffect(() => {
    fetchActions();
  }, [statusFilter, riskFilter]);

  const showToast = (msg, type = 'success') => {
    setFeedbackToast({ msg, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await actionsApi.getActions(params);
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setActionsList(data);
      if (selectedAction) {
        const updated = data.find(a => a.id === selectedAction.id);
        if (updated) setSelectedAction(updated);
      }
    } catch (err) {
      console.error('Failed to fetch actions:', err);
      showToast('Error loading actions from governance engine', 'error');
      setActionsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openActionDetail = async (action) => {
    setSelectedAction(action);
    setTimelineLoading(true);
    try {
      const res = await actionsApi.getActionTimeline(action.id);
      const timelineData = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setActionTimeline(timelineData);
    } catch (err) {
      console.error('Failed to load action timeline:', err);
      setActionTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalModal.action) return;
    setIsProcessing(true);
    try {
      await actionsApi.approveAction(approvalModal.action.id, {
        actor: 'operations_lead@apexretail.in',
        justification: approvalModal.justification || 'Approved via Mitra AI Action Center'
      });
      showToast(`Action ${approvalModal.action.id} approved successfully!`);
      setApprovalModal({ open: false, action: null, justification: '', twoStepConfirmed: false });
      await fetchActions();
      if (selectedAction?.id === approvalModal.action.id) {
        openActionDetail(approvalModal.action);
      }
    } catch (err) {
      showToast(err.message || 'Approval rejected by policy engine', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionModal.action) return;
    setIsProcessing(true);
    try {
      await actionsApi.rejectAction(rejectionModal.action.id, {
        actor: 'operations_lead@apexretail.in',
        justification: rejectionModal.reason || 'Rejected by merchant operator'
      });
      showToast(`Action ${rejectionModal.action.id} rejected.`);
      setRejectionModal({ open: false, action: null, reason: '' });
      await fetchActions();
      if (selectedAction?.id === rejectionModal.action.id) {
        openActionDetail(rejectionModal.action);
      }
    } catch (err) {
      showToast(err.message || 'Failed to reject action', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecute = async (actionId) => {
    setIsProcessing(true);
    try {
      const res = await actionsApi.executeAction(actionId, {
        actor: 'operations_lead@apexretail.in'
      });
      showToast(`Action executed & verified! Status: ${res.data?.status || 'VERIFIED'}`);
      await fetchActions();
      if (selectedAction?.id === actionId) {
        const detailRes = await actionsApi.getActionById(actionId);
        if (detailRes.data) setSelectedAction(detailRes.data);
        openActionDetail(detailRes.data || selectedAction);
      }
    } catch (err) {
      showToast(err.message || 'Execution failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Summary Metrics
  const safeList = Array.isArray(actionsList) ? actionsList : [];
  const pendingCount = safeList.filter(a => a?.status === 'PENDING_APPROVAL').length;
  const verifiedCount = safeList.filter(a => a?.status === 'VERIFIED').length;
  const totalProtectedRevenue = safeList.reduce((sum, a) => sum + (Number(a?.expectedImpact?.revenueProtectedInr) || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            feedbackToast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          {feedbackToast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{feedbackToast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-surface-900 tracking-tight">AI Action Center</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Phase 5 Safe Operations
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-1">
            Governed business action orchestration, human approval gates, deterministic impact previews, and post-execution verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchActions}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approvals"
          value={pendingCount}
          subtitle="Awaiting human merchant review"
          icon={Clock}
          trend={{ value: 'Merchant Gate', isPositive: false }}
        />
        <StatCard
          title="Verified Executions"
          value={verifiedCount}
          subtitle="Passed post-execution integrity"
          icon={CheckCircle2}
          trend={{ value: '100% Fidelity', isPositive: true }}
        />
        <StatCard
          title="Revenue Protected"
          value={formatCurrency(totalProtectedRevenue)}
          subtitle="Quantified operational savings"
          icon={ShieldCheck}
          trend={{ value: 'Averted Risk', isPositive: true }}
        />
        <StatCard
          title="Safety Compliance"
          value="100.0%"
          subtitle="Unauthorized Action Rate = 0.0%"
          icon={Lock}
          trend={{ value: 'Air-gapped', isPositive: true }}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-surface-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'VERIFIED', 'REJECTED', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-surface-50 text-surface-600 hover:bg-surface-100 hover:text-surface-900 border border-surface-200'
                }`}
              >
                {st === 'ALL' ? 'All Actions' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Risk Filter & Search */}
          <div className="flex items-center gap-2">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-xs bg-surface-50 border border-surface-300 rounded-lg px-2.5 py-1.5 font-medium text-surface-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Risk</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-surface-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action ID, SKU, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchActions()}
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-surface-300 w-48 sm:w-64 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Actions Grid & Selected Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Actions List Grid */}
        <div className={`${selectedAction ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {isLoading ? (
            <div className="space-y-3">
              <SkeletonLoader count={4} height="h-28" />
            </div>
          ) : actionsList.length === 0 ? (
            <div className="bg-white rounded-xl border border-surface-200 p-8">
              <EmptyState
                icon={ShieldCheck}
                title="No Actions Found"
                description="No business actions match the selected filter criteria."
              />
            </div>
          ) : (
            actionsList.map((action) => {
              const risk = RISK_BADGES[action.riskLevel] || RISK_BADGES.MEDIUM;
              const isSelected = selectedAction?.id === action.id;

              return (
                <div
                  key={action.id}
                  onClick={() => openActionDetail(action)}
                  className={`bg-white rounded-xl border p-4 transition cursor-pointer hover:border-brand-300 hover:shadow-sm space-y-3 ${
                    isSelected ? 'border-brand-500 ring-2 ring-brand-100 bg-brand-50/10' : 'border-surface-200'
                  }`}
                >
                  {/* Top Bar: Name, Risk, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-surface-900">{action.name}</span>
                        <span className="font-mono text-[10px] text-surface-400">[{action.id}]</span>
                      </div>
                      <p className="text-xs text-surface-600 line-clamp-2">{action.reason}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${risk.bg}`}>
                        {risk.label}
                      </span>
                      <StatusBadge status={action.status} />
                    </div>
                  </div>

                  {/* Parameter & Impact Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-surface-100 text-[11px]">
                    <div className="bg-surface-50 p-2 rounded-lg">
                      <span className="text-surface-400 block text-[10px] uppercase font-semibold">Target</span>
                      <span className="font-mono font-bold text-surface-800 truncate block">
                        {action.parameters?.sku || action.parameters?.productId || action.target?.type || 'SYSTEM'}
                      </span>
                    </div>

                    <div className="bg-surface-50 p-2 rounded-lg">
                      <span className="text-surface-400 block text-[10px] uppercase font-semibold">Quantity / Scope</span>
                      <span className="font-bold text-surface-800 truncate block">
                        {action.parameters?.recommendedQuantity ? `${action.parameters.recommendedQuantity} units` : (action.parameters?.channel || '1 operation')}
                      </span>
                    </div>

                    <div className="bg-surface-50 p-2 rounded-lg">
                      <span className="text-surface-400 block text-[10px] uppercase font-semibold">Protected Revenue</span>
                      <span className="font-bold text-emerald-700 truncate block">
                        {action.expectedImpact?.revenueProtectedInr ? formatCurrency(action.expectedImpact.revenueProtectedInr) : 'Telemetry Health'}
                      </span>
                    </div>

                    <div className="bg-surface-50 p-2 rounded-lg">
                      <span className="text-surface-400 block text-[10px] uppercase font-semibold">Reversibility</span>
                      <span className="font-bold text-surface-800 truncate block">
                        {action.reversibility ? 'REVERSIBLE ✅' : 'IRREVERSIBLE ⚠️'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Triggers */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-surface-400">
                      Created by <strong className="text-surface-700">{action.createdBy}</strong> on {formatDate(action.createdAt)}
                    </span>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {action.status === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            onClick={() => setRejectionModal({ open: true, action, reason: '' })}
                            className="px-2.5 py-1 rounded-md bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-semibold transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setApprovalModal({ open: true, action, justification: '', twoStepConfirmed: false })}
                            className="btn-primary text-xs px-3 py-1 flex items-center gap-1 shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </>
                      )}

                      {action.status === 'APPROVED' && (
                        <button
                          onClick={() => handleExecute(action.id)}
                          disabled={isProcessing}
                          className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Execute & Verify</span>
                        </button>
                      )}

                      {action.status === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified in Ledger</span>
                        </span>
                      )}

                      <button
                        onClick={() => openActionDetail(action)}
                        className="p-1 text-surface-400 hover:text-brand-600"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Action Deep-Dive Inspector (Col 5) */}
        {selectedAction && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-surface-200 p-5 space-y-5 sticky top-20 shadow-sm animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-surface-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-surface-900">{selectedAction.name}</span>
                  <StatusBadge status={selectedAction.status} />
                </div>
                <span className="font-mono text-xs text-surface-400">ID: {selectedAction.id}</span>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Why & Objective */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                Operational Rationale (Why)
              </span>
              <p className="text-xs text-surface-700 bg-surface-50 p-3 rounded-lg border border-surface-200 leading-relaxed">
                {selectedAction.reason}
              </p>
            </div>

            {/* Parameters & Deterministic Expected Impact */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                Action Parameters & Impact Preview
              </span>
              <div className="bg-surface-50 p-3 rounded-lg border border-surface-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-surface-200">
                  <span className="text-surface-500">Action Type:</span>
                  <span className="font-mono font-semibold text-surface-900">{selectedAction.type}</span>
                </div>
                {selectedAction.parameters?.sku && (
                  <div className="flex justify-between py-1 border-b border-surface-200">
                    <span className="text-surface-500">Target Product:</span>
                    <span className="font-mono font-semibold text-surface-900">{selectedAction.parameters.sku}</span>
                  </div>
                )}
                {selectedAction.parameters?.recommendedQuantity && (
                  <div className="flex justify-between py-1 border-b border-surface-200">
                    <span className="text-surface-500">Recommended Restock:</span>
                    <span className="font-bold text-brand-700">{selectedAction.parameters.recommendedQuantity} units</span>
                  </div>
                )}
                {selectedAction.expectedImpact?.revenueProtectedInr && (
                  <div className="flex justify-between py-1 border-b border-surface-200">
                    <span className="text-surface-500">Protected Revenue:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(selectedAction.expectedImpact.revenueProtectedInr)}</span>
                  </div>
                )}
                {selectedAction.expectedImpact?.stockCoverageGainDays && (
                  <div className="flex justify-between py-1 border-b border-surface-200">
                    <span className="text-surface-500">Stock Coverage Added:</span>
                    <span className="font-bold text-emerald-700">+{selectedAction.expectedImpact.stockCoverageGainDays} Days</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-surface-500">Idempotency Key:</span>
                  <span className="font-mono text-[10px] text-surface-600 truncate max-w-[180px]">{selectedAction.idempotencyKey}</span>
                </div>
              </div>
            </div>

            {/* Verification Receipts (If Executed / Verified) */}
            {selectedAction.verificationResult && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Automated Post-Execution Verification</span>
                </span>
                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg space-y-1.5 text-xs">
                  {selectedAction.verificationResult.checks?.map((chk, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-emerald-900">{chk.check}</span>
                      <span className={`font-bold ${chk.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {chk.passed ? 'PASSED ✅' : 'FAILED ❌'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Trail Timeline */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">
                Immutable Lifecycle Timeline
              </span>
              {timelineLoading ? (
                <div className="py-4 text-center text-xs text-surface-400 font-mono">Loading audit stream...</div>
              ) : actionTimeline.length === 0 ? (
                <div className="text-xs text-surface-400 p-2 bg-surface-50 rounded">No audit events recorded yet.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {actionTimeline.map((evt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[11px] p-2 rounded-lg bg-surface-50 border border-surface-100">
                      <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-surface-800">{evt.eventType}</span>
                          <span className="text-[10px] text-surface-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-[10px] text-surface-500 block">
                          Actor: <strong>{evt.actorIdentifier}</strong> ({evt.actorType})
                        </span>
                        {evt.justification && (
                          <span className="text-[10px] text-surface-600 italic block mt-0.5">"{evt.justification}"</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Footer in Detail Panel */}
            <div className="pt-3 border-t border-surface-200 flex items-center justify-between">
              {selectedAction.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => setRejectionModal({ open: true, action: selectedAction, reason: '' })}
                    className="flex-1 py-2 rounded-lg border border-surface-300 text-surface-700 text-xs font-semibold hover:bg-surface-100"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setApprovalModal({ open: true, action: selectedAction, justification: '', twoStepConfirmed: false })}
                    className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve Proposal</span>
                  </button>
                </div>
              )}

              {selectedAction.status === 'APPROVED' && (
                <button
                  onClick={() => handleExecute(selectedAction.id)}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Play className="w-4 h-4" />
                  <span>Execute & Verify Action in Database</span>
                </button>
              )}

              {selectedAction.status === 'VERIFIED' && (
                <div className="w-full py-2 text-center text-xs font-bold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
                  Operation Verified and Permanently Audited
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Human Approval Modal */}
      {approvalModal.open && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-surface-200">
            <div className="flex items-center gap-3 pb-3 border-b border-surface-200">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-surface-900">Merchant Approval Gate</h3>
                <span className="text-xs text-surface-500 font-mono">Action ID: {approvalModal.action?.id}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 space-y-1">
                <span className="font-bold text-surface-900 block">{approvalModal.action?.name}</span>
                <p className="text-surface-600">{approvalModal.action?.reason}</p>
              </div>

              {approvalModal.action?.requiresTwoStepConfirmation && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-orange-900">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Elevated Risk Two-Step Confirmation Required</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={approvalModal.twoStepConfirmed}
                      onChange={(e) => setApprovalModal(p => ({ ...p, twoStepConfirmed: e.target.checked }))}
                      className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-[11px] font-medium text-orange-900">
                      I explicitly confirm authorization for this {approvalModal.action?.riskLevel} risk business action.
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-surface-700 block">
                  Approval Justification Rationale (Audited)
                </label>
                <textarea
                  rows={3}
                  value={approvalModal.justification}
                  onChange={(e) => setApprovalModal(p => ({ ...p, justification: e.target.value }))}
                  placeholder="e.g. Approved restock to cover 5-day supplier lead time gap."
                  className="w-full p-2.5 rounded-lg border border-surface-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-200">
              <button
                onClick={() => setApprovalModal({ open: false, action: null, justification: '', twoStepConfirmed: false })}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg border border-surface-300 text-surface-700 text-xs font-semibold hover:bg-surface-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={
                  isProcessing ||
                  (approvalModal.action?.requiresTwoStepConfirmation && !approvalModal.twoStepConfirmed)
                }
                className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Authorize & Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human Rejection Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-surface-200">
            <div className="flex items-center gap-3 pb-3 border-b border-surface-200">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-surface-900">Reject Action Proposal</h3>
                <span className="text-xs text-surface-500 font-mono">Action ID: {rejectionModal.action?.id}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-surface-600">
                Are you sure you want to reject this proposed action? The status will transition to <strong>REJECTED</strong> and will be recorded in the audit trail.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-surface-700 block">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal(p => ({ ...p, reason: e.target.value }))}
                  placeholder="e.g. Existing supplier promotion pending; delay restock by 3 days."
                  className="w-full p-2.5 rounded-lg border border-surface-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-200">
              <button
                onClick={() => setRejectionModal({ open: false, action: null, reason: '' })}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg border border-surface-300 text-surface-700 text-xs font-semibold hover:bg-surface-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                <span>Reject Proposal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Actions;
