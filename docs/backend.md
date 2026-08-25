# MITRA AI — Backend API Reference & Architecture Documentation

## 1. Architecture Overview
The MITRA AI backend is built with **Node.js** and **Express.js**, adhering to a strict 4-layer architecture:

```
HTTP Request ──▶ Express Routes ──▶ Controllers ──▶ Services (Business & Detection Logic) ──▶ Repositories (Parameterized SQL / Views) ──▶ MySQL Database
```

### Key Design Tenets:
1. **Thin Controllers**: Controllers only parse query parameters, validate inputs, delegate to services, and format standardized responses.
2. **Rich Domain Services**: All business math, period-over-period growth rates, revenue-at-risk formulations, and anomaly detection algorithms reside in domain services.
3. **100% Parameterized Database Repositories**: Repositories use MySQL connection pooling with zero string concatenation on user inputs, eliminating SQL injection.
4. **Deterministic Anomaly Detectors**: Explainable statistical rules with configurable thresholds in `backend/src/config/constants.js`.

---

## 2. API Response & Error Standards

### Success Envelope (`HTTP 200 / 201`):
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Envelope (`HTTP 400 / 404 / 422 / 500 / 503`):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SORT_FIELD",
    "message": "Sort field 'unknown_col' is not allowed. Allowed values: initiated_at, amount, status, failure_reason"
  }
}
```

---

## 3. Complete Endpoint Reference

### 3.1 Health & System Probe
| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Returns service status, uptime, MySQL connection state, and query latency. |

#### Example Response:
```json
{
  "success": true,
  "data": {
    "service": "mitra-ai-backend",
    "status": "UP",
    "timestamp": "2026-08-24T12:00:00.000Z",
    "environment": "development",
    "database": {
      "status": "connected",
      "latencyMs": 2,
      "name": "mitra_ai"
    }
  }
}
```

---

### 3.2 Executive Dashboard API
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/dashboard/summary` | `GET` | `range` (`today`, `7d`, `30d`, `90d`), `from`, `to` | Returns topline sales, payment health, refund sums, low stock counts, period growth, and revenue at risk. |

#### Example Response:
```json
{
  "success": true,
  "data": {
    "period": { "from": "2026-05-26", "to": "2026-08-24" },
    "overview": {
      "totalSales": 155104847.37,
      "totalOrders": 18695,
      "averageOrderValue": 8296.59,
      "pendingOrders": 142,
      "activeCustomers": 4820,
      "growth": { "salesGrowthPct": 8.45, "ordersGrowthPct": 5.2 }
    },
    "payments": {
      "successfulPayments": 17013,
      "failedPayments": 1682,
      "failedPaymentVolume": 15381341.52,
      "failureRatePct": 9.0
    },
    "revenueAtRisk": {
      "confirmed": 15381341.52,
      "estimated": 292993.68,
      "total": 15674335.20
    }
  }
}
```

---

### 3.3 Business Analytics APIs
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/analytics/sales` | `GET` | `groupBy` (`day`, `week`, `month`), `range`, `from`, `to` | Returns multi-grain time series with period-over-period growth rates. |
| `/api/analytics/revenue-at-risk` | `GET` | `range`, `from`, `to` | Detailed deterministic breakdown of confirmed checkout drop losses vs estimated stockout lead-time shortfall losses. |
| `/api/analytics/business-health` | `GET` | `range`, `from`, `to` | Unifies cross-domain telemetry across Sales, Payments, Refunds, Inventory, Customers, and Delivery. |

---

### 3.4 Deterministic Anomaly Detection APIs
| Endpoint | Method | Description |
|---|---|---|
| `/api/detections/all` | `GET` | Evaluates all 5 statistical anomaly detectors and returns unified diagnostic findings. |
| `/api/detections/payment-spikes` | `GET` | Detects days where payment failure rate exceeds $2\times$ historical baseline (flags 28.5% spike). |
| `/api/detections/refund-spikes` | `GET` | Detects cities or products with refund rates $> 10\%$ (flags Bhopal 19.4% and SKU-ELEC-104 24.8%). |
| `/api/detections/stockout-risks` | `GET` | Detects products where `days_of_stock_remaining < supplier_lead_time_days`. |
| `/api/detections/demand-surges` | `GET` | Detects products with $> 80\%$ recent velocity surge over historical baseline. |
| `/api/detections/regional-delays` | `GET` | Detects regional hubs where delivery delay rates exceed $12\%$. |

---

### 3.5 Payments Telemetry APIs
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/payments` | `GET` | `page`, `limit`, `status`, `method`, `failureReason`, `sortBy`, `sortOrder` | Paginated payment transactions with sorting allowlists. |
| `/api/payments/summary` | `GET` | `range`, `from`, `to` | Gateway attempt counts, failure rates, and top failure reasons. |
| `/api/payments/failures/trend` | `GET` | `range`, `from`, `to` | Time-series breakdown of failure reasons (`BANK_TIMEOUT`, `INSUFFICIENT_FUNDS`, etc.). |

