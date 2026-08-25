# MITRA AI — Security, Governance & Guardrail Architecture

## 1. Threat Modeling & Mitigation Strategy

| Threat Category | Potential Attack Vector | Mitra AI Architectural Defense |
|---|---|---|
| **SQL Injection (SQLi)** | LLM or user crafting malicious SQL queries | **Zero direct SQL execution**. The AI only invokes parameter-bounded tool functions with parameterized prepared statements. |
| **Autonomous Financial Risk** | AI hallucinating bulk refunds or price changes | **Policy Guardrails & Human Signature Gate**. High-risk actions cannot execute without signed user approval. |
| **PII Leakage** | Customer emails, phones, addresses exposed in logs | Customer PII is masked or excluded from LLM reasoning prompts; only aggregate cohorts are evaluated. |
| **Secret Compromise** | API keys or DB passwords exposed in Git | Managed via strict `.env` variables excluded by `.gitignore`. |
| **Data Drift / Hallucination** | AI inventing imaginary business problems | Mandatory numerical evidence citations attached to every generated insight. |

---

## 2. Immutable Audit Trail Design
Every system action, AI detection, and human approval is immutably logged to the `audit_logs` table:
- **Actor Type**: `SYSTEM`, `AI_AGENT`, `MERCHANT_USER`, `API_INTEGRATION`
- **Actor Identifier**: User email or AI model signature
- **Entity**: Table name and record ID
- **State Change Snapshot**: Complete `old_values` and `new_values` JSON payloads
- **Audit Timestamp & IP Address**: Non-repudiable transaction tracking
