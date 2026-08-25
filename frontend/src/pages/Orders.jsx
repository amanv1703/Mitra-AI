import React, { useState } from 'react';
import {
  ShoppingBag,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  MapPin
} from 'lucide-react';

import { useOrders } from '../hooks/useOrders';
import { formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime } from '../utils/formatters';

import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import DetailDrawer from '../components/common/DetailDrawer';
import ErrorState from '../components/common/ErrorState';

export function Orders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { orders, meta, summary, loading, error, refetch } = useOrders({
    page,
    limit: 15,
    status: statusFilter || undefined,
    deliveryStatus: deliveryFilter || undefined,
    city: cityFilter || undefined,
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
      key: 'order_number',
      header: 'Order #',
      render: (val, row) => (
        <span className="font-mono font-medium text-brand-600">
          {val || `ORD-2026-${row.id}`}
        </span>
      )
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
      header: 'Destination',
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-surface-700">
          <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0" />
          <span>{val || '—'}, {row.shipping_state}</span>
        </div>
      )
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      align: 'right',
      sortable: true,
      render: (val) => <span className="font-bold text-surface-900">{formatCurrency(val)}</span>
    },
    {
      key: 'status',
      header: 'Order Status',
      align: 'center',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'delivery_status',
      header: 'Fulfillment / SLA',
      align: 'center',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'carrier_name',
      header: 'Carrier',
      render: (val) => <span className="text-surface-600 text-xs">{val || 'Express Rail'}</span>
    },
    {
      key: 'order_date',
      header: 'Order Date',
      sortable: true,
      render: (val) => <span className="text-surface-500">{formatDate(val)}</span>
    }
  ];

  if (error) {
    return <ErrorState title="Failed to load orders data" message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Order Fulfillment & Logistics SLAs</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Order lifecycle monitoring, carrier transit tracking, and regional delivery metrics
        </p>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={formatNumber(summary?.totalOrders || 0)}
          icon={ShoppingBag}
          subtitle="Processed in window"
        />
        <StatCard
          title="Completed Deliveries"
          value={formatNumber(summary?.completedOrders || 0)}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
          subtitle="Fulfilled & confirmed"
        />
        <StatCard
          title="Pending Fulfillment"
          value={formatNumber(summary?.pendingOrders || 0)}
          icon={Clock}
          iconBg="bg-amber-50 text-amber-600"
          subtitle="In picking or transit"
        />
        <StatCard
          title="Carrier Delayed Deliveries"
          value={formatNumber(summary?.delayedDeliveries || 0)}
          icon={AlertCircle}
          iconBg={summary?.delayedDeliveries > 100 ? 'bg-red-50 text-red-600' : 'bg-surface-100 text-surface-600'}
          subtitle="Breached delivery SLA"
        />
      </div>

      {/* 3. Filters & Controls */}
      <div className="card-clean p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Order Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Order Statuses</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SHIPPED">Shipped</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Delivery Status */}
          <select
            value={deliveryFilter}
            onChange={(e) => { setDeliveryFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Delivery Statuses</option>
            <option value="DELIVERED">On-Time Delivered</option>
            <option value="DELAYED">Carrier Delayed</option>
            <option value="FAILED">Delivery Failed</option>
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Bhopal">Bhopal (Regional Delay Hub)</option>
            <option value="Chennai">Chennai</option>
            <option value="Kolkata">Kolkata</option>
          </select>
        </div>
      </div>

      {/* 4. Orders DataTable */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        onRowClick={(row) => setSelectedOrder(row)}
        emptyTitle="No orders found"
        emptyDescription="No orders matched your selected filters."
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

      {/* 5. Order Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details — ${selectedOrder?.order_number || `ORD-2026-${selectedOrder?.id}`}`}
        subtitle={`Placed on ${formatDateTime(selectedOrder?.order_date)}`}
        badge={<StatusBadge status={selectedOrder?.status} />}
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            {/* Overview Box */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <div>
                <span className="text-[11px] text-surface-400 block">Total Amount</span>
                <span className="text-base font-bold text-surface-900 font-sans">
                  {formatCurrency(selectedOrder.total_amount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Delivery SLA</span>
                <span className="mt-0.5 block">
                  <StatusBadge status={selectedOrder.delivery_status} />
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Carrier</span>
                <span className="font-medium text-surface-800">
                  {selectedOrder.carrier_name || 'Delhivery Logistics'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Promised Delivery</span>
                <span className="text-surface-700">
                  {formatDate(selectedOrder.promised_delivery_date)}
                </span>
              </div>
            </div>

            {/* Destination Address */}
            <div>
              <h4 className="font-semibold text-surface-900 mb-2">Shipping Destination</h4>
              <div className="p-3.5 rounded-lg border border-surface-200 bg-white space-y-1">
                <span className="font-medium text-surface-900 block">{selectedOrder.customer_name}</span>
                <p className="text-surface-600 leading-relaxed">
                  {selectedOrder.shipping_address || 'Plot 42, Industrial Area'}, {selectedOrder.shipping_city}, {selectedOrder.shipping_state} — {selectedOrder.shipping_pincode || '400001'}
                </p>
              </div>
            </div>

            {/* Order Items Mock / Summary */}
            <div>
              <h4 className="font-semibold text-surface-900 mb-2">Fulfillment Items</h4>
              <div className="p-3.5 rounded-lg border border-surface-200 bg-white space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-surface-100">
                  <span className="font-medium text-surface-800">Standard Fulfillment Package</span>
                  <span className="font-bold text-surface-900">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between text-surface-500 text-[11px]">
                  <span>Discount Applied:</span>
                  <span>{formatCurrency(selectedOrder.discount_amount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

export default Orders;
