# Risk Engine Implementation Status

## Overview
The sprint risk engine is implemented as a **frontend-driven experience backed by a backend API**.

The frontend already contains the full user flow for planning input, rule-based scoring, dashboard presentation, and recommendations. The backend also implements deterministic risk scoring and persistence, but it includes one extra factor, `External Dependencies`, that is not yet mirrored in the frontend fallback path.

For a demo, the clearest path is to show the **API evaluation flow** end to end:
`SprintInputComponent` -> `AppComponent.onEvaluateRisk()` -> `RiskEngineService.evaluateRiskViaApi()` -> backend `RiskAssessmentController` -> backend `RiskAssessmentService` -> `RiskDashboardComponent` and `RecommendationsComponent`.

---

## What Is Implemented Right Now

### Frontend (Angular)
The frontend contains the visible product experience and most of the risk logic used in the UI.

| Area | File | Status |
|------|------|--------|
| Planning input UI | `sprint-monitor/src/app/features/sprint-input/sprint-input.component.html` | Complete |
| Planning input logic | `sprint-monitor/src/app/features/sprint-input/sprint-input.component.ts` | Complete |
| Local risk rules | `sprint-monitor/src/app/core/utils/rules.util.ts` | Complete |
| Local risk engine | `sprint-monitor/src/app/core/services/risk-engine.service.ts` | Complete |
| Risk model | `sprint-monitor/src/app/core/models/risk.model.ts` | Complete |
| Risk dashboard UI | `sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.ts` / `.html` | Complete |
| Recommendations UI | `sprint-monitor/src/app/features/recommendations/recommendations.component.ts` / `.html` | Complete |
| Parent orchestration | `sprint-monitor/src/app/app.component.ts` | Complete |

### Backend (.NET API)
The backend is implemented for API-based scoring and storage.

| Area | File | Status |
|------|------|--------|
| Risk controller | `sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs` | Complete |
| Risk engine service | `sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs` | Complete |
| Risk DTOs | `sprint-monitor-api/SprintMonitor.API/DTOs/*` | Complete |
| Persistence models | `sprint-monitor-api/SprintMonitor.API/Models/*` | Complete |
| Database context | `sprint-monitor-api/SprintMonitor.API/Data/SprintMonitorDbContext.cs` | Complete |

---

## Current Implementation Summary

### Frontend implementation
The frontend does three jobs:
1. Collect planning data.
2. Send the data to the risk engine.
3. Render the assessment and recommendations.

### Backend implementation
The backend does four jobs:
1. Accept the risk evaluation request.
2. Load historical sprint data.
3. Calculate risk factors and recommendations.
4. Store the assessment, factors, and recommendations in the database.

### Important current difference
The backend calculates one extra factor:
- `External Dependencies`

The frontend UI already collects `externalDependencies`, but the local fallback scoring path does not currently evaluate that value as a separate rule factor.

---

## ✅ What's Fully Implemented

### Frontend (Angular - **COMPLETE**)
**Location:** `sprint-monitor/src/app/`

| Component | Status | Files |
|-----------|--------|-------|
| Risk Scoring Engines | ✅ COMPLETE | `core/utils/rules.util.ts` |
| Risk Assessment Model | ✅ COMPLETE | `core/models/risk.model.ts` |
| Risk Engine Service | ✅ COMPLETE | `core/services/risk-engine.service.ts` |
| Risk Dashboard Component | ✅ COMPLETE | `features/risk-dashboard/` |
| Recommendations Component | ✅ COMPLETE | `features/recommendations/` |
| Metrics Service | ✅ COMPLETE | `core/services/metrics.service.ts` |

**Scoring Functions Implemented:**
```typescript
✅ scoreCVR(cvr)
✅ scoreVelocityVariance(cv)
✅ scoreSpilloverRate(rate)
✅ scoreCapacityUtilization(committed, effective)
✅ scoreTeamAvailability(availability)
✅ determineRiskLevel(totalScore)
```

