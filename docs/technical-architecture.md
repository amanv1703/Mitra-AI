# MITRA AI — Technical Architecture & System Specification

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer [Frontend Presentation Layer - React + Vite + Tailwind]
        UI[Executive Dashboard]
        Copilot[MITRA AI Copilot Drawer]
        ActionsUI[Action Center & Approval Modal]
        EvidenceUI[Traceable Evidence Cards]
    end

    subgraph Gateway [API Gateway & Middleware]
        Auth[Tenant Auth & Context]
        RateLimit[Rate Limiter & Safe Error Handler]
    end

    subgraph AI Intelligence Layer [Autonomous Agent & Intelligence Pipeline]
        Agent[Mitra Autonomous Agent]
        ToolRegistry[Bounded Tool Registry]
        SimEngine[Counterfactual What-If Simulator]
        BioEngine[Cross-Domain Baseline & Anomaly Engine]
        RootCause[Root Cause Attribution Engine]
        RevenueImpact[3-Tier Revenue-at-Risk Engine]
    end

    subgraph Action Governance Layer [Safe Action Execution & Verification]
        Planner[Action Planner & TTL Manager]
        Policy[Action Policy Engine]
        Risk[0-100 Risk Engine]
        Executors[Modular Executors]
        Verifier[Automated Post-Execution Verifier]
        Audit[Immutable Audit Stream]
    end

    subgraph Data Layer [Persistence & Telemetry]
        MySQL[(MySQL 8.0 Telemetry DB)]
        AuditLog[(audit_logs & ai_actions)]
    end

    UI --> Gateway
    Copilot --> Gateway
    ActionsUI --> Gateway

    Gateway --> Agent
    Gateway --> BioEngine
    Gateway --> Planner

    Agent --> ToolRegistry
    ToolRegistry --> BioEngine
    ToolRegistry --> SimEngine
    ToolRegistry --> Planner

    BioEngine --> RootCause
    RootCause --> RevenueImpact
    BioEngine --> MySQL

    Planner --> Policy
    Policy --> Risk
    Planner --> ActionsUI
    ActionsUI -->|Human Approval| Planner
    Planner --> Executors
    Executors --> Verifier
    Executors --> MySQL
    Verifier --> Audit
    Audit --> AuditLog
```

---

## 2. Core Subsystems

### 2.1 Cross-Domain Intelligence Engine
- **Baselines**: Calculates rolling 30-day moving averages and standard deviations.
- **Anomaly Detection**: Evaluates statistical z-scores and threshold deviations across Payments, Inventory, Logistics, Refunds, and Customers.
- **Root-Cause Attribution**: Ranks candidate causes using confidence weights ($0.0 - 1.0$).
- **Impact Quantification**: Separates revenue loss into 3 tiers:
  - **Confirmed**: Dropped checkout transaction volumes.
  - **Estimated**: Lead-time stockout shortfall gaps ($\text{Daily Velocity} \times \text{Shortfall Days} \times \text{Price}$).
  - **Potential**: Behavioral cohort churn risk.

### 2.2 Autonomous AI Agent
- Powered by OpenAI Function Calling or deterministic offline fallbacks.
- Operates under strict `MAX_AGENT_STEPS = 6` to avoid infinite tool loops.
- All conclusions are grounded in structured tool outputs with evidence citations.

### 2.3 Policy & Risk Governance Engine
- **Risk Scoring**: 0–100 formula categorizing actions into `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`.
- **Anti-Self-Approval**: AI agents cannot approve their own action proposals.
- **Two-Step Approval**: High and Critical risk operations require mandatory operator justification text and confirmation checkboxes.
- **Idempotency Guard**: Idempotency keys prevent duplicate database mutations from network replays.
- **Post-Execution Verification**: Runs automated persistence and integrity checks before moving to `VERIFIED` status.
