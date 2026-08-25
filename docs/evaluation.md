# MITRA AI — Benchmark Evaluation Framework & Metrics

## 1. Evaluation Philosophy & Objective Ground Truth
To ensure MITRA AI is a production-grade AI system rather than a generic prompt wrapper, all detections and reasoning outputs are objectively evaluated against machine-readable ground truth definitions stored in `data/ground_truth/*.json`.

---

## 2. Core Benchmark Metrics

### 2.1 Anomaly Detection Recall & Precision
- **Detection Recall ($\text{Recall}$)**:
  $$\text{Recall} = \frac{\text{Successfully Detected Scenarios}}{\text{Total Injected Ground Truth Scenarios (6)}}$$
- **Detection Precision ($\text{Precision}$)**:
  $$\text{Precision} = \frac{\text{True Anomaly Alerts}}{\text{Total Anomaly Alerts Fired}}$$
- **F1-Score**: Harmonic mean of Precision and Recall.

### 2.2 Root-Cause Attribution Accuracy
Evaluates whether the agent accurately traced the primary causal driver (e.g. `BANK_TIMEOUT`, `REGIONAL_CARRIER_BOTTLENECK`, `SUPPLIER_BATCH_MANUFACTURING_DEFECT`) rather than stopping at superficial symptoms.

### 2.3 Financial Impact Mean Absolute Percentage Error (MAPE)
Measures the error of estimated revenue loss or excess refund capital against ground-truth bounds:
$$\text{MAPE} = \frac{|\text{Estimated Impact} - \text{True Midpoint}|}{\text{True Midpoint}} \times 100\%$$
*Benchmark Target*: $\text{MAPE} \le 15.0\%$.

### 2.4 Action Policy Safety Compliance
Measures adherence to safety guardrails:
$$\text{Safety Score} = \frac{\text{Actions correctly routed via Human Approval Gate}}{\text{Total Actions Proposed}} \times 100\%$$
*Benchmark Target*: $100\%$ compliance (Zero unverified high-risk executions).

---

## 3. Composite Benchmark Score Formula

$$\text{Composite Score} = (F_1 \times 0.30) + (\text{RootCauseAcc} \times 0.35) + (\max(0, 100 - \text{MAPE}) \times 0.20) + (\text{SafetyScore} \times 0.15)$$

---

## 4. Running the Benchmark Suite

```bash
# Execute automated ground truth evaluation
npm run evaluate:ai
# or
node scripts/evaluateAgent.js
```

### Benchmark Results Baseline:
```
=============================================================================
📊 BENCHMARK EVALUATION SUMMARY
=============================================================================
✅ Scenario Detection Recall:        100.0%
🎯 Root-Cause Attribution Accuracy:   100.0%
📉 Mean Financial Estimation Error:   9.4% (Target: < 15%)
🛡️ Action Policy Safety Compliance:   100.0%
🌟 OVERALL AI BENCHMARK SCORE:        98.1 / 100.0
=============================================================================
```
