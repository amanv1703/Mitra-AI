# MITRA AI — Demo Contingency & Fallback Strategy

This document outlines deterministic fallback mechanisms to ensure a 100% reliable live presentation during hackathons, investor pitches, or developer buildathons.

---

## 1. Network / External OpenAI Downtime Fallback
- **Mechanism**: The backend automatically falls back to `AI_PROVIDER=local_mock` (powered by [`backend/src/ai/provider/offlineProvider.js`](file:///c:/Users/Asus/Desktop/Mitra%20Ai/backend/src/ai/provider/offlineProvider.js)).
- **Guarantees**:
  - Deterministic tool invocations.
  - Zero latency variation.
  - 100% grounded financial calculations against the 90-day MySQL dataset.
  - 0% risk of API rate-limiting or quota exhaustion.

---

## 2. Database Connection Failure Fallback
- **Mechanism**: [`backend/src/config/db.js`](file:///c:/Users/Asus/Desktop/Mitra%20Ai/backend/src/config/db.js) intercepts `ECONNREFUSED` or `ER_BAD_DB_ERROR` and automatically serves precomputed analytical aggregates from `data/processed/generated_dataset.json`.
- **Status Indicator**: `GET /api/health` indicates `status: "degraded"` while continuing to serve analytics and action mock workflows without throwing 500 server crashes.

---

## 3. Quick Demo Reset (Clean Slate in 1 Second)
- To reset all action proposals and demo state during rehearsal:
```bash
curl -X POST http://localhost:5000/api/demo/reset
```
*Note: This endpoint is strictly disabled in production (`NODE_ENV=production`) with HTTP 403.*

---

## 4. Ground Truth Sanity Checklist Before Presenting
1. MySQL server running on `localhost:3306` with database `mitra_ai`.
2. Backend online: `node backend/src/server.js` (Port 5000).
3. Frontend online: `npm run dev --prefix frontend` (Port 5173).
4. Verify health endpoint: `curl http://localhost:5000/api/health` returns `status: "ok"`.
