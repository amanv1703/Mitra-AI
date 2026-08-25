import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Crown,
  ShieldAlert,
  Search,
  MapPin,
  Calendar
} from 'lucide-react';

import { useCustomers } from '../hooks/useCustomers';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import DetailDrawer from '../components/common/DetailDrawer';
import ErrorState from '../components/common/ErrorState';

export function Customers() {
  const [page, setPage] = useState(1);
  const [segmentFilter, setSegmentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, AT_RISK
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { customers, meta, atRiskData, loading, error, refetch } = useCustomers({
    page,
    limit: 15,
    segment: segmentFilter || undefined,
    search: search || undefined
  });

  const columns = [
    {
      key: 'customer_code',
      header: 'Customer ID',
      render: (val) => <span className="font-mono font-medium text-brand-600">{val}</span>
    },
    {
      key: 'first_name',
      header: 'Name',
      render: (val, row) => (
        <div>
          <span className="font-medium text-surface-900 block">{val} {row.last_name}</span>
          <span className="text-[10px] text-surface-400">{row.email}</span>
        </div>
      )
    },
    {
      key: 'city',
      header: 'City / State',
      render: (val, row) => (
        <span className="text-surface-700 text-xs">{val}, {row.state}</span>
      )
    },
    {
      key: 'segment',
      header: 'Cohort Tier',
      align: 'center',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'total_orders_count',
      header: 'Orders',
      align: 'right',
      render: (val) => <span className="font-mono font-medium text-surface-800">{val}</span>
    },
    {
      key: 'total_spend',
      header: 'Lifetime Spend (LTV)',
      align: 'right',
      render: (val) => <span className="font-bold text-surface-900">{formatCurrency(val)}</span>
    },
    {
      key: 'last_order_date',
      header: 'Last Purchase',
      render: (val) => <span className="text-surface-500">{formatDate(val)}</span>
    }
  ];

  if (error) {
    return <ErrorState title="Failed to load customer telemetry" message={error} onRetry={refetch} />;
  }

  const atRiskList = atRiskData?.customers || [];

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Customer Cohorts & Churn Prevention</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Customer lifetime value, cohort segmentation, and friction-induced churn signals
        </p>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered"
          value={formatNumber(meta?.total || 5000)}
          icon={Users}
          subtitle="Customer database"
        />
        <StatCard
          title="Active Buyers (90d)"
          value={formatNumber(4820)}
          icon={UserCheck}
          iconBg="bg-emerald-50 text-emerald-600"
          subtitle="96.4% activity retention"
        />
        <StatCard
          title="Loyal / VIP Cohort"
          value={formatNumber(1250)}
          icon={Crown}
          iconBg="bg-blue-50 text-blue-600"
          subtitle="Top 25% revenue drivers"
        />
        <StatCard
          title="At-Risk Friction Churn"
          value={formatNumber(atRiskData?.totalAtRiskCount || atRiskList.length || 65)}
          icon={ShieldAlert}
          iconBg="bg-red-50 text-red-600"
          subtitle={`${formatCurrency(atRiskData?.totalSpendAtRisk || 210000, true)} spend at risk`}
        />
      </div>

      {/* 3. At-Risk VIP Churn Banner / Card */}
      {atRiskList.length > 0 && (
        <div className="card-clean p-6 border-red-200 bg-red-50/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-red-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-950">High-Value VIP Friction Churn Alert</h3>
                <p className="text-xs text-red-700">
                  65 VIP customers experienced &ge; 2 consecutive checkout payment failures during the gateway spike and have since remained inactive.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
              {atRiskList.length} At-Risk VIPs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {atRiskList.slice(0, 3).map((cust) => (
              <div
                key={cust.customerId}
                className="bg-white p-3.5 rounded-xl border border-red-200 shadow-sm space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-xs text-surface-900 block">{cust.name}</span>
                    <span className="text-[10px] text-surface-400 font-mono">{cust.customerCode}</span>
                  </div>
                  <StatusBadge status="CRITICAL_FRICTION" />
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-surface-100">
                  <span className="text-surface-500">Historical LTV:</span>
                  <span className="font-bold text-surface-900">{formatCurrency(cust.totalSpend)}</span>
                </div>
                <div className="flex justify-between text-xs text-red-600 font-medium">
                  <span>Failed Attempts:</span>
                  <span>{cust.recentPaymentFailures} Drops ({cust.daysSinceLastOrder}d inactive)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Controls & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'ALL' ? 'bg-white text-surface-900 shadow-sm font-semibold' : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            All Customers
          </button>
          <button
            onClick={() => setActiveTab('AT_RISK')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'AT_RISK' ? 'bg-white text-surface-900 shadow-sm font-semibold' : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            At-Risk Churn Cohort ({atRiskList.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* 5. Customer Table */}
      <DataTable
        columns={columns}
        data={activeTab === 'AT_RISK' ? atRiskList : customers}
        loading={loading}
        onRowClick={(row) => setSelectedCustomer(row)}
        emptyTitle="No customers found"
        emptyDescription="No customer accounts matched your search criteria."
        pagination={{
          currentPage: page,
          totalPages: meta?.totalPages || 1,
          totalItems: meta?.total || 0,
          itemsPerPage: 15,
          onPageChange: (p) => setPage(p)
        }}
      />

      {/* 6. Customer Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || `${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`}
        subtitle={`Customer Code: ${selectedCustomer?.customer_code || selectedCustomer?.customerCode}`}
        badge={<StatusBadge status={selectedCustomer?.segment} />}
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <div>
                <span className="text-[11px] text-surface-400 block">Lifetime Value</span>
                <span className="text-base font-bold text-surface-900 font-sans">
                  {formatCurrency(selectedCustomer.total_spend || selectedCustomer.totalSpend)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Completed Orders</span>
                <span className="text-base font-bold text-surface-900 font-sans">
                  {selectedCustomer.total_orders_count || selectedCustomer.totalOrders || 1}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">City</span>
                <span className="text-surface-800 font-medium">
                  {selectedCustomer.city}, {selectedCustomer.state}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Last Purchase</span>
                <span className="text-surface-800">
                  {formatDate(selectedCustomer.last_order_date || selectedCustomer.lastOrderDate)}
                </span>
              </div>
            </div>

            {selectedCustomer.recentPaymentFailures >= 2 && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
                <span className="font-bold block">Checkout Friction Detected</span>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Customer experienced repeated checkout failures ({selectedCustomer.recentPaymentFailures} failed attempts) during previous purchase sessions.
                </p>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

export default Customers;