**Where to show this in demo:**
- [rules.util.ts](sprint-monitor/src/app/core/utils/rules.util.ts)
- [risk-engine.service.ts](sprint-monitor/src/app/core/services/risk-engine.service.ts)
- [risk-dashboard.component.ts](sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.ts)

**Recommendation Generation:**
```typescript
✅ Auto-generates recommendations for:
   - CVR reduction
   - Capacity buffer adjustments
   - Velocity stability improvements
   - Spillover reduction
   - Availability adjustments
   - Scope splitting suggestions
```

---

### Backend (C# API - **PARTIALLY COMPLETE**)
**Location:** `sprint-monitor-api/SprintMonitor.API/`

| Component | Status | Files |
|-----------|--------|-------|
| Risk Assessment Controller | ✅ COMPLETE | `Controllers/RiskAssessmentController.cs` |
| Risk Assessment Service - Scoring | ✅ COMPLETE | `Services/RiskAssessmentService.cs` |
| Risk Assessment Service - Recommendations | ⚠️ PARTIAL | `Services/RiskAssessmentService.cs` |
| Database Models | ✅ COMPLETE | `Models/RiskAssessment.cs`, etc. |
| Data Persistence | ✅ COMPLETE | `Data/SprintMonitorDbContext.cs` |

**Backend Scoring Functions:**
```csharp
✅ ScoreCVR(cvr)
✅ ScoreVelocityVariance(cv)
✅ ScoreSpilloverRate(rate)
✅ ScoreCapacityUtilization(planned, effective)
✅ ScoreTeamAvailability(availability)
⚠️ ScoreExternalDependencies(dependencies) - EXTRA FACTOR
✅ DetermineRiskLevel(totalScore)
✅ AssessConfidence(sprintCount)
```

**Where to show this in demo:**
- [RiskAssessmentController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs)
- [RiskAssessmentService.cs](sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs)

---

## ⚠️ Key Differences & Issues

### 1. **Scoring Factor Count Mismatch**

**Frontend: 5 Factors**
```
1. CVR (Commitment-to-Velocity Ratio)
2. Velocity Stability
3. Spillover Rate
4. Capacity Buffer Utilization
5. Team Availability
   Max Total: ~15 points
```

**Backend: 6 Factors**
```
1. CVR
2. Velocity Stability
3. Spillover Rate
4. Capacity Buffer Utilization
5. Team Availability
6. External Dependencies ⚠️ EXTRA
   Max Total: ~17 points
```

**Problem:** Backend includes `External Dependencies` scoring but frontend doesn't. This causes score mismatches.

---

### 2. **Risk Level Determination Thresholds**

**Frontend:**
```typescript
LOW:    ≤ 3 points
MEDIUM: 4-6 points
HIGH:   ≥ 7 points
```

**Backend:**
```csharp
LOW:    ≤ 3 points
MEDIUM: 4-6 points
HIGH:   ≥ 7 points
```

✅ **These match**, but the max score differs (15 vs 17).

---

### 3. **Recommendation Generation**

**Frontend:**
- ✅ Generates recommendations based on factor scores
- ✅ Creates specific action types (REDUCE_SCOPE, SPLIT_STORIES, ADD_BUFFER, etc.)
- ✅ Prioritizes recommendations (CRITICAL, HIGH, MEDIUM, LOW)
- ✅ Suggests specific point reductions

**Backend:**
- ⚠️ Has partial recommendation logic
- ⚠️ Includes external dependency recommendations
- ❌ **May not fully match frontend recommendation priorities**

---

### 4. **Historical Data Calculation**

**Frontend (metrics.service.ts):**
```typescript
calculateMetrics(sprints: Sprint[], plannedPoints: number): SprintMetrics {
  averageVelocity
  velocityStandardDeviation
  velocityCoefficient
  spilloverRate
  effectiveCapacity (velocity * 0.8)
  cvr (plannedPoints / averageVelocity)
  sprintCount
}
```

**Backend (metrics.service.cs):**
```csharp
CalculateMetrics(sprints, plannedPoints): SprintMetricsDto {
  // Same calculation logic
}
```

