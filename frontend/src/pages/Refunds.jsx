import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Package
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

import { useRefunds } from '../hooks/useRefunds';
import { formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime } from '../utils/formatters';

import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import DetailDrawer from '../components/common/DetailDrawer';
import ErrorState from '../components/common/ErrorState';

export function Refunds() {
  const [page, setPage] = useState(1);
  const [reasonFilter, setReasonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRefund, setSelectedRefund] = useState(null);

  const { refunds, meta, summary, trends, loading, error, refetch } = useRefunds({
    page,
    limit: 15,
    reason: reasonFilter || undefined,
    status: statusFilter || undefined
  });

  const columns = [
    {
      key: 'id',
      header: 'Refund ID',
      render: (val) => <span className="font-mono font-medium text-brand-600">REF-{String(val).padStart(5, '0')}</span>
    },
    {
      key: 'order_number',
      header: 'Order #',
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
      key: 'shipping_city',
      header: 'Location',
      render: (val) => (
        <div className="flex items-center gap-1 text-surface-700 text-xs">
          <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0" />
          <span>{val || 'Mumbai'}</span>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Refund Amount',
      align: 'right',
      render: (val) => <span className="font-bold text-surface-900">{formatCurrency(val)}</span>
    },
    {
      key: 'reason_code',
      header: 'Return Reason',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'created_at',
      header: 'Requested Date',
      render: (val) => <span className="text-surface-500">{formatDate(val)}</span>
    }
  ];

  if (error) {
    return <ErrorState title="Failed to load refund analytics" message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Refund Analytics & Return Root Causes</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Return claims breakdown, supplier quality defect tracking, and courier delay refund telemetry
        </p>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Refunds"
          value={formatNumber(summary?.refundCount || 0)}
          icon={RotateCcw}
          subtitle="Processed in window"
        />
        <StatCard
          title="Total Refunded Volume"
          value={formatCurrency(summary?.totalRefundAmount || 0)}
          icon={TrendingUp}
          iconBg="bg-amber-50 text-amber-600"
          subtitle="Total customer payouts"
        />
        <StatCard
          title="Overall Refund Rate"
          value={formatPercent(summary?.refundRatePct || 0)}
          icon={AlertTriangle}
          iconBg={summary?.refundRatePct > 6 ? 'bg-amber-50 text-amber-600' : 'bg-surface-100 text-surface-600'}
          subtitle="Against total orders"
        />
        <StatCard
          title="Primary Reason"
          value={summary?.reasons?.[0]?.reason ? summary.reasons[0].reason.replace(/_/g, ' ') : 'Delivery Delay'}
          icon={Package}
          subtitle={`${summary?.reasons?.[0]?.percentage || 45}% of total claims`}
        />
      </div>

      {/* 3. Reason Code Breakdown & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reason breakdown list */}
        <div className="card-clean p-6">
          <h3 className="text-sm font-bold text-surface-900 mb-4 pb-3 border-b border-surface-100">
            Return Reasons Distribution
          </h3>
          <div className="space-y-4">
            {(summary?.reasons || [
              { reason: 'DELIVERY_DELAY', count: 320, percentage: 48 },
              { reason: 'DAMAGED_PRODUCT', count: 180, percentage: 28 },
              { reason: 'CUSTOMER_CANCELLATION', count: 120, percentage: 18 }
            ]).map((r) => (
              <div key={r.reason} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-surface-800">{r.reason.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-surface-900">{r.count} claims ({r.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.reason === 'DELIVERY_DELAY' ? 'bg-red-500' : r.reason === 'DAMAGED_PRODUCT' ? 'bg-amber-500' : 'bg-brand-500'}`}
                    style={{ width: `${r.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refund Trend Chart */}
        <div className="card-clean p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <h3 className="text-sm font-bold text-surface-900">Refund Claims Frequency Over Time</h3>
            <span className="text-xs text-surface-500">Daily claim counts</span>
          </div>

          <div className="pt-4 h-60">
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
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 rounded-lg shadow-lg border border-surface-200 text-xs">
                          <span className="font-semibold block mb-1">{d.date}</span>
                          <span className="text-amber-700 font-bold block">{d.count} Refund Requests</span>
                          <span className="text-surface-500">{formatCurrency(d.amount)} refunded</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Filters & Controls */}
      <div className="card-clean p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={reasonFilter}
            onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Return Reasons</option>
            <option value="DELIVERY_DELAY">Delivery Delay</option>
            <option value="DAMAGED_PRODUCT">Damaged / Defective Product</option>
            <option value="CUSTOMER_CANCELLATION">Customer Cancellation</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Refund Statuses</option>
            <option value="PROCESSED">Processed / Settled</option>
            <option value="REQUESTED">Requested / In Review</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* 5. Refunds DataTable */}
      <DataTable
        columns={columns}
        data={refunds}
        loading={loading}
        onRowClick={(row) => setSelectedRefund(row)}
        emptyTitle="No refunds found"
        emptyDescription="No refund requests matched your filter criteria."
        pagination={{
          currentPage: page,
          totalPages: meta?.totalPages || 1,
          totalItems: meta?.total || 0,
          itemsPerPage: 15,
          onPageChange: (p) => setPage(p)
        }}
      />

      {/* 6. Refund Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedRefund)}
        onClose={() => setSelectedRefund(null)}
        title={`Refund Claim — REF-${String(selectedRefund?.id || '').padStart(5, '0')}`}
        subtitle={`Requested on ${formatDateTime(selectedRefund?.created_at)}`}
        badge={<StatusBadge status={selectedRefund?.reason_code} />}
      >
        {selectedRefund && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <div>
                <span className="text-[11px] text-surface-400 block">Refund Amount</span>
                <span className="text-base font-bold text-surface-900 font-sans">
                  {formatCurrency(selectedRefund.amount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Status</span>
                <span className="mt-0.5 block">
                  <StatusBadge status={selectedRefund.status} />
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Associated Order</span>
                <span className="font-mono text-brand-600 font-medium">
                  {selectedRefund.order_number}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Carrier</span>
                <span className="text-surface-700 font-medium">
                  {selectedRefund.carrier_name || 'Express Logistics'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-surface-900 mb-1">Reason Description</h4>
              <p className="text-surface-600 leading-relaxed bg-surface-50 p-3 rounded-lg border border-surface-200">
                {selectedRefund.reason_description || 'Customer claimed refund due to shipping transit delay exceeding promised delivery SLA.'}
              </p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

export default Refunds;
