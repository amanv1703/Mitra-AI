# MITRA AI — 5-Minute Buildathon Demo Script

## ⏱️ Total Time: 5:00 Minutes

---

### Step 1: Opening & The Paradigm Shift (0:00 – 0:45)
**Action**: Open browser at `http://localhost:5173/dashboard`.  
**Presenter**:
> *"Good morning judges. Traditional dashboards tell merchants what happened. MITRA tells them why it happened, quantifies the exact revenue at risk, simulates decisions, and executes verified actions under explicit merchant control.*
> 
> *Here on the Apex Retail India dashboard, we see a composite Business Health Score of 64/100 and ₹1.57 Crore in quantified revenue at risk across 90-day operations."*

---

### Step 2: Autonomous Investigation via MITRA Copilot (0:45 – 1:45)
**Action**: Click the **Mitra AI Copilot** floating button or icon in top right.  
**Query**: Type: `"What is my biggest operational risk right now?"`  
**Presenter**:
> *"Instead of hunting through siloed tabs, the merchant asks MITRA. Notice the tool activity stream: MITRA invokes `getBusinessHealth`, `getPaymentHealth`, and `getInventoryRisk` in real time.*
> 
> *MITRA correlates across domains and diagnoses two major friction clusters:*
> *1. Upstream HDFC Netbanking gateway timeouts accounting for ₹1.53 Cr in dropped checkouts.*
> *2. A critical stockout shortfall on Ergonomic High-Density Yoga Mats (SKU-FIT-105) where demand surged +140%, depleting stock in 2.2 days vs 5-day supplier lead times."*

---

### Step 3: Counterfactual What-If Simulation (1:45 – 2:30)
**Action**: Query: `"What happens if I restock 300 units of yoga mats instead of 250?"`  
**Presenter**:
> *"Before committing capital, the merchant runs a counterfactual simulation. Look at the response: MITRA deterministically calculates that restocking 300 units increases coverage to ~17.0 days, completely averts stockout risk, and requires ₹1.35 Lakhs outlay.*
> 
> *Crucially, notice the badge: SIMULATION ONLY — ZERO DATABASE MUTATIONS OCCURRED. The live database remains 100% untouched."*

---

### Step 4: Governed Action Proposal & Merchant Approval (2:30 – 3:30)
**Action**: Query: `"Fix the stockout problem."`  
**Presenter**:
> *"When the merchant asks MITRA to fix it, MITRA does NOT silently alter inventory or place real purchase orders. It generates a structured proposal (`CREATE_RESTOCK_RECOMMENDATION`) with risk tier MEDIUM, held behind the merchant gate.*
> 
> *The merchant reviews the parameters, revenue protected (₹2.92 Lakhs), and says: 'Yes, approve it' or clicks Approve.*
> 
> *Status transitions from PENDING_APPROVAL $\rightarrow$ APPROVED $\rightarrow$ EXECUTING $\rightarrow$ VERIFYING $\rightarrow$ VERIFIED. 3 out of 3 automated post-execution database assertions pass."*

---

### Step 5: Action Center & Immutable Audit Trail (3:30 – 4:15)
**Action**: Navigate to `/actions` in the sidebar.  
**Presenter**:
> *"In the Action Center, merchants have full visibility over all governed operations: Pending, Approved, Verified, and Rejected.*
> 
> *Clicking on our restock action displays the complete audit timeline: when MITRA proposed it, when the operator authorized it, the execution receipt ID, and the exact SQL audit log entry."*

---

### Step 6: Safety Guardrail Defense & Closing (4:15 – 5:00)
**Action**: Open Copilot and query: `"Send an apology email to all customers right now."`  
**Presenter**:
> *"To demonstrate safety, if someone attempts a high-risk external broadcast, MITRA halts: it creates an internal draft only, marks it HIGH RISK, and refuses auto-dispatch without explicit manager authorization.*
> 
> *MITRA achieves a 0.0% Unauthorized Action Rate while maintaining 100% tool accuracy across 32 benchmark scenarios.*
> 
> *Thank you, and we welcome your questions!"*
