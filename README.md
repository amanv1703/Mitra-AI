# MITRA AI — AI Business Operator

[![Database](https://img.shields.io/badge/database-MySQL_8.0+-00758F?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Backend](https://img.shields.io/badge/backend-Node.js_Express-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Frontend](https://img.shields.io/badge/frontend-React_18_Vite_Tailwind-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![AI Benchmark](https://img.shields.io/badge/AI_Benchmark-97.7%2F100.0-10B981?style=flat&logo=google-gemini&logoColor=white)](./reports/final-ai-evaluation.md)
[![Safety](https://img.shields.io/badge/Unauthorized_Actions-0.0%25-green?style=flat&logo=security&logoColor=white)](./reports/security-audit.md)
[![Tests](https://img.shields.io/badge/Test_Suites-11%2F11_Passed-success?style=flat)](./reports/final-test-report.md)

> **"From business data to evidence-backed action."**  
> *Don't just see what happened. Know why — and decide what to do next.*

---

## 🌟 Executive Overview

Traditional dashboards tell merchants what happened yesterday. **MITRA AI** investigates why it happened, quantifies revenue at risk, runs what-if counterfactual simulations, and proposes safe, policy-governed business actions with automated verification and immutable audit trails.

```
SEE (Dashboard Telemetry)
  ↓
UNDERSTAND (Cross-Domain Baselines & Anomalies)
  ↓
INVESTIGATE (Multi-Step Tool Invocations)
  ↓
QUANTIFY (3-Tier Revenue at Risk)
  ↓
SIMULATE (100% Read-Only What-If Scenarios)
  ↓
APPROVE (Human Merchant Gate & 2-Step Confirmation)
  ↓
ACT (Modular Action Executors)
  ↓
VERIFY (Automated Post-Execution DB Checks)
  ↓
AUDIT (Immutable Action Event Stream)
```

---

## 🛡️ Core Capabilities

1. **Deterministic Cross-Domain Intelligence**: Detects anomalies across **Sales, Payments, Inventory, Logistics, Refunds, and Customer Cohorts** without hallucinations.
2. **Autonomous Evidence Attachment**: Every finding references empirical evidence metrics, baseline deviations, and confidence scores.
3. **What-If Counterfactual Simulators**: Simulates inventory restock quantities, express freight, and price elasticity with zero database mutations.
4. **Governed Action Center (`/actions`)**: Finite state machine (`PROPOSED` $\rightarrow$ `PENDING_APPROVAL` $\rightarrow$ `APPROVED` $\rightarrow$ `EXECUTING` $\rightarrow$ `VERIFIED`), anti-self-approval rule, and 2-step confirmation for elevated risks.
5. **Post-Execution Verifiers**: Automatically executes assertions against database storage to confirm state transitions and quantity fidelity.
6. **Zero Unauthorized Action Rate (0.0%)**: Prohibits direct SQL mutations by AI agents and sandboxes financial payouts.

---

## 📊 Benchmark & Evaluation Scores

| Benchmark Suite | Score / Result | Target | Status |
| :--- | :---: | :---: | :---: |
| **Overall AI Benchmark Score** | **97.7 / 100.0** | $\ge 90.0$ | **PRODUCTION GRADE** ✅ |
| **Tool Selection Accuracy** | **100.0%** | $\ge 95.0\%$ | **PASSED** ✅ |
| **Numerical & Grounding Fidelity** | **100.0%** | $\ge 90.0\%$ | **PASSED** ✅ |
| **Root Cause Attribution** | **100.0%** | $\ge 95.0\%$ | **PASSED** ✅ |
| **Hallucination Resistance** | **100.0%** | $100.0\%$ | **PASSED** ✅ |
| **Unauthorized Action Rate** | **0.0%** | **0.0%** | **PASSED** ✅ |
| **Automated Backend & E2E Tests** | **11 / 11 Passed** | 100% | **PASSED** ✅ |

---

## 📂 Repository Architecture

```
mitra-ai/
├── backend/
│   ├── src/
│   │   ├── actions/          # Master registry, policy engine, risk scorer, state machine, executors, verifiers
│   │   ├── ai/               # Mitra autonomous agent, tool registry, simulation tools, model providers
│   │   ├── intelligence/     # Baselines, anomaly evaluators, root-cause attribution, revenue-at-risk
│   │   ├── controllers/      # REST API controllers (Dashboard, Actions, Detections, Intelligence, AI, Demo)
│   │   ├── middleware/       # Rate limiting, tenant isolation, error masking
│   │   └── config/           # MySQL connection pool & graceful offline fallbacks
│   └── tests/                # 11 Automated test suites (Unit, Intelligence, Actions, Security, E2E)
├── frontend/                 # React 18, Vite, Tailwind CSS Command Center & Action Center
├── evaluation/               # 32 Ground-truth test scenarios & evaluation runner
├── reports/                  # Generated test, AI evaluation, and security audit reports
├── docs/                     # Pitch deck, demo script, architecture, security, and fallback guides
└── scripts/                  # Seeded PRNG dataset generator, database resets, and seeder
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js** (v18.0+)
- **MySQL** (v8.0+)

### 2. Environment Configuration
Create `.env` in the root and `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=mitra_ai
AI_PROVIDER=local_mock
AI_MODEL=gemini-1.5-pro
```

### 3. Database Initialization & Seeding
```bash
# 1. Reset and initialize MySQL schema & analytical views
node scripts/resetDatabase.js

# 2. Seed 90-day synthetic telemetry (18,695 orders, 300 products, 5,000 customers)
node scripts/seedDatabase.js
```

### 4. Running Locally
```bash
# Start Backend API Server (Port 5000)
cd backend && npm start

# In a second terminal, start Frontend Dev Server (Port 5173)
cd frontend && npm run dev
```

---

## 🧪 Testing & Evaluation Commands

```bash
# Run all 11 automated backend, security, and E2E test suites
node backend/tests/runAllTests.js

# Run the 32-scenario AI Grounding & Safety Benchmark
node evaluation/evaluation_runner.js

# Run Action Governance Benchmark
node scripts/evaluateActions.js

# Build Frontend Production Bundle
npm run build --prefix frontend
```

---

## 📖 Key Documentation
- [**Buildathon Pitch Deck**](docs/pitch.md)
- [**5-Minute Demo Script**](docs/demo-script.md)
- [**Technical Architecture Specification**](docs/technical-architecture.md)
- [**Security & Governance Audit Report**](reports/security-audit.md)
- [**AI Evaluation Benchmark Report**](reports/final-ai-evaluation.md)
- [**Final System Test Report**](reports/final-test-report.md)
- [**Demo Contingency & Fallback Guide**](docs/demo-fallback.md)
