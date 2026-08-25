import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

import { usePayments } from '../hooks/usePayments';
import { formatCurrency, formatNumber, formatPercent, formatDateTime } from '../utils/formatters';

import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import DetailDrawer from '../components/common/DetailDrawer';
import ErrorState from '../components/common/ErrorState';

export function Payments() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [failureReasonFilter, setFailureReasonFilter] = useState('');
  const [sortBy, setSortBy] = useState('initiated_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { payments, meta, summary, trends, loading, error, refetch } = usePayments({
    page,
    limit: 15,
    status: statusFilter || undefined,
    method: methodFilter || undefined,
    failureReason: failureReasonFilter || undefined,
    search: search || undefined,
    sortBy,
    sortOrder
  });

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(key);
      setSortOrder('DESC');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Payment ID',
      render: (val, row) => (
        <span className="font-mono font-medium text-brand-600">
          PAY-{String(val).padStart(6, '0')}
        </span>
      )
    },
    {
      key: 'order_number',
      header: 'Order',
      render: (val) => <span className="font-mono text-surface-700">{val || '—'}</span>
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (val, row) => (
        <div>
          <span className="font-medium text-surface-900 block">{val || 'Customer'}</span>
          <span className="text-[10px] text-surface-400 font-mono">{row.customer_code}</span>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: (val) => <span className="font-bold text-surface-900">{formatCurrency(val)}</span>
    },
    {
      key: 'payment_method',
      header: 'Method',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-100 text-surface-700 border border-surface-200">
          {val}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'failure_reason',
      header: 'Failure Reason',
      render: (val) => (
        val ? (
          <span className="text-red-700 font-mono text-[11px] font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
            {val}
          </span>
        ) : <span className="text-surface-400">—</span>
      )
    },
    {
      key: 'initiated_at',
      header: 'Date & Time',
      sortable: true,
      render: (val) => <span className="text-surface-500">{formatDateTime(val)}</span>
    }
  ];

  if (error) {
    return <ErrorState title="Failed to load payments telemetry" message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Payment Telemetry & Failure Health</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Real-time transaction logs, multi-gateway health, and checkout dropoff diagnostics
        </p>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={formatNumber(summary?.totalPayments || 0)}
          icon={CreditCard}
          subtitle="Processed across all gateways"
        />
        <StatCard
          title="Successful Checkouts"
          value={formatNumber(summary?.successful || 0)}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
          subtitle={`${formatCurrency(summary?.successfulAmount || 0, true)} captured`}
        />
        <StatCard
          title="Payment Failure Rate"
          value={formatPercent(summary?.failureRatePct || 0)}
          icon={XCircle}
          iconBg={summary?.failureRatePct > 10 ? 'bg-red-50 text-red-600' : 'bg-surface-100 text-surface-600'}
          subtitle={`${formatNumber(summary?.failed || 0)} failed transactions`}
        />
        <StatCard
          title="Dropped Revenue Volume"
          value={formatCurrency(summary?.failedAmount || 0)}
          icon={AlertOctagon}
          iconBg="bg-red-50 text-red-600"
          subtitle="Lost to gateway timeouts & errors"
        />
      </div>

      {/* 3. Failure Trends Time-Series Chart */}
      {trends.length > 0 && (
        <div className="card-clean p-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <div>
              <h3 className="text-sm font-bold text-surface-900">Daily Payment Failure Rate & Error Distribution</h3>
              <p className="text-xs text-surface-500 mt-0.5">Detects gateway timeout surges and network drops over time</p>
            </div>
            <span className="text-xs font-semibold text-red-600 px-2 py-0.5 rounded bg-red-50 border border-red-200">
              Gateway Anomaly Detected (Day 60-64)
            </span>
          </div>

          <div className="pt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => val ? val.slice(5) : ''}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-surface-200 text-xs">
                          <span className="font-semibold text-surface-900 block mb-1">{d.date}</span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4 text-red-600 font-bold">
                              <span>Failure Rate:</span>
                              <span>{d.failureRatePct}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-surface-600">
                              <span>Failed Volume:</span>
                              <span>{formatCurrency(d.lostVolume)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-surface-500">
                              <span>Bank Timeouts:</span>
                              <span>{d.bankTimeouts}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="failureRatePct"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Filters & Controls */}
      <div className="card-clean p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="NETBANKING">Netbanking</option>
            <option value="COD">Cash on Delivery</option>
          </select>

          {/* Failure Reason Filter */}
          <select
            value={failureReasonFilter}
            onChange={(e) => { setFailureReasonFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Failure Reasons</option>
            <option value="BANK_TIMEOUT">Bank Timeout</option>
            <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
            <option value="NETWORK_ERROR">Network Error</option>
            <option value="CARD_DECLINED">Card Declined</option>
          </select>

          {/* Clear Filters button */}
          {(statusFilter || methodFilter || failureReasonFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setMethodFilter(''); setFailureReasonFilter(''); setPage(1); }}
              className="px-3 py-1.5 text-xs font-medium text-surface-600 hover:text-surface-900 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 5. Payments DataTable */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        onRowClick={(row) => setSelectedPayment(row)}
        emptyTitle="No payment transactions found"
        emptyDescription="No payment attempts matched your filter criteria."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages: meta?.totalPages || 1,
          totalItems: meta?.total || 0,
          itemsPerPage: 15,
          onPageChange: (p) => setPage(p)
        }}
      />

      {/* 6. Payment Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title={`Payment Details — PAY-${String(selectedPayment?.id || '').padStart(6, '0')}`}
        subtitle={`Initiated on ${formatDateTime(selectedPayment?.initiated_at)}`}
        badge={<StatusBadge status={selectedPayment?.status} />}
      >
        {selectedPayment && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <div>
                <span className="text-[11px] text-surface-400 block">Amount</span>
                <span className="text-base font-bold text-surface-900 font-sans">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Payment Method</span>
                <span className="font-semibold text-surface-800 font-mono">
                  {selectedPayment.payment_method}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Gateway ID</span>
                <span className="font-mono text-surface-700">
                  {selectedPayment.gateway_payment_id || 'gtw_mock_009'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Order Reference</span>
                <span className="font-mono text-brand-600 font-medium">
                  {selectedPayment.order_number || `ORD-2026-${selectedPayment.order_id}`}
                </span>
              </div>
            </div>

            {selectedPayment.status === 'FAILED' && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
                <span className="text-xs font-bold block flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Failure Reason: {selectedPayment.failure_reason}
                </span>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  The upstream issuing bank or acquirer timed out during 2FA authorization. Transaction was marked as failed without retry.
                </p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-surface-900 mb-2">Customer Profile</h4>
              <div className="p-3.5 rounded-lg border border-surface-200 bg-white space-y-2">
                <div className="flex justify-between">
                  <span className="text-surface-500">Name:</span>
                  <span className="font-medium text-surface-900">{selectedPayment.customer_name || 'Customer Name'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Customer Code:</span>
                  <span className="font-mono text-surface-700">{selectedPayment.customer_code}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

export default Payments;
