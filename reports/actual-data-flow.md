# MITRA AI — Actual System Data Flow & Architecture

## 1. Executive Dashboard Flow
```
Browser Request: GET /api/dashboard/summary?from=2026-07-25&to=2026-08-25
       │
       ▼
[Express Server: `backend/src/routes/dashboardRoutes.js`]
       │
       ▼
[`backend/src/controllers/dashboardController.js`]
       │
       ▼
[`backend/src/services/dashboardService.js`]
       │
       ├─► Queries `dashboardRepository.getSummary(fromSql, toSql)` (Total Sales, Orders, AOV, Failed Payments)
       ├─► Queries `analyticsRepository.getPeriodAggregates(prevFrom, prevTo)` (Sales & Order Growth %)
       └─► Queries `inventoryRepository.getStockoutRisks()` (Lead-Time Shortfall Loss Estimation)
       │
       ▼
MySQL 8.0 Database (`orders`, `payments`, `inventory`, `products`)
       │
       ▼
JSON Payload returned with 3-Tier Revenue at Risk: Confirmed, Estimated, Total
       │
       ▼
Frontend `Dashboard.jsx` renders KPI Cards, Trend Badges, and Revenue at Risk widget
```

---

## 2. Business Intelligence & Root-Cause Pipeline Flow
```
Trigger: Telemetry Ingestion / Query / Agent Investigation
       │
       ▼
[`backend/src/intelligence/insights/insightEngine.js`]
       │
       ├─► 1. Domain Metric Extraction (`salesMetrics`, `paymentMetrics`, `inventoryMetrics`, `refundMetrics`, `deliveryMetrics`, `customerMetrics`)
       │
       ├─► 2. Baseline Engine (`baselineEngine.js`) — Calculates 30-day moving average and standard deviation
       │
       ├─► 3. Anomaly Engine (`anomalyEngine.js`) — Evaluates z-scores and threshold deviations (e.g. Failure rate > 12%)
       │
       ├─► 4. Root Cause Candidate Engine (`rootCauseEngine.js`) — Scores 4 dimensions (Temporal, Magnitude, Overlap, Consistency)
       │
       ├─► 5. Revenue Impact Engine (`revenueImpact.js`) — Computes Confirmed, Estimated, and Potential losses
       │
       ├─► 6. Business Health Scorer (`businessHealthScore.js`) — Generates 0-100 composite health score
       │
       └─► 7. Deduplication Manager (`deduplication.js`) — Fingerprint hash `crypto.createHash('sha256')` prevents duplicate insights
       │
       ▼
Returns Structured Insight Graph (`ai_insights` / memory cache)
```

---

## 3. Autonomous AI Agent & Tool Calling Flow
```
Merchant Query: "What is my biggest operational risk right now?"
       │
       ▼
[Frontend `AICopilotDrawer.jsx` calls `POST /api/ai/chat`]
       │
       ▼
[`backend/src/controllers/aiController.js`]
       │
       ▼
[`backend/src/ai/agent/agent.js` -> `backend/src/ai/agent/agentLoop.js`]
       │
       ▼
[Model Provider: `OpenAiProvider` (Cloud) OR `OfflineProvider` (Deterministic Local Fallback)]
       │
       ▼
Model selects tool: `getPaymentHealth` & `getInventoryRisk`
       │
       ▼
[`backend/src/ai/tools/toolRegistry.js` executes functions against live intelligence metrics]
       │
       ▼
Tool returns live JSON results:
• HDFC Netbanking Timeout: 28.5% peak failure rate (₹1.53 Cr dropped checkout)
• SKU-FIT-105 Yoga Mat: 45 units remaining (2.2 days coverage vs 5-day lead time)
       │
       ▼
Model synthesizes grounded response citing exact evidence numbers and recommendations
       │
       ▼
[`backend/src/ai/reasoning/evidenceCollector.js`] extracts structured Evidence Cards
       │
       ▼
Frontend displays interactive Chat Bubble + Evidence Cards + Action Review Triggers
```

---

## 4. Counterfactual What-If Simulation Flow
```
User Query / API: `POST /api/ai/simulations/restock` { productId: 2, reorderQuantity: 300 }
       │
       ▼
[`backend/src/ai/tools/simulationTools.js` -> `simulateRestockScenario`]
       │
       ├─► Fetches current live stock (45 units) & daily velocity (20.4 units/day) from SQL
       ├─► Calculates: Projected Coverage = (45 + 300) / 20.4 = 16.9 days
       ├─► Calculates: Lead-time stockout shortfall eliminated (Coverage > 5-day lead time)
       ├─► Calculates: Capital Outlay = 300 * ₹450 = ₹1,35,000
       └─► Asserts database integrity: Zero `INSERT`, `UPDATE`, or `DELETE` statements executed
       │
       ▼
Returns payload labeled: `simulation: true`, `databaseMutated: false`
```

---

## 5. Governed Action Execution & Verification Flow
```
MITRA proposes `CREATE_RESTOCK_RECOMMENDATION` for SKU-FIT-105
       │
       ▼
[`backend/src/actions/actionPlanner.js` -> Status: `PENDING_APPROVAL`, TTL: 48h]
       │
       ▼
[Merchant reviews proposal in Action Center (`/actions`) & clicks "Approve"]
       │
       ▼
[`backend/src/actions/actionPolicy.js` asserts:]
• Tenant context matches (`x-merchant-id === action.merchantId`)
• Actor is human (`actor.type !== 'AI_AGENT'`)
• Action is not expired (`Date.now() < action.expiresAt`)
• If High/Critical risk, two-step confirmation is verified
       │
       ▼
Status transitions: `APPROVED` ──► `EXECUTING`
       │
       ▼
[`backend/src/actions/executors/restockExecutor.js`] creates restock recommendation receipt
       │
       ▼
Status transitions: `EXECUTING` ──► `VERIFYING`
       │
       ▼
[`backend/src/actions/actionVerifier.js` runs automated assertions:]
1. `RECEIPT_PRESENT`: Valid receipt ID generated
2. `PERSISTENCE_VERIFICATION`: Record confirmed in store
3. `QUANTITY_FIDELITY`: Stored quantity equals 250 units
       │
       ▼
Status transitions: `VERIFYING` ──► `VERIFIED`
       │
       ▼
[`backend/src/actions/actionAudit.js`] writes immutable event entry into MySQL `audit_logs`
```
