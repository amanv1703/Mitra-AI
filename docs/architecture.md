# MITRA AI — System Architecture & Technical Blueprint

## 1. Executive Summary & Core Philosophy

**MITRA AI** is an autonomous, explainable AI-powered merchant operating system built for modern e-commerce and retail merchants. Traditional BI systems only display backward-looking charts, requiring business operators to manually guess correlations. Mitra AI proactively investigates cross-domain operational telemetry across:

$$\text{Sales} \longleftrightarrow \text{Payments} \longleftrightarrow \text{Inventory} \longleftrightarrow \text{Logistics} \longleftrightarrow \text{Refunds} \longleftrightarrow \text{Suppliers} \longleftrightarrow \text{Customers}$$

It discovers non-obvious business anomalies, establishes verifiable causal links, quantifies financial loss, simulates counterfactuals, and executes policy-bounded or human-approved corrective actions with an immutable audit trail.

```
DATA ──▶ ANALYTICS ──▶ EVIDENCE GRAPH ──▶ AI REASONING ──▶ POLICY ENGINE ──▶ ACTION ──▶ VERIFICATION ──▶ AUDIT
```

---

## 2. High-Level System Architecture (C4 Container Diagram)

```mermaid
graph TB
    subgraph Client Layer
        UI["React 18 + Vite Frontend<br/>(Tailwind CSS, Glassmorphism, Recharts)"]
    end

    subgraph API & Gateway Layer
        API["Express REST API Router & Controllers<br/>(Security Headers, CORS, Input Validation, Pagination)"]
    end

    subgraph Service & Business Logic Layer
        SERVICES["Domain Business Services<br/>(Dashboard, Sales Analytics, Payments, Inventory, Orders, Customers, Refunds)"]
        DETECTORS["Deterministic Anomaly Detection Engine<br/>(Payment Spikes, Refund Surges, Stockout Risks, Demand Surges, Regional Bottlenecks)"]
        RAR["Deterministic Revenue-at-Risk Engine<br/>(Confirmed Checkout Drops + Estimated Lead-Time Shortfalls)"]
    end

    subgraph Repository & Database Access Layer
        REPOS["Data Access Repositories<br/>(100% Parameterized Prepared Queries & View Adapters)"]
    end

    subgraph Data & Storage Layer
        DB[("MySQL 8.0+ Database<br/>(Normalized 3NF, Analytical Views)")]
        GT[("Ground Truth Benchmark Corpus<br/>(Machine-Readable Scenario JSONs)")]
    end

    UI <-->|REST / JSON| API
    API <--> SERVICES
    API <--> DETECTORS
    SERVICES <--> RAR
    SERVICES <--> REPOS
    DETECTORS <--> REPOS
    REPOS <-->|Parameterized Queries| DB
```

---

## 3. Detailed Data & Reasoning Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant Operator
    participant Front as React Dashboard
    participant Back as Express Backend
    participant Agent as AI Agent Orchestrator
    participant Tools as Analytical Tools
    participant DB as MySQL Database
    participant Policy as Action Policy Engine

    Merchant->>Front: Requests Diagnostic Review or Alert Investigation
    Front->>Back: GET /api/insights/diagnose
    Back->>Agent: Initiate Cross-Domain Analysis Pipeline
    Agent->>Tools: Call get_payment_failure_analysis(), get_inventory_stockout_risks(), etc.
    Tools->>DB: Query Aggregation Views (e.g. v_payment_failure_rates_daily)
    DB-->>Tools: Telemetry Results (Z-Scores, Failure Deltas)
    Tools-->>Agent: Verifiable Structured Evidence Object
    Agent->>Agent: Cross-Domain Causal Synthesis & Root-Cause Attribution
    Agent->>Policy: Submit Recommended Action Proposal
    Policy->>Policy: Evaluate Risk Tier (LOW / MEDIUM / HIGH) & Safety Limits
    Policy-->>Agent: Action Status (PROPOSED / PENDING_APPROVAL)
    Agent-->>Back: Structured JSON Insight with Evidence & Actions
    Back-->>Front: Render Insight Cards with Evidence Graph & Approval Actions
    
    opt Human-in-the-Loop Action Approval
        Merchant->>Front: Clicks "Approve & Execute Action"
        Front->>Back: POST /api/actions/:id/approve
        Back->>Policy: Enforce Merchant Signature & Re-verify Limits
        Back->>DB: Execute Action & Insert Immutable Record to audit_logs
        Back-->>Front: Action Executed & Verified
    end
```

---

## 4. Cross-Domain Causal Graph & Evidence Formulation

Mitra AI does not use an LLM to guess numeric values. Instead:
1. **Statistical Anomaly Filtering**: Pre-computed database views identify statistical outliers ($Z > 2.5$ or $> 20\%$ variance from baseline).
2. **Evidence Linking**: Correlated anomalies across separate business domains are combined into an Evidence Object:
   - *Example*: Symptom: Bhopal Refund Spike (19.4%) $\rightarrow$ Evidence: Courier SLA breach ($>6$ days delay) $\rightarrow$ Root Cause: Bhopal Hub Logistics regional bottleneck.
3. **Structured Agent Synthesis**: The LLM consumes this structured evidence object and returns strict JSON adhering to schema contracts.
4. **Deterministic Evaluation**: Every finding is benchmarked against `data/ground_truth/` to prevent hallucinations.

---

## 5. Multi-Tier Safety & Action Policy Architecture

| Tier | Risk Level | Description | Execution Policy | Example Action |
|---|---|---|---|---|
| **Tier 1** | `LOW` | Read-only operations, carrier notices, recovery campaigns | Automated execution with logging | Reroute payment gateway fallback, Send customer apology SMS |
| **Tier 2** | `MEDIUM` | Operational adjustments within standard safety bounds | Optional human approval | Reorder inventory below ₹25,000 threshold, Quarantine defective batch |
| **Tier 3** | `HIGH` | Financial transactions, price changes, large purchase orders | **Mandatory Human Signature Required** | Price adjustments $>10\%$, Supplier restock $>₹25,000$, Bulk refunds |

---

## 6. Project Monorepo Layout

```
mitra-ai/
├── frontend/             # React 18 + Vite + Tailwind CSS User Interface
├── backend/              # Node.js + Express.js API & AI Reasoning Engine
├── database/             # Normalized MySQL schema, views, and seed data
├── data/                 # Seeded synthetic datasets and machine-readable ground truth
├── scripts/              # Dataset generator, database seeder, and benchmark runner
└── docs/                 # Complete architecture, database, AI, and security documentation
```
