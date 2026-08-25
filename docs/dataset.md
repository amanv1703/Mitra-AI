# MITRA AI — Synthetic Dataset & Scenario Injection Specification

## 1. Generation Methodology & Determinism
The MITRA AI dataset is generated deterministically using a seeded pseudo-random number generator (PRNG - Mulberry32) with fixed seed `42`. This guarantees:
- Identical rows, customer IDs, timestamps, and order totals across any machine or environment.
- Verifiable mathematical scenarios with zero random drift.
- Full reproducibility for Buildathon judges, automated grading scripts, and unit tests.

---

## 2. Statistical Baseline Distributions

| Entity | Scale | Statistical Characteristics |
|---|---|---|
| **Customers** | 5,000 | 45% New, 35% Regular, 15% Loyal VIP, 5% At-Risk. Distributed across 12 Indian urban clusters. |
| **Products** | 300 | 6 Categories (50 SKUs each). Prices: ₹150 to ₹9,500. Markups: 1.4x to 2.8x over cost. |
| **Suppliers** | 10 | Lead times: 3 to 10 days. Reliability scores: 0.76 to 0.98. |
| **Orders** | ~18,695 | 90-day time window. Weekend surge factor (+25% volume). Average order size: 1.6 items. |
| **Order Items** | ~29,730 | Line item quantities: 1 (85%), 2 (12%), 3 (3%). |
| **Payments** | ~18,695 | Methods: UPI (65%), Cards (25%), Netbanking (10%). Baseline failure rate: 7.8%. |
| **Refunds** | ~681 | Baseline refund rate: 3.2% across standard operations. |
| **Inventory Movements**| ~28,182 | Full double-entry stock ledger for all sales, returns, restocks, and damages. |

---

## 3. The 6 Injected Hidden Business Scenarios

### Scenario 1: Payment Gateway Timeout Spike (`SCN-001`)
- **Time Window**: Day 60 to Day 64 (5 days)
- **Anomaly**: Payment failure rate jumps from **7.8%** baseline to **28.5%**.
- **Root Cause**: Issuer Netbanking timeout on HDFC gateway route.
- **Business Impact**: ~450 failed checkout attempts, ~₹3,20,000 lost revenue.
- **AI Task**: Cross-reference payment failures with gateway codes, identify time window, calculate lost revenue, and recommend payment route fallback.

### Scenario 2: Hero Product Stockout & Lost Revenue (`SCN-002`)
- **Time Window**: Day 45 to Day 55 (11 days)
- **Target SKU**: `SKU-FASH-101` (Premium Cotton Oxford Shirt)
- **Anomaly**: 25% demand surge depletes stock on Day 49, leading to 6 consecutive days of zero inventory before supplier reorder lands.
- **Root Cause**: Product contributes **22.8%** of store revenue; safety stock was insufficient for demand surge within supplier's 6-day lead time.
- **Business Impact**: ~120 unfulfilled orders, ~₹1,85,000 lost revenue.
- **AI Task**: Attribute revenue drop to specific SKU stockout, calculate historical revenue contribution, and estimate lost sales.

### Scenario 3: Regional Delivery Bottleneck Causing Refund Surge (`SCN-003`)
- **Time Window**: Day 30 to Day 45 (16 days)
- **Target Region**: Bhopal, Madhya Pradesh (`Bhopal Hub Logistics`)
- **Anomaly**: Refund rate in Bhopal surges from **3.2%** to **19.4%**.
- **Root Cause**: Carrier transit delays exceeding SLA by $>6$ days, driving buyer delivery refusals and cancellations.
- **Business Impact**: ~110 excess refunds, ~₹1,45,000 in refunded capital.
- **AI Task**: Correlate refund spike with shipping city and carrier tracking delays, isolating geographic concentration.

### Scenario 4: Supplier Batch Quality Defect (`SCN-004`)
- **Time Window**: Day 70 to Day 78 (9 days)
- **Target SKU**: `SKU-ELEC-104` (Wireless Earbuds) from Supplier 6 (`Noida Tech Components`)
- **Anomaly**: Return rate for SKU-ELEC-104 surges from **2.1%** to **24.8%**.
- **Root Cause**: Defective audio driver batch #NC-2024-B9 resulting in 82% `DAMAGED_PRODUCT` returns.
- **Business Impact**: ~45 defective units returned, ~₹1,10,000 in replacement costs.
- **AI Task**: Link product returns to supplier batch and defect reasons; propose batch quarantine and warranty recovery.

### Scenario 5: High-Value VIP Customer Churn Risk (`SCN-005`)
- **Time Window**: Day 65 to Day 90 (25 days)
- **Target Cohort**: 65 VIP Loyal Customers (Top 15% spenders)
- **Anomaly**: 65 previously frequent VIP buyers became completely dormant (0 orders for 25+ days).
- **Root Cause**: Each customer experienced $\ge 2$ consecutive payment gateway timeouts during checkout attempts and abandoned the platform.
- **Business Impact**: ~₹2,10,000 in recurring quarterly revenue at risk.
- **AI Task**: Detect churn cohort, trace abandonment to checkout payment failures, and propose targeted VIP recovery campaign.

### Scenario 6: Impending Stockout via Demand Surge (`SCN-006`)
- **Time Window**: Day 85 to Day 90 (5 days / Present Day)
- **Target SKU**: `SKU-FIT-105` (Ergonomic High-Density Yoga Mat)
- **Anomaly**: 5-day daily sales velocity surges 140% (from 8.5 to 20.4 units/day).
- **Root Cause**: Remaining 45 units will be exhausted in **2.2 days**, while supplier lead time is **5 days** (2.8 days stockout shortfall).
- **Business Impact**: Projected ~₹85,000 lost revenue over impending stockout window.
- **AI Task**: Calculate days of stock remaining, detect lead-time shortfall, and propose emergency air-freight restock.