✅ **Metrics match between frontend and backend**

---

## 📋 Detailed Implementation Inventory

### Frontend - Rules Engine
**File:** `sprint-monitor/src/app/core/utils/rules.util.ts`

```typescript
✅ scoreCVR(cvr: number): number
   - 0 points: cvr ≤ 1.0
   - 1 point:  cvr ≤ 1.1
   - 2 points: cvr ≤ 1.2
   - 3 points: cvr > 1.2

✅ scoreVelocityVariance(cv: number): number
   - 0 points: cv ≤ 0.15 (≤15%)
   - 1 point:  cv ≤ 0.25 (≤25%)
   - 2 points: cv ≤ 0.35
   - 3 points: cv > 0.35

✅ scoreSpilloverRate(rate: number): number
   - 0 points: rate < 20%
   - 1 point:  rate ≤ 40%
   - 2 points: rate ≤ 60%
   - 3 points: rate > 60%

✅ scoreCapacityUtilization(committed, effective): number
   - 0 points: ratio ≤ 1.0
   - 1 point:  ratio ≤ 1.1
   - 2 points: ratio ≤ 1.25
   - 3 points: ratio > 1.25

✅ scoreTeamAvailability(availability): number
   - 0 points: availability ≥ 90%
   - 1 point:  availability ≥ 75%
   - 2 points: availability < 75%

✅ determineRiskLevel(totalScore): RiskLevel
   - LOW:    score ≤ 3
   - MEDIUM: score 4-6
   - HIGH:   score ≥ 7
```

### Backend - Risk Service
**File:** `sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs`

```csharp
✅ ScoreCVR(decimal cvr): int
   - Same thresholds as frontend

✅ ScoreVelocityVariance(decimal cv): int
   - Same thresholds as frontend

✅ ScoreSpilloverRate(decimal rate): int
   - Same thresholds as frontend

✅ ScoreCapacityUtilization(int planned, decimal effective): int
   - Same thresholds as frontend

✅ ScoreTeamAvailability(int availability): int
   - Same thresholds as frontend

⚠️ ScoreExternalDependencies(int dependencies): int [EXTRA]
   - 0 points: dependencies = 0
   - 1 point:  dependencies ≤ 2
   - 2 points: dependencies ≤ 4
   - 3 points: dependencies > 4

✅ DetermineRiskLevel(int totalScore): RiskLevel
   - Same thresholds as frontend

✅ AssessConfidence(int sprintCount): AssessmentConfidence
   - HIGH: sprintCount ≥ 6
   - MEDIUM: sprintCount ≥ 3
   - LOW: sprintCount < 3
```

---

## 🔄 Frontend → API Flow

### Current Architecture
```
Angular Frontend
        ↓
SprintInputComponent (collects data)
        ↓
AppComponent.onEvaluateRisk()
        ↓
RiskEngineService.evaluateRiskViaApi()
        ↓
API: POST /api/riskassessment/evaluate
        ↓
Backend: RiskAssessmentService.EvaluateRiskAsync()
        ↓
Risk Calculation (5-6 Factors)
        ↓
Save to Database (RiskAssessment, RiskFactors, Recommendations)
        ↓
Return RiskAssessmentDto
        ↓
Frontend maps response → RiskAssessment model
        ↓
RiskDashboardComponent + RecommendationsComponent display results
```

### Demo path to explain live
Use this exact sequence in the presentation:
1. Open [app.component.ts](sprint-monitor/src/app/app.component.ts) and explain `onEvaluateRisk()`.
2. Open [sprint-input.component.html](sprint-monitor/src/app/features/sprint-input/sprint-input.component.html) and show the fields the user fills in.
3. Open [risk-engine.service.ts](sprint-monitor/src/app/core/services/risk-engine.service.ts) and show `evaluateRiskViaApi()` and `evaluateRisk()`.
4. Open [rules.util.ts](sprint-monitor/src/app/core/utils/rules.util.ts) and explain each scoring rule.
5. Open [risk-dashboard.component.html](sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.html) and [recommendations.component.html](sprint-monitor/src/app/features/recommendations/recommendations.component.html) to show how results are presented.
6. Open [RiskAssessmentController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs) and [RiskAssessmentService.cs](sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs) to show backend evaluation.