---

### 3.6 Inventory & Stockout APIs
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/inventory` | `GET` | `page`, `limit`, `search`, `categoryId` | Paginated catalog stock with dynamic status (`HEALTHY`, `LOW`, `CRITICAL`, `OUT_OF_STOCK`). |
| `/api/inventory/low-stock` | `GET` | None | Products currently below reorder threshold point. |
| `/api/inventory/stockout-risk` | `GET` | None | Real-time lead-time shortfall analysis and days-to-runout calculations. |
| `/api/inventory/health-summary` | `GET` | None | Inventory status distribution and total stock valuation in INR. |

---

### 3.7 Orders & Logistics APIs
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/orders` | `GET` | `page`, `limit`, `status`, `deliveryStatus`, `city`, `sortBy`, `sortOrder` | Paginated orders list. |
| `/api/orders/:id` | `GET` | None | Detailed order view with customer, line items, payment status, and delivery tracking. |
| `/api/orders/summary` | `GET` | `range`, `from`, `to` | Order fulfillment rates and carrier delay metrics. |

---

### 3.8 Customers & Churn APIs
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/customers` | `GET` | `page`, `limit`, `segment`, `city`, `search`, `sortBy`, `sortOrder` | Paginated customer master with spend and order counts. |
| `/api/customers/:id` | `GET` | None | Customer 360 profile with order history, payment failure counts, and refund metrics. |
| `/api/customers/at-risk` | `GET` | None | Deterministic churn detector identifying VIP/regular buyers with checkout payment friction and dormancy. |

---

### 3.9 Products & Margin APIs
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/products` | `GET` | `page`, `limit`, `categoryId`, `search`, `sortBy`, `sortOrder` | Product catalog listing. |
| `/api/products/:id` | `GET` | None | Product details with supplier links, sales volumes, and refund rates. |
| `/api/products/performance` | `GET` | `limit`, `sortBy` (`revenue`, `units`, `refundRate`, `stockoutRisk`), `sortOrder` | Multi-dimensional product performance matrix. |

---

### 3.10 Refunds & Return APIs
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/refunds` | `GET` | `page`, `limit`, `reason`, `status`, `productId`, `sortBy`, `sortOrder` | Paginated refunds list. |
| `/api/refunds/summary` | `GET` | `range`, `from`, `to` | Return rates and reason code breakdown (`DELIVERY_DELAY`, `DAMAGED_PRODUCT`, etc.). |
| `/api/refunds/trends` | `GET` | `range`, `from`, `to` | Time-series refund rate trends. |

---

### 3.11 Intelligence & Event Reasoning APIs (Phase 3)
| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/intelligence/overview` | `GET` | `range`, `from`, `to` | Comprehensive intelligence payload: Business Health Score (0-100), 5-domain risk meters, revenue at risk (Confirmed vs Estimated vs Potential), active anomalies, and top insights. |
| `/api/intelligence/insights` | `GET` | `range`, `severity`, `category`, `type` | Deduplicated, machine-readable structured insights with evidence chains and ranked root-cause candidates. |
| `/api/intelligence/insights/:id` | `GET` | None | Detailed causal graph and 4-factor scoring breakdown for a specific insight. |
| `/api/intelligence/anomalies` | `GET` | `range` | Raw statistical baseline deviations across all 5 operational vectors. |
| `/api/intelligence/risks` | `GET` | `range` | Domain risk scores (0–100) for Payments, Inventory, Refunds, Customers, and Delivery. |
| `/api/intelligence/business-health` | `GET` | `range` | Overall weighted Business Health composite score (0-100) with top positive and negative drag factors. |

---

## 4. Running Tests & API Server

```bash
# Run automated backend test suite (7 suites)
npm test

# Run Ground Truth Benchmark Evaluator (Precision, Recall, F1, Root Cause Accuracy)
node scripts/evaluateIntelligence.js

# Start backend development server with hot-reload
npm run dev:backend
```
