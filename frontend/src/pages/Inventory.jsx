import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  Clock,
  Search,
  Truck
} from 'lucide-react';

import { useInventory } from '../hooks/useInventory';
import { formatCurrency, formatNumber } from '../utils/formatters';

import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import DetailDrawer from '../components/common/DetailDrawer';
import ErrorState from '../components/common/ErrorState';

export function Inventory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, RISKS, LOW_STOCK
  const [selectedItem, setSelectedItem] = useState(null);

  const { inventory, meta, lowStock, stockoutRisks, healthSummary, loading, error, refetch } = useInventory({
    page,
    limit: 15,
    search: search || undefined
  });

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      render: (val) => <span className="font-mono font-medium text-brand-600">{val}</span>
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (val, row) => (
        <div>
          <span className="font-medium text-surface-900 block">{val}</span>
          <span className="text-[10px] text-surface-400">{row.category_name}</span>
        </div>
      )
    },
    {
      key: 'selling_price',
      header: 'Price',
      align: 'right',
      render: (val) => <span className="font-medium text-surface-900">{formatCurrency(val)}</span>
    },
    {
      key: 'available_stock',
      header: 'Available Stock',
      align: 'right',
      render: (val, row) => (
        <div>
          <span className="font-bold text-surface-900 block">{formatNumber(val)}</span>
          <span className="text-[10px] text-surface-400">{row.reserved_stock || 0} reserved</span>
        </div>
      )
    },
    {
      key: 'reorder_point',
      header: 'Reorder Point',
      align: 'right',
      render: (val) => <span className="font-mono text-surface-600">{val}</span>
    },
    {
      key: 'supplier_name',
      header: 'Supplier & Lead Time',
      render: (val, row) => (
        <div>
          <span className="text-surface-800 font-medium block">{val || 'Domestic Hub'}</span>
          <span className="text-[10px] text-surface-400">{row.lead_time_days || 5} days lead time</span>
        </div>
      )
    },
    {
      key: 'calculated_stock_status',
      header: 'Stock Status',
      align: 'center',
      render: (val) => <StatusBadge status={val} />
    }
  ];

  if (error) {
    return <ErrorState title="Failed to load inventory data" message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Inventory Supply Chain & Stockout Risks</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Real-time stock monitoring, lead-time replenishment gaps, and demand-velocity runout projections
        </p>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active SKUs"
          value={formatNumber(healthSummary?.totalProducts || meta?.total || 0)}
          icon={Package}
          subtitle="Catalog active items"
        />
        <StatCard
          title="Total Stock Valuation"
          value={formatCurrency(healthSummary?.totalStockValuation || 0, true)}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
          subtitle="Cost basis inventory value"
        />
        <StatCard
          title="Low Stock / Reorder Point"
          value={formatNumber(healthSummary?.lowStockCount || lowStock.length || 0)}
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-amber-600"
          subtitle="Below safety threshold"
        />
        <StatCard
          title="Critical Stockout Risks"
          value={formatNumber(healthSummary?.criticalRiskCount || stockoutRisks.length || 0)}
          icon={AlertOctagon}
          iconBg="bg-red-50 text-red-600"
          subtitle="Days left < Supplier lead time"
        />
      </div>

      {/* 3. Dedicated Stockout Shortfall Risks Matrix */}
      {stockoutRisks.length > 0 && (
        <div className="card-clean p-6 space-y-4 border-red-200 bg-red-50/20">
          <div className="flex items-center justify-between pb-3 border-b border-red-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-950">Imminent Stockout Shortfall Alerts</h3>
                <p className="text-xs text-red-700">
                  Products whose current stock will exhaust prior to supplier replenishment arrival
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
              {stockoutRisks.length} Critical SKUs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockoutRisks.map((item) => (
              <div
                key={item.productId}
                className="bg-white p-4 rounded-xl border border-red-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[11px] text-brand-600 font-bold block">{item.sku}</span>
                    <h4 className="text-xs font-bold text-surface-900 mt-0.5 line-clamp-1">{item.productName}</h4>
                  </div>
                  <StatusBadge status={item.stockRiskStatus} />
                </div>

                <div className="grid grid-cols-2 gap-2 bg-surface-50 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-surface-400 block">Available</span>
                    <span className="font-bold text-surface-800">{item.availableStock} units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-surface-400 block">Daily Demand</span>
                    <span className="font-bold text-surface-800">{item.avgDailyVelocity} units/day</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-surface-400 block">Days Left</span>
                    <span className="font-bold text-red-600">{item.daysOfInventoryRemaining} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-surface-400 block">Supplier Lead</span>
                    <span className="font-bold text-surface-800">{item.supplierLeadTimeDays} days</span>
                  </div>
                </div>

                {item.leadTimeGapDays > 0 && (
                  <div className="p-2 rounded bg-red-50 text-red-800 text-[11px] flex justify-between font-medium">
                    <span>Lead-Time Deficit:</span>
                    <span className="font-bold text-red-700">~{item.leadTimeGapDays} days gap ({formatCurrency(item.projectedLostRevenueInGap, true)} risk)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab Selector & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'ALL' ? 'bg-white text-surface-900 shadow-sm font-semibold' : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => setActiveTab('RISKS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'RISKS' ? 'bg-white text-surface-900 shadow-sm font-semibold' : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            Stockout Risks ({stockoutRisks.length})
          </button>
          <button
            onClick={() => setActiveTab('LOW_STOCK')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'LOW_STOCK' ? 'bg-white text-surface-900 shadow-sm font-semibold' : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            Low Stock ({lowStock.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU or product..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* 5. Inventory DataTable */}
      <DataTable
        columns={columns}
        data={activeTab === 'RISKS' ? stockoutRisks : activeTab === 'LOW_STOCK' ? lowStock : inventory}
        loading={loading}
        onRowClick={(row) => setSelectedItem(row)}
        emptyTitle="No inventory items found"
        emptyDescription="Try adjusting your search query or status filter."
        pagination={{
          currentPage: page,
          totalPages: meta?.totalPages || 1,
          totalItems: meta?.total || 0,
          itemsPerPage: 15,
          onPageChange: (p) => setPage(p)
        }}
      />

      {/* 6. Product Detail Drawer */}
      <DetailDrawer
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || selectedItem?.productName}
        subtitle={`SKU: ${selectedItem?.sku}`}
        badge={<StatusBadge status={selectedItem?.calculated_stock_status || selectedItem?.stockRiskStatus} />}
      >
        {selectedItem && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-50 border border-surface-200">
              <div>
                <span className="text-[11px] text-surface-400 block">Available Units</span>
                <span className="text-base font-bold text-surface-900 font-sans">
                  {selectedItem.available_stock || selectedItem.availableStock}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Selling Price</span>
                <span className="text-base font-bold text-surface-900 font-sans">
                  {formatCurrency(selectedItem.selling_price || selectedItem.sellingPrice || 1499)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Reorder Point</span>
                <span className="font-mono text-surface-800">
                  {selectedItem.reorder_point || selectedItem.reorderPoint || 25} units
                </span>
              </div>
              <div>
                <span className="text-[11px] text-surface-400 block">Reorder Quantity</span>
                <span className="font-mono text-surface-800">
                  {selectedItem.reorder_quantity || selectedItem.reorderQuantity || 200} units
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-surface-900 mb-2">Supplier & Replenishment</h4>
              <div className="p-3.5 rounded-lg border border-surface-200 bg-white space-y-2">
                <div className="flex justify-between">
                  <span className="text-surface-500">Supplier Name:</span>
                  <span className="font-medium text-surface-900">{selectedItem.supplier_name || selectedItem.supplierName || 'Coimbatore Precision Gear'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Replenishment Lead Time:</span>
                  <span className="font-bold text-surface-900">{selectedItem.lead_time_days || selectedItem.supplierLeadTimeDays || 5} days</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

export default Inventory;