---

## ❌ Missing/Incomplete Items

### 1. **External Dependencies Scoring**
- ✅ **Backend:** Fully implements `ScoreExternalDependencies()`
- ❌ **Frontend:** No scoring function for external dependencies
- ⚠️ **Issue:** Frontend input accepts `externalDependencies` but doesn't score it

**Frontend receives this in planning input:**
```typescript
export interface SprintPlanningInput {
  externalDependencies: number;  // ← Collected but not scored
}
```

---

### 2. **Recommendation Consistency**
- ⚠️ **Backend:** May generate different recommendations than frontend
- ❌ **Frontend fallback:** Uses local calculation without dependency factor

**Frontend fallback path** (if API fails):
```typescript
// Falls back to local calculation WITHOUT external dependencies
this.currentAssessment = this.riskEngine.evaluateRisk(
  metrics,
  plannedPoints,
  teamAvailability
  // ❌ Missing: externalDependencies
);
```

---

### 3. **Score Mismatch on Fallback**
When API is unavailable, frontend calculates locally:
- **API (6 factors):** Max 17 points
- **Local (5 factors):** Max 15 points
- Solution: Frontend should include external dependencies in local calculation

### 4. **Demo risk if backend is not running**
If the API is offline, the app still works, but the local fallback path may show a slightly different assessment because the external dependency factor is not part of the frontend score set.

For demo purposes, prefer the backend/API path so the results match the persisted assessment.

---

## 🎯 Recommendations for Alignment

### Option 1: **Remove External Dependencies from Backend** (Simpler)
```
Pros:
- Keeps frontend and backend in sync
- Simpler risk model (5 factors)
- Cleaner frontend/backend parity

Cons:
- Loses external dependency risk scoring
- Reduces backend functionality
```

### Option 2: **Add External Dependencies to Frontend** (More Complete)
```
Pros:
- Completes the risk model
- Fully utilizes backend data
- More comprehensive risk assessment

Cons:
- Frontend/backend already out of sync for different reasons
- Requires UI changes to input external dependencies
- Requires updating rule thresholds in frontend

Implementation:
1. Add scoreExternalDependencies() to rules.util.ts
2. Include external dependencies in frontend evaluateRisk()
3. Ensure fallback calculation includes this factor
4. Update risk thresholds if needed
```

### Option 3: **Backend Returns Frontend-Compatible Response** (Recommended)
```
Pros:
- Backend keeps all logic
- Frontend remains simple
- Backend handles complexity

Cons:
- Requires response mapping logic
- Backend must adjust response to match frontend model

Implementation:
1. Backend calculates with 6 factors (as is)
2. Backend maps response to exclude external dependencies from frontend
3. Frontend displays backend results without changes
4. Only backend stores full 6-factor assessment in DB
```

### Practical demo recommendation
For the current presentation, do not try to prove that frontend and backend are identical. Instead, present them as:
- Frontend = user experience, input collection, display, and local fallback
- Backend = authoritative scoring and persistence

That is the most accurate description of the current implementation.

---

## 📊 Current State Summary

| Aspect | Frontend | Backend | Sync Status |
|--------|----------|---------|-------------|
| CVR Scoring | ✅ | ✅ | ✅ Identical |
| Velocity Variance | ✅ | ✅ | ✅ Identical |
| Spillover Rate | ✅ | ✅ | ✅ Identical |
| Capacity Utilization | ✅ | ✅ | ✅ Identical |
| Team Availability | ✅ | ✅ | ✅ Identical |
| External Dependencies | ❌ | ✅ | ❌ Mismatch |
| Total Score | 15 max | 17 max | ⚠️ Different |
| Risk Level Thresholds | ✅ | ✅ | ✅ Identical |
| Recommendations | ✅ Partial | ✅ Partial | ⚠️ May differ |
| Confidence Assessment | ✅ | ✅ | ✅ Identical |
| Database Persistence | N/A | ✅ | ✅ Complete |

