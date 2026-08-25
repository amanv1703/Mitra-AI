import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ShieldCheck, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

const SAMPLE_INSIGHTS = [
  {
    code: 'SCN-001',
    title: 'Payment Failure Spike on Netbanking Routes',
    domain: 'PAYMENTS',
    severity: 'HIGH',
    impact: '₹3,20,000',
    root_cause: 'Bank-specific timeout on HDFC Netbanking gateway over 5-day window.',
    evidence: 'Failure rate jumped from 7.8% baseline to 28.5% (450+ dropped checkouts).',
    action: {
      type: 'SWITCH_PAYMENT_ROUTING',
      risk: 'LOW',
      details: 'Reroute HDFC netbanking to secondary gateway and activate UPI intent fallback.'
    }
  },
  {
    code: 'SCN-002',
    title: 'Hero Product SKU-FASH-101 Stockout',
    domain: 'INVENTORY',
    severity: 'CRITICAL',
    impact: '₹1,85,000',
    root_cause: 'Sales velocity spike consumed safety stock 4 days before supplier replenishment.',
    evidence: 'SKU accounts for 22.8% of gross revenue. 6 days zero-inventory resulted in 120 unfulfilled orders.',
    action: {
      type: 'INVENTORY_REORDER',
      risk: 'MEDIUM',
      details: 'Dispatch expedited reorder of 300 units to Vardhman Textiles Hub.'
    }
  },
  {
    code: 'SCN-003',
    title: 'Bhopal Logistics Delay Driving 19.4% Refund Surge',
    domain: 'REFUNDS',
    severity: 'HIGH',
    impact: '₹1,45,000',
    root_cause: 'Bhopal Hub Logistics courier SLA breach (>6 days transit delay).',
    evidence: 'City refund rate rose from 3.2% to 19.4%. 85% of returns cited DELIVERY_DELAY.',
    action: {
      type: 'NOTIFY_CARRIER_ISSUE',
      risk: 'LOW',
      details: 'Escalate carrier SLA breach and send automated proactive tracking updates to buyers.'
    }
  },
  {
    code: 'SCN-004',
    title: 'Supplier Batch Quality Defect for Wireless Earbuds',
    domain: 'SUPPLIERS',
    severity: 'HIGH',
    impact: '₹1,10,000',
    root_cause: 'Batch #NC-2024-B9 audio driver manufacturing defect from Noida Tech Components.',
    evidence: 'Return rate surged from 2.1% to 24.8% with 82% DAMAGED_PRODUCT reason codes.',
    action: {
      type: 'FLAG_DEFECTIVE_BATCH',
      risk: 'MEDIUM',
      details: 'Quarantine remaining batch inventory and issue reimbursement claim to supplier.'
    }
  },
  {
    code: 'SCN-005',
    title: 'High-Value VIP Customer Churn Alert',
    domain: 'CUSTOMERS',
    severity: 'HIGH',
    impact: '₹2,10,000',
    root_cause: 'Loyal customer segment experienced >=2 consecutive payment gateway drops.',
    evidence: '65 VIP customers became inactive (0 orders in last 25 days) after failed checkouts.',
    action: {
      type: 'CUSTOMER_RECOVERY_CAMPAIGN',
      risk: 'LOW',
      details: 'Trigger personalized VIP recovery WhatsApp & email with exclusive apology benefit.'
    }
  },
  {
    code: 'SCN-006',
    title: 'Impending Stockout Risk for Ergonomic Yoga Mat',
    domain: 'INVENTORY',
    severity: 'CRITICAL',
    impact: '₹85,000',
    root_cause: '140% viral demand increase will deplete remaining 45 units in 2.2 days vs 5-day supplier lead time.',
    evidence: 'Current daily velocity: 20.4 units/day. Lead time shortfall: 2.8 days.',
    action: {
      type: 'INVENTORY_REORDER',
      risk: 'HIGH',
      details: 'Emergency air-freight restock of 250 units from Coimbatore Precision Gear.'
    }
  }
];

export default function AIInsights() {
  const [insights, setInsights] = useState(SAMPLE_INSIGHTS);
  const [approvedMap, setApprovedMap] = useState({});

  const handleApprove = (code) => {
    setApprovedMap(prev => ({ ...prev, [code]: 'APPROVED' }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-400" />
          Autonomous AI Insights & Causal Analysis
        </h1>
        <p className="text-slate-400 text-sm">
          Problems discovered autonomously through cross-domain telemetry correlation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {insights.map(item => (
          <div key={item.code} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                  {item.code}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  item.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {item.severity}
                </span>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Est. Business Impact: </span>
                <span className="text-sm font-bold text-rose-400 font-mono">{item.impact}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <p className="text-slate-400 font-medium mb-1">🔍 Root Cause Hypothesis:</p>
                <p className="text-slate-200">{item.root_cause}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <p className="text-slate-400 font-medium mb-1">📊 Verifiable Telemetry Evidence:</p>
                <p className="text-slate-200">{item.evidence}</p>
              </div>
            </div>

            {/* Proposed Bounded Action */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-emerald-400 font-semibold font-mono">RECOMMENDED ACTION:</span>
                  <span className="text-slate-300 font-mono">[{item.action.type}]</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    item.action.risk === 'HIGH' ? 'bg-rose-900/60 text-rose-300' : item.action.risk === 'MEDIUM' ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'
                  }`}>
                    {item.action.risk} RISK
                  </span>
                </div>
                <p className="text-slate-300">{item.action.details}</p>
              </div>

              <div>
                {approvedMap[item.code] === 'APPROVED' ? (
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-xs px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800">
                    <CheckCircle className="w-4 h-4" />
                    <span>APPROVED & AUDITED</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleApprove(item.code)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-md shadow-emerald-500/10"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve & Execute</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
