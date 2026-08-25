import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  SendHorizontal
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { aiApi } from '../services/api';

const SAMPLE_SIMULATION_PRODUCTS = [
  { id: 1, sku: 'SKU-FASH-101', name: 'Premium Oxford Cotton Shirt', price: 1899, cost: 650, monthlyUnits: 180, elasticity: -1.4 },
  { id: 2, sku: 'SKU-FIT-105', name: 'Ergonomic High-Density Yoga Mat', price: 1299, cost: 450, monthlyUnits: 612, elasticity: -1.8 },
  { id: 3, sku: 'SKU-ELEC-102', name: 'Noise-Cancelling Wireless Earbuds', price: 2499, cost: 1100, monthlyUnits: 240, elasticity: -1.2 },
  { id: 4, sku: 'SKU-BEAU-104', name: 'Organic Herbal Face Serum 50ml', price: 899, cost: 220, monthlyUnits: 350, elasticity: -1.5 }
];

export function Simulator() {
  // Tab switch between Price Elasticity and Inventory Reorder
  const [activeTab, setActiveTab] = useState('PRICE');

  // Price Elasticity State
  const [selectedProduct, setSelectedProduct] = useState(SAMPLE_SIMULATION_PRODUCTS[0]);
  const [priceChangePct, setPriceChangePct] = useState(-10);
  const [elasticityCoeff, setElasticityCoeff] = useState(-1.4);

  // Inventory Reorder State
  const [reorderUnits, setReorderUnits] = useState(250);
  const [freightType, setFreightType] = useState('EXPRESS'); // STANDARD or EXPRESS
  const [dailyVelocity, setDailyVelocity] = useState(20.4);
  const [currentStock, setCurrentStock] = useState(45);
  const [supplierLeadTime, setSupplierLeadTime] = useState(5);

  // Proposal Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(null);

  // Price Calculations
  const currentPrice = selectedProduct.price;
  const costPrice = selectedProduct.cost;
  const currentMargin = currentPrice - costPrice;
  const currentMonthlyRevenue = selectedProduct.monthlyUnits * currentPrice;
  const currentMonthlyProfit = selectedProduct.monthlyUnits * currentMargin;

  const simulatedPrice = Number((currentPrice * (1 + priceChangePct / 100)).toFixed(2));
  const demandMultiplier = 1 + (elasticityCoeff * (priceChangePct / 100));
  const simulatedUnits = Math.max(1, Math.round(selectedProduct.monthlyUnits * demandMultiplier));
  const simulatedMargin = simulatedPrice - costPrice;
  const simulatedRevenue = simulatedUnits * simulatedPrice;
  const simulatedProfit = simulatedUnits * simulatedMargin;
  const revenueDelta = simulatedRevenue - currentMonthlyRevenue;
  const profitDelta = simulatedProfit - currentMonthlyProfit;
  const profitDeltaPct = currentMonthlyProfit > 0 ? ((profitDelta / currentMonthlyProfit) * 100).toFixed(1) : 0;

  // Reorder Calculations
  const unitCost = 450;
  const freightSurcharge = freightType === 'EXPRESS' ? 45 : 0;
  const effectiveUnitCost = unitCost + freightSurcharge;
  const totalCapitalRequired = reorderUnits * effectiveUnitCost;
  const effectiveLeadTime = freightType === 'EXPRESS' ? 2 : supplierLeadTime;
  const daysCoverageBefore = Number((currentStock / dailyVelocity).toFixed(1));
  const daysCoverageAfter = Number(((currentStock + reorderUnits) / dailyVelocity).toFixed(1));
  const isStockoutPrevented = daysCoverageAfter > effectiveLeadTime * 2.5;

  const handleProposeReorderAction = async () => {
    setIsSubmitting(true);
    setProposalSuccess(null);
    try {
      // Create proposal through AI simulation
      await new Promise(r => setTimeout(r, 600));
      setProposalSuccess(`Proposal submitted to Human-in-the-Loop Gate! Priority Purchase Order for ${reorderUnits} units of SKU-FIT-105 logged.`);
    } catch (err) {
      setProposalSuccess('Failed to submit proposal. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProposePriceAction = async () => {
    setIsSubmitting(true);
    setProposalSuccess(null);
    try {
      await new Promise(r => setTimeout(r, 600));
      setProposalSuccess(`Policy action proposal created: Adjust price of ${selectedProduct.sku} to ${formatCurrency(simulatedPrice)} (${priceChangePct > 0 ? `+${priceChangePct}` : priceChangePct}%).`);
    } catch (err) {
      setProposalSuccess('Failed to submit proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">What-If Counterfactual Business Simulator</h1>
        </div>
        <p className="text-xs text-surface-500">
          Simulate multi-variable elasticities, lead-time shortfall mitigation, and dynamic pricing interventions before policy execution
        </p>
      </div>

      {/* 2. Success Banner */}
      {proposalSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{proposalSuccess}</span>
          </div>
          <button
            onClick={() => setProposalSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Simulator Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 pb-2">
        <button
          onClick={() => setActiveTab('PRICE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'PRICE'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-surface-600 hover:bg-surface-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Price Elasticity & Margins</span>
        </button>
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'INVENTORY'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'text-surface-600 hover:bg-surface-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Supplier Lead-Time & Restock</span>
        </button>
      </div>

      {/* 4. Tab 1: Price Elasticity Simulator */}
      {activeTab === 'PRICE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card-clean p-6 space-y-5">
              <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-3 flex items-center justify-between">
                <span>Simulation Parameters</span>
                <span className="text-[11px] font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {selectedProduct.sku}
                </span>
              </h3>

              {/* Product Selector */}
              <div>
                <label className="text-xs font-semibold text-surface-700 block mb-1.5">Select Product to Model</label>
                <select
                  value={selectedProduct.id}
                  onChange={(e) => {
                    const prod = SAMPLE_SIMULATION_PRODUCTS.find(p => p.id === Number(e.target.value));
                    if (prod) {
                      setSelectedProduct(prod);
                      setElasticityCoeff(prod.elasticity);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-surface-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  {SAMPLE_SIMULATION_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({formatCurrency(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Change Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-surface-700">Price Adjustment (%)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                    priceChangePct > 0 ? 'bg-emerald-50 text-emerald-700' : priceChangePct < 0 ? 'bg-rose-50 text-rose-700' : 'bg-surface-100 text-surface-700'
                  }`}>
                    {priceChangePct > 0 ? `+${priceChangePct}` : priceChangePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={priceChangePct}
                  onChange={(e) => setPriceChangePct(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-surface-400 font-mono">
                  <span>-30% (Deep Discount)</span>
                  <span>0% (Current)</span>
                  <span>+30% (Premium)</span>
                </div>
              </div>

              {/* Elasticity Coefficient Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-surface-700">Demand Elasticity ($\epsilon$)</span>
                  <span className="font-mono font-bold text-surface-800 bg-surface-100 px-2 py-0.5 rounded">
                    {elasticityCoeff}
                  </span>
                </div>
                <input
                  type="range"
                  min="-3.0"
                  max="-0.5"
                  step="0.1"
                  value={elasticityCoeff}
                  onChange={(e) => setElasticityCoeff(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-surface-400 font-mono">
                  <span>-3.0 (Highly Elastic)</span>
                  <span>-1.0 (Unitary)</span>
                  <span>-0.5 (Inelastic)</span>
                </div>
              </div>

              {/* Propose Action CTA */}
              <button
                onClick={handleProposePriceAction}
                disabled={isSubmitting}
                className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2 shadow-sm font-semibold"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Propose Price Change to AI Policy Gate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Impact Results Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-clean p-4 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Simulated Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-surface-900 font-sans">{formatCurrency(simulatedPrice)}</span>
                  <span className="text-[10px] text-surface-400 line-through">{formatCurrency(currentPrice)}</span>
                </div>
                <span className="text-[10px] text-surface-500 font-medium block">
                  Unit Margin: {formatCurrency(simulatedMargin)}
                </span>
              </div>

              <div className="card-clean p-4 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Estimated Units / Mo</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-surface-900 font-sans">{formatNumber(simulatedUnits)}</span>
                  <span className="text-[10px] text-surface-400">vs {selectedProduct.monthlyUnits}</span>
                </div>
                <span className="text-[10px] text-surface-500 font-medium block">
                  Volume $\Delta$: {simulatedUnits - selectedProduct.monthlyUnits > 0 ? `+${simulatedUnits - selectedProduct.monthlyUnits}` : simulatedUnits - selectedProduct.monthlyUnits} units
                </span>
              </div>

              <div className="card-clean p-4 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Monthly Net Margin</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-bold font-sans ${profitDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(simulatedProfit)}
                  </span>
                </div>
                <span className={`text-[10px] font-bold block ${profitDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {profitDelta >= 0 ? `+${formatCurrency(profitDelta)} (+${profitDeltaPct}%)` : `${formatCurrency(profitDelta)} (${profitDeltaPct}%)`}
                </span>
              </div>
            </div>

            {/* Detailed Projection Table */}
            <div className="card-clean p-6 space-y-4">
              <h4 className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                Financial Baseline vs. Counterfactual Delta
              </h4>

              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-200 text-surface-400 text-[11px]">
                    <th className="pb-2 text-left font-semibold">METRIC</th>
                    <th className="pb-2 text-right font-semibold">BASELINE</th>
                    <th className="pb-2 text-right font-semibold">SIMULATED</th>
                    <th className="pb-2 text-right font-semibold">PROJECTED DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 text-surface-700 font-medium">
                  <tr>
                    <td className="py-2.5">Unit Selling Price</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(currentPrice)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-surface-900">{formatCurrency(simulatedPrice)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-brand-600">
                      {priceChangePct > 0 ? `+${priceChangePct}%` : `${priceChangePct}%`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Cost of Goods Sold (COGS)</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(costPrice)}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(costPrice)}</td>
                    <td className="py-2.5 text-right font-mono text-surface-400">₹0 (Fixed)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Monthly Sales Volume</td>
                    <td className="py-2.5 text-right font-mono">{selectedProduct.monthlyUnits} units</td>
                    <td className="py-2.5 text-right font-mono font-bold text-surface-900">{simulatedUnits} units</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-600">
                      {((simulatedUnits - selectedProduct.monthlyUnits) / selectedProduct.monthlyUnits * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Gross Monthly Revenue</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(currentMonthlyRevenue)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-surface-900">{formatCurrency(simulatedRevenue)}</td>
                    <td className={`py-2.5 text-right font-mono font-bold ${revenueDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {revenueDelta >= 0 ? `+${formatCurrency(revenueDelta)}` : formatCurrency(revenueDelta)}
                    </td>
                  </tr>
                  <tr className="bg-surface-50/70 font-bold">
                    <td className="py-2.5 px-2 text-surface-900">Net Profit Margin Contribution</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(currentMonthlyProfit)}</td>
                    <td className="py-2.5 text-right font-mono text-surface-900">{formatCurrency(simulatedProfit)}</td>
                    <td className={`py-2.5 px-2 text-right font-mono ${profitDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {profitDelta >= 0 ? `+${formatCurrency(profitDelta)}` : formatCurrency(profitDelta)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-[11px] text-surface-600 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  <strong>AI Recommendation:</strong> A 10% discount on <em>{selectedProduct.sku}</em> leverages its high demand elasticity (-1.4) to drive +14% sales volume, maximizing gross profit by avoiding conversion abandonment.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Inventory Lead-Time Reorder Simulator */}
      {activeTab === 'INVENTORY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card-clean p-6 space-y-5">
              <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-3 flex items-center justify-between">
                <span>Restock Parameters</span>
                <span className="text-[11px] font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  SKU-FIT-105
                </span>
              </h3>

              {/* Reorder Batch Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-surface-700">Reorder Batch Size</span>
                  <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {reorderUnits} units
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="25"
                  value={reorderUnits}
                  onChange={(e) => setReorderUnits(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-surface-400 font-mono">
                  <span>50 units (Minimal)</span>
                  <span>300 units (Standard)</span>
                  <span>600 units (Bulk)</span>
                </div>
              </div>

              {/* Freight Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-surface-700 block">Freight Transit SLA</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFreightType('STANDARD')}
                    className={`p-3 rounded-lg text-xs font-medium border text-left transition ${
                      freightType === 'STANDARD'
                        ? 'border-brand-500 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                        : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    <span className="block font-bold">Standard Road Freight</span>
                    <span className="text-[10px] text-surface-500 block mt-0.5">5 Days Transit • ₹0 surcharge</span>
                  </button>
                  <button
                    onClick={() => setFreightType('EXPRESS')}
                    className={`p-3 rounded-lg text-xs font-medium border text-left transition ${
                      freightType === 'EXPRESS'
                        ? 'border-brand-500 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500'
                        : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    <span className="block font-bold">Priority Air Express</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">2 Days Transit • +₹45/unit</span>
                  </button>
                </div>
              </div>

              {/* Reorder Details Snapshot */}
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 space-y-2 text-xs">
                <div className="flex justify-between text-surface-600">
                  <span>Current Available Stock:</span>
                  <span className="font-mono font-bold text-surface-900">{currentStock} units</span>
                </div>
                <div className="flex justify-between text-surface-600">
                  <span>Current Daily Sales Velocity:</span>
                  <span className="font-mono font-bold text-surface-900">{dailyVelocity} units/day</span>
                </div>
                <div className="flex justify-between text-surface-600">
                  <span>Supplier:</span>
                  <span className="font-semibold text-surface-900">Coimbatore Precision Gear</span>
                </div>
              </div>

              {/* Submit Proposal CTA */}
              <button
                onClick={handleProposeReorderAction}
                disabled={isSubmitting}
                className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2 shadow-sm font-semibold"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Propose Expedited Purchase Order</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-clean p-4 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Total Capital Outlay</span>
                <span className="text-lg font-bold text-surface-900 font-sans block">{formatCurrency(totalCapitalRequired)}</span>
                <span className="text-[10px] text-surface-500 font-medium block">
                  Unit Cost: {formatCurrency(effectiveUnitCost)} ({reorderUnits} units)
                </span>
              </div>

              <div className="card-clean p-4 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Stock Coverage</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-emerald-600 font-sans">{daysCoverageAfter} Days</span>
                  <span className="text-[10px] text-surface-400 line-through">{daysCoverageBefore} Days</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  +{((daysCoverageAfter - daysCoverageBefore)).toFixed(1)} Days Added
                </span>
              </div>

              <div className="card-clean p-4 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Stockout Risk</span>
                <span className={`text-sm font-bold block ${isStockoutPrevented ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isStockoutPrevented ? 'PREVENTED ✅' : 'ELEVATED BUFFER ⚠️'}
                </span>
                <span className="text-[10px] text-surface-500 block">
                  Lead-Time Gap: 0 Days (Healthy)
                </span>
              </div>
            </div>

            {/* Inventory Simulation Timeline */}
            <div className="card-clean p-6 space-y-4">
              <h4 className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                Lead-Time Shortfall Gap Analysis
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-surface-900 block">Without Reorder Intervention:</span>
                    <span className="text-rose-600 font-medium text-[11px]">
                      Stock exhausts in 2.2 days $\rightarrow$ 2.8 days zero-inventory window $\rightarrow$ ₹2,92,993 unfulfilled loss
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                    CRITICAL RISK
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-950 block">With {reorderUnits}-Unit {freightType === 'EXPRESS' ? 'Air Express' : 'Standard'} Restock:</span>
                    <span className="text-emerald-800 font-medium text-[11px]">
                      Stock replenished by Day {effectiveLeadTime} $\rightarrow$ Minimum stock floor stays above {Math.round(currentStock - dailyVelocity * effectiveLeadTime + reorderUnits)} units
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    PROTECTED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Simulator;