---

## Demo Files To Open

Use these files in the demo, in this order:

1. [sprint-input.component.html](sprint-monitor/src/app/features/sprint-input/sprint-input.component.html)
2. [sprint-input.component.ts](sprint-monitor/src/app/features/sprint-input/sprint-input.component.ts)
3. [app.component.ts](sprint-monitor/src/app/app.component.ts)
4. [risk-engine.service.ts](sprint-monitor/src/app/core/services/risk-engine.service.ts)
5. [rules.util.ts](sprint-monitor/src/app/core/utils/rules.util.ts)
6. [risk-dashboard.component.html](sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.html)
7. [risk-dashboard.component.ts](sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.ts)
8. [recommendations.component.html](sprint-monitor/src/app/features/recommendations/recommendations.component.html)
9. [recommendations.component.ts](sprint-monitor/src/app/features/recommendations/recommendations.component.ts)
10. [RiskAssessmentController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs)
11. [RiskAssessmentService.cs](sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs)

---

## What To Say In The Demo

### 1. Planning Input
Explain that the user enters:
- Planned story points
- Team availability
- Team size
- External dependencies
- Optional sprint link
- Optional CSV upload for historical sprints

Show [sprint-input.component.html](sprint-monitor/src/app/features/sprint-input/sprint-input.component.html) and [sprint-input.component.ts](sprint-monitor/src/app/features/sprint-input/sprint-input.component.ts).

### 2. Risk Evaluation Trigger
Explain that [app.component.ts](sprint-monitor/src/app/app.component.ts) receives the planning data through `onEvaluateRisk()` and sends it to `RiskEngineService`.

### 3. Rule-Based Scoring
Open [rules.util.ts](sprint-monitor/src/app/core/utils/rules.util.ts) and explain that each metric gets a deterministic score based on thresholds.

### 4. Risk Result Display
Open [risk-dashboard.component.html](sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.html) to show:
- overall risk badge
- total score
- confidence label
- sprint metrics
- factor-by-factor breakdown

### 5. Recommendation Display
Open [recommendations.component.html](sprint-monitor/src/app/features/recommendations/recommendations.component.html) to show:
- recommendation cards
- priority labels
- suggested changes
- apply/dismiss actions

### 6. Backend Evaluation
Open [RiskAssessmentController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs) and [RiskAssessmentService.cs](sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs) to show that the backend performs the authoritative calculation and stores the result.

---

## Demo Script

Use this sample flow during the presentation:

1. Load sample planning data from the input screen.
2. Explain that the form data is validated before submission.
3. Click Evaluate Risk.
4. Show the call from [app.component.ts](sprint-monitor/src/app/app.component.ts) into [risk-engine.service.ts](sprint-monitor/src/app/core/services/risk-engine.service.ts).
5. Explain how the backend endpoint `/api/riskassessment/evaluate` is called from the frontend.
6. Show the risk dashboard results and the recommendation cards.
7. Point out that recommendations can be applied back to the form.

Suggested demo phrase:
"This is a deterministic sprint risk engine. It uses historical sprint metrics and rule thresholds to score risk, then generates explainable recommendations."

---

## 🚀 Next Steps

1. **Decide on architecture**: Which option above?
2. **Implement chosen approach**
3. **Test frontend/backend parity** with same input
4. **Update documentation** to reflect final architecture

---

## Short Version For Slides

If you need a concise slide summary, use this:

- Frontend: collects sprint planning data and displays risk results.
- Risk engine: deterministic scoring rules in `rules.util.ts` and `risk-engine.service.ts`.
- Backend: API-based evaluation and persistence in `RiskAssessmentController.cs` and `RiskAssessmentService.cs`.
- Demo files: `sprint-input.component.html`, `app.component.ts`, `risk-engine.service.ts`, `rules.util.ts`, `risk-dashboard.component.html`, `recommendations.component.html`.
- Current gap: backend has `External Dependencies` scoring; frontend local fallback does not fully mirror it.
