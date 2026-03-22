## Purpose

This file guides AI coding agents working on **Sprint Monitor**, a data-driven sprint feasibility and spillover risk detection system for Agile teams.

## Big Picture Architecture

Sprint Monitor is an **Angular 17+ client-side application** that:
- Collects sprint planning inputs (velocity, story points, availability)
- Computes statistical metrics (CVR, variance, spillover rate)
- Applies **deterministic, rule-based risk scoring** (no AI/ML)
- Displays risk level (Low/Medium/High) with actionable recommendations

```
Angular Frontend
├── Sprint Input (form + CSV upload)
├── Risk Dashboard (metrics + risk badge)
├── Recommendations Panel (prioritized suggestions)
└── Risk Engine (client-side, pure TypeScript logic)
```

## Project Structure

```
sprint-monitor/
├── src/app/
│   ├── core/
│   │   ├── models/     → sprint.model.ts, story.model.ts, risk.model.ts
│   │   ├── services/   → sprint.service.ts, metrics.service.ts, risk-engine.service.ts
│   │   └── utils/      → statistics.util.ts (mean, stdDev, CV), rules.util.ts (scoring)
│   └── features/
│       ├── sprint-input/       → Form for planning data
│       ├── risk-dashboard/     → Visual risk display
│       └── recommendations/    → Actionable suggestions
```

## How to Run

```powershell
cd sprint-monitor
npm install
npm start
# Opens at http://localhost:4200
```

## Core Algorithms (from `rules.util.ts` and `risk.model.ts`)

| Metric | Formula | Thresholds |
|--------|---------|------------|
| **CVR** | `plannedPoints / avgVelocity` | ≤1.0 Low, 1.0-1.1 Medium, >1.1 High |
| **Spillover Rate** | `spilloverSprints / totalSprints * 100` | <20% Low, 20-40% Medium, >40% High |
| **Velocity CV** | `stdDev / mean` | ≤15% Low, 15-25% Medium, >25% High |
| **Capacity Buffer** | `avgVelocity * 0.8` | If planned > effective → risk |

**Risk Aggregation:** Each factor scores 0-3; total ≤3 = Low, 4-6 = Medium, ≥7 = High

## Key Patterns

- **Standalone components** with Angular Material UI
- **Pure functions** in `utils/` for testable calculations
- **BehaviorSubjects** in services for reactive state
- **RISK_THRESHOLDS** constant in `risk.model.ts` for all magic numbers
- Comments explain scoring logic for dissertation explainability

## What AI Agents Should Do

1. Preserve the deterministic, explainable nature (no AI/ML in core logic)
2. Keep statistical calculations in `statistics.util.ts`
3. Keep scoring rules in `rules.util.ts` with threshold references
4. Update `RISK_THRESHOLDS` when changing boundaries
5. Maintain clear JSDoc comments for academic documentation

## Example: Adding a New Risk Factor

```typescript
// 1. Add threshold in risk.model.ts
DEPENDENCY_COUNT: { LOW_MAX: 2, MEDIUM_MAX: 5 }

// 2. Add scoring function in rules.util.ts
export function scoreDependencies(count: number): number { ... }

// 3. Include in risk-engine.service.ts scoreAllFactors()
// 4. Add UI display in risk-dashboard.component.ts
```

## Integration Points

- **No backend** currently — data is in-memory or CSV upload
- Future scope: Node.js API for persistence (not implemented)
- Charts: Ready for Chart.js integration via `metrics.service.getVelocityChartData()`
