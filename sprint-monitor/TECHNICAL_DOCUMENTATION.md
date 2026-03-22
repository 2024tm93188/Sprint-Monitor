# SPRINT MONITOR - Technical Documentation

> **Version:** 1.0.0  
> **Last Updated:** February 2026  
> **Document Type:** Technical & User Documentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Getting Started](#3-getting-started)
4. [System Architecture](#4-system-architecture)
5. [Features & Functionality](#5-features--functionality)
6. [User Guide](#6-user-guide)
7. [Technical Implementation](#7-technical-implementation)
8. [Data Models](#8-data-models)
9. [Configuration & Thresholds](#9-configuration--thresholds)
10. [Glossary](#10-glossary)
11. [Troubleshooting](#11-troubleshooting)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. Executive Summary

### What is Sprint Monitor?

**Sprint Monitor** is a data-driven sprint planning assistant that helps Agile software development teams predict whether their sprint commitments are realistic *before* the sprint begins.

### The Problem We Solve

| Current State | With Sprint Monitor |
|---------------|---------------------|
| Planning based on gut feeling | Planning based on historical data |
| Frequent overcommitment | Realistic capacity awareness |
| Repeated spillover to next sprint | Early risk detection |
| Loss of stakeholder trust | Improved predictability |

### Key Value Proposition

> **"Is this sprint plan realistically achievable based on past data?"**

Sprint Monitor answers this question using statistical analysis and rule-based logic—no artificial intelligence, just transparent, explainable metrics.

---

## 2. Product Overview

### 2.1 Vision Statement

Sprint Monitor enables Agile teams to:
- ✅ Commit realistically to sprint goals
- ✅ Improve delivery predictability
- ✅ Reduce chronic sprint failures
- ✅ Make data-driven planning decisions

### 2.2 What Sprint Monitor Does

| Capability | Description |
|------------|-------------|
| **Analyzes Past Data** | Processes historical sprint performance data |
| **Computes Risk Indicators** | Calculates metrics like velocity variance and spillover rate |
| **Flags High-Risk Commitments** | Alerts when planned work exceeds safe capacity |
| **Provides Recommendations** | Suggests specific actions to reduce risk |

### 2.3 What Sprint Monitor Does NOT Do

| Out of Scope | Reason |
|--------------|--------|
| ❌ AI/Machine Learning predictions | Keeps system transparent and explainable |
| ❌ Release date forecasting | Focused on sprint-level planning only |
| ❌ Automatic decision-making | Humans make final planning decisions |

### 2.4 Target Users

| User Role | How They Use Sprint Monitor |
|-----------|----------------------------|
| **Scrum Master** | Reviews risk assessment before sprint commitment |
| **Product Owner** | Understands team capacity for backlog prioritization |
| **Development Team** | Validates that sprint scope is achievable |
| **Agile Coach** | Identifies patterns in team planning |

---

## 3. Getting Started

### 3.1 Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18.x or higher | JavaScript runtime |
| npm | 9.x or higher | Package manager |
| Modern Browser | Chrome, Firefox, Edge | Application interface |

### 3.2 Installation

```powershell
# Step 1: Navigate to project directory
cd sprint-monitor

# Step 2: Install dependencies
npm install

# Step 3: Start the development server
npm start

# Step 4: Open browser
# Navigate to http://localhost:4200
```

### 3.3 Quick Start (5-Minute Guide)

1. **Launch the application** → Open http://localhost:4200
2. **View historical data** → Sample data loads automatically
3. **Enter planned points** → Input your sprint commitment
4. **Set team availability** → Adjust for PTO, holidays
5. **Click "Evaluate Risk"** → View your risk assessment
6. **Review recommendations** → Take action on suggestions

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ┌─────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │Sprint Input │  │ Risk Dashboard  │  │ Recommendations   │   │
│  │  Component  │  │   Component     │  │   Component       │   │
│  └──────┬──────┘  └────────┬────────┘  └─────────┬─────────┘   │
└─────────┼──────────────────┼─────────────────────┼─────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
│  ┌─────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │   Sprint    │  │    Metrics      │  │   Risk Engine     │   │
│  │   Service   │  │    Service      │  │    Service        │   │
│  └──────┬──────┘  └────────┬────────┘  └─────────┬─────────┘   │
└─────────┼──────────────────┼─────────────────────┼─────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UTILITY LAYER                              │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │   Statistics Utilities   │  │      Rules Utilities        │  │
│  │  (Mean, StdDev, CV...)   │  │  (Scoring, Thresholds...)   │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Sprint Data (CSV / In-Memory)               │   │
│  │   • Historical sprints    • Committed points             │   │
│  │   • Completed points      • Spillover history            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

```
                    ┌──────────────────┐
                    │  CSV Data File   │
                    │  (or Manual)     │
                    └────────┬─────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 1: DATA PREPROCESSING                                    │
│  • Parse CSV format                                            │
│  • Validate required fields                                    │
│  • Normalize data types                                        │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 2: METRICS CALCULATION                                   │
│  • Average Velocity = Mean of completed points                 │
│  • Standard Deviation = Velocity fluctuation                   │
│  • Spillover Rate = % of sprints with incomplete work          │
│  • CVR = Planned Points ÷ Average Velocity                     │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 3: RISK EVALUATION                                       │
│  • Score each risk factor (0-3 points each)                    │
│  • Sum total risk score                                        │
│  • Classify: LOW (≤3) | MEDIUM (4-6) | HIGH (≥7)               │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  STEP 4: RECOMMENDATION GENERATION                             │
│  • Identify high-scoring risk factors                          │
│  • Generate actionable suggestions                             │
│  • Prioritize by impact                                        │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────┐
                    │   Risk Dashboard   │
                    │   + Suggestions    │
                    └────────────────────┘
```

### 4.3 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Angular 17+ | Single-page application framework |
| **Language** | TypeScript | Type-safe JavaScript |
| **UI Components** | Angular Material | Modern, accessible UI components |
| **Styling** | SCSS | CSS preprocessor for maintainable styles |
| **State Management** | RxJS BehaviorSubject | Reactive data streams |
| **Build Tool** | Angular CLI | Development and production builds |

### 4.4 Project Structure

```
sprint-monitor/
│
├── src/
│   ├── app/
│   │   │
│   │   ├── core/                    # Core business logic
│   │   │   ├── models/              # Data structures
│   │   │   │   ├── sprint.model.ts  # Sprint & metrics interfaces
│   │   │   │   ├── risk.model.ts    # Risk assessment interfaces
│   │   │   │   └── story.model.ts   # User story interfaces
│   │   │   │
│   │   │   ├── services/            # Business logic services
│   │   │   │   ├── sprint.service.ts      # Data management
│   │   │   │   ├── metrics.service.ts     # Metric calculations
│   │   │   │   └── risk-engine.service.ts # Risk evaluation
│   │   │   │
│   │   │   └── utils/               # Pure utility functions
│   │   │       ├── statistics.util.ts     # Math functions
│   │   │       └── rules.util.ts          # Scoring rules
│   │   │
│   │   ├── features/                # UI feature components
│   │   │   ├── sprint-input/        # Planning data entry
│   │   │   ├── risk-dashboard/      # Risk visualization
│   │   │   └── recommendations/     # Action suggestions
│   │   │
│   │   ├── app.component.ts         # Main application shell
│   │   ├── app.config.ts            # Application configuration
│   │   └── app.routes.ts            # Route definitions
│   │
│   ├── assets/
│   │   └── sample-data.csv          # Demo sprint data
│   │
│   └── styles.scss                  # Global styles
│
├── angular.json                     # Angular CLI configuration
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript configuration
```

---

## 5. Features & Functionality

### 5.1 Sprint Data Import (FR-1)

**Purpose:** Load historical sprint performance data for analysis.

**Supported Formats:**
```csv
Sprint,Committed,Completed,Spillover
Sprint 1,30,28,false
Sprint 2,32,25,true
Sprint 3,28,28,false
```

**Field Descriptions:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| Sprint | String | Sprint identifier | "Sprint 1" |
| Committed | Number | Story points committed at start | 30 |
| Completed | Number | Story points done at end | 28 |
| Spillover | Boolean | Did work spill to next sprint? | true/false |

### 5.2 Metrics Computation (FR-2)

The system calculates these key planning indicators:

#### 5.2.1 Average Velocity

```
Average Velocity = Sum of Completed Points ÷ Number of Sprints

Example: (28 + 25 + 28) ÷ 3 = 27 points/sprint
```

**What it tells you:** How many story points your team typically completes per sprint.

#### 5.2.2 Velocity Standard Deviation

```
Standard Deviation = √(Variance)

Where Variance = Average of (each value - mean)²
```

**What it tells you:** How much your velocity fluctuates. Lower is better (more predictable).

#### 5.2.3 Coefficient of Variation (CV)

```
CV = Standard Deviation ÷ Average Velocity

Example: 3.5 ÷ 27 = 0.13 (13% variation)
```

**What it tells you:** Relative stability of your velocity. Under 15% is considered stable.

#### 5.2.4 Spillover Rate

```
Spillover Rate = (Sprints with Spillover ÷ Total Sprints) × 100

Example: (2 ÷ 10) × 100 = 20%
```

**What it tells you:** How often work doesn't get completed. Under 20% is healthy.

#### 5.2.5 Commitment-to-Velocity Ratio (CVR)

```
CVR = Planned Story Points ÷ Average Velocity

Example: 35 ÷ 27 = 1.30
```

**What it tells you:** Are you overcommitting?

| CVR Value | Interpretation |
|-----------|----------------|
| ≤ 1.0 | ✅ Safe - Within your capacity |
| 1.0 - 1.1 | ⚠️ Caution - Slight overcommitment |
| > 1.1 | 🚨 Risk - Significant overcommitment |

#### 5.2.6 Effective Capacity (80% Rule)

```
Effective Capacity = Average Velocity × 0.8

Example: 27 × 0.8 = 21.6 ≈ 22 points
```

**What it tells you:** Your safe commitment level, reserving 20% buffer for:
- Unplanned work and bugs
- Meetings and ceremonies
- Code reviews
- Technical debt

### 5.3 Risk Detection (FR-3)

The risk engine evaluates five key factors:

| # | Factor | What It Measures | Max Score |
|---|--------|------------------|-----------|
| 1 | CVR | Overcommitment level | 3 |
| 2 | Velocity Stability | Predictability | 3 |
| 3 | Spillover Rate | Historical completion | 3 |
| 4 | Capacity Utilization | Buffer usage | 3 |
| 5 | Team Availability | Resource constraints | 2 |

**Total Maximum Score:** 14 points

### 5.4 Risk Classification (FR-4)

```
┌─────────────────────────────────────────────────────────────┐
│                    RISK CLASSIFICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   SCORE 0-3          SCORE 4-6           SCORE 7+          │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐         │
│  │  🟢     │        │  🟡     │        │  🔴     │         │
│  │  LOW    │        │ MEDIUM  │        │  HIGH   │         │
│  │  RISK   │        │  RISK   │        │  RISK   │         │
│  └─────────┘        └─────────┘        └─────────┘         │
│                                                             │
│  "Sprint plan       "Some concerns     "Significant        │
│   looks healthy"     to address"        risk of failure"   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 Recommendations (FR-5)

Based on identified risks, the system generates specific, actionable suggestions:

| Action Type | When Suggested | Example |
|-------------|----------------|---------|
| **Reduce Scope** | CVR > 1.1 | "Reduce commitment by 8 points" |
| **Split Stories** | Large stories detected | "Break down stories > 8 points" |
| **Add Buffer** | No safety margin | "Reserve 20% for unplanned work" |
| **Resolve Dependencies** | External blockers | "Address 3 external dependencies" |
| **Improve Estimation** | High variance | "Review estimation practices" |

**Recommendation Priority Levels:**

| Priority | Color | Meaning |
|----------|-------|---------|
| 🔴 CRITICAL | Red | Address immediately |
| 🟠 HIGH | Orange | Important to fix |
| 🔵 MEDIUM | Blue | Recommended improvement |
| 🟢 LOW | Green | Nice to have |

### 5.6 Visualization Dashboard (FR-6)

The Risk Dashboard displays:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPRINT RISK DASHBOARD                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐    ┌─────────────────────────────────┐  │
│  │   🔴 HIGH RISK    │    │  Sprint Metrics                 │  │
│  │                   │    │  ─────────────────────────────  │  │
│  │   Score: 8/14     │    │  CVR: 1.25        [▓▓▓▓▓▓░░░░]  │  │
│  │                   │    │  Velocity: 27 pts               │  │
│  │   HIGH Confidence │    │  Stability: 12%   [▓▓▓░░░░░░░]  │  │
│  └───────────────────┘    │  Safe Capacity: 22 pts          │  │
│                           │  Spillover: 20%  [▓▓░░░░░░░░]   │  │
│                           └─────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Risk Factor Breakdown                                   │   │
│  │  ───────────────────────────────────────────────────────│   │
│  │  CVR                    [▓▓▓░] 3/3  Severe overcommit   │   │
│  │  Velocity Stability     [▓░░░] 1/3  Stable              │   │
│  │  Spillover Rate         [▓▓░░] 2/3  Moderate concern    │   │
│  │  Capacity Utilization   [▓▓░░] 2/3  Over buffer         │   │
│  │  Team Availability      [░░░░] 0/2  Full team           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. User Guide

### 6.1 Planning Input Screen

**Step-by-step instructions:**

1. **Review Historical Summary**
   - Check your average velocity (how much you typically complete)
   - Note your effective capacity (safe commitment level)
   - Observe your spillover rate (completion history)

2. **Enter Planned Story Points**
   - Input the total points you're considering committing
   - Compare against the recommended value shown below the field

3. **Set Team Availability**
   - Adjust the slider (0-100%)
   - Account for: PTO, holidays, training, on-call duties

4. **Enter Team Size**
   - Number of developers participating this sprint

5. **Specify External Dependencies**
   - Count of stories waiting on other teams
   - Include: API integrations, design reviews, security approvals

6. **Click "Evaluate Risk"**
   - System processes your input
   - Navigates to Risk Dashboard

### 6.2 Understanding the Risk Dashboard

**Reading the Risk Badge:**

| Element | Meaning |
|---------|---------|
| Color (🟢🟡🔴) | Overall risk severity |
| Score (e.g., 5/14) | Sum of all risk factors |
| Confidence | How reliable the assessment is |

**Confidence Levels:**

| Level | Sprints Analyzed | Reliability |
|-------|------------------|-------------|
| LOW | < 3 sprints | Limited data, use caution |
| MEDIUM | 3-5 sprints | Reasonable confidence |
| HIGH | > 5 sprints | Strong historical basis |

### 6.3 Acting on Recommendations

**Best Practices:**

1. **Start with CRITICAL items** - These have the biggest impact
2. **Quantify changes** - "Reduce by 8 points" is more actionable than "reduce scope"
3. **Re-evaluate after changes** - Run the assessment again after adjustments
4. **Document decisions** - Note why you accepted or rejected recommendations

**Common Scenarios:**

| Situation | Recommended Action |
|-----------|-------------------|
| CVR > 1.2 | Remove lowest-priority stories |
| High spillover rate | Investigate estimation accuracy |
| Low team availability | Proportionally reduce commitment |
| Many dependencies | Front-load dependent work or defer |

---

## 7. Technical Implementation

### 7.1 Core Services

#### 7.1.1 Sprint Service

**File:** `src/app/core/services/sprint.service.ts`

**Responsibilities:**
- Store and manage historical sprint data
- Import sprint data from CSV
- Provide reactive data streams

**Key Methods:**

```typescript
// Get historical sprints as observable stream
getHistoricalSprints(): Observable<Sprint[]>

// Import sprints from CSV format
importFromCSV(csvData: string): Sprint[]

// Update planning input for evaluation
updatePlanningInput(input: SprintPlanningInput): void
```

#### 7.1.2 Metrics Service

**File:** `src/app/core/services/metrics.service.ts`

**Responsibilities:**
- Calculate statistical metrics from sprint data
- Compute velocity trends
- Generate chart data

**Key Methods:**

```typescript
// Calculate all planning metrics
calculateMetrics(sprints: Sprint[], plannedPoints: number): SprintMetrics

// Determine velocity trend direction
calculateVelocityTrend(sprints: Sprint[]): 'improving' | 'stable' | 'declining'

// Get recommended safe commitment
calculateRecommendedCommitment(sprints: Sprint[], availability: number): number
```

#### 7.1.3 Risk Engine Service

**File:** `src/app/core/services/risk-engine.service.ts`

**Responsibilities:**
- Score individual risk factors
- Aggregate into overall risk level
- Generate contextual recommendations

**Key Methods:**

```typescript
// Perform complete risk evaluation
evaluateRisk(
  metrics: SprintMetrics,
  plannedPoints: number,
  teamAvailability: number
): RiskAssessment
```

### 7.2 Utility Functions

#### 7.2.1 Statistics Utilities

**File:** `src/app/core/utils/statistics.util.ts`

| Function | Purpose | Formula |
|----------|---------|---------|
| `calculateMean()` | Average value | Σx ÷ n |
| `calculateVariance()` | Spread measure | Σ(x - μ)² ÷ n |
| `calculateStandardDeviation()` | Volatility | √Variance |
| `calculateCoefficientOfVariation()` | Relative spread | σ ÷ μ |
| `calculateRate()` | Percentage | (count ÷ total) × 100 |
| `calculateMedian()` | Middle value | Middle of sorted array |

#### 7.2.2 Rules Utilities

**File:** `src/app/core/utils/rules.util.ts`

| Function | Scores | Purpose |
|----------|--------|---------|
| `scoreCVR()` | 0-3 | Evaluate commitment ratio |
| `scoreVelocityVariance()` | 0-3 | Evaluate predictability |
| `scoreSpilloverRate()` | 0-3 | Evaluate completion history |
| `scoreCapacityUtilization()` | 0-3 | Evaluate buffer usage |
| `scoreTeamAvailability()` | 0-2 | Evaluate resource risk |
| `determineRiskLevel()` | LOW/MEDIUM/HIGH | Classify total score |

### 7.3 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AppComponent (Shell)                        │
│  • Navigation tabs                                              │
│  • Coordinates data flow between features                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ SprintInput     │ │ RiskDashboard   │ │ Recommendations │   │
│  │ Component       │ │ Component       │ │ Component       │   │
│  ├─────────────────┤ ├─────────────────┤ ├─────────────────┤   │
│  │ Inputs:         │ │ Inputs:         │ │ Inputs:         │   │
│  │ • Form fields   │ │ • @Input assess │ │ • @Input recs[] │   │
│  │                 │ │ • @Input metrics│ │                 │   │
│  ├─────────────────┤ ├─────────────────┤ ├─────────────────┤   │
│  │ Outputs:        │ │ Displays:       │ │ Displays:       │   │
│  │ • @Output       │ │ • Risk badge    │ │ • Prioritized   │   │
│  │   evaluate      │ │ • Metrics grid  │ │   suggestions   │   │
│  │                 │ │ • Factor list   │ │ • Quick summary │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Data Models

### 8.1 Sprint Model

```typescript
interface Sprint {
  id: string;              // Unique identifier ("sprint-1")
  name: string;            // Display name ("Sprint 1")
  committedPoints: number; // Points committed at start (30)
  completedPoints: number; // Points done at end (28)
  teamAvailability: number;// Team capacity % (100)
  teamSize: number;        // Number of developers (5)
  hadSpillover: boolean;   // Did work spill over? (false)
  startDate: Date;         // Sprint start date
  endDate: Date;           // Sprint end date
  stories: string[];       // Associated story IDs
}
```

### 8.2 Sprint Metrics Model

```typescript
interface SprintMetrics {
  averageVelocity: number;        // Mean completed points (27.4)
  velocityStandardDeviation: number; // Fluctuation (3.5)
  velocityCoefficient: number;    // CV as decimal (0.13)
  spilloverRate: number;          // Percentage (20)
  effectiveCapacity: number;      // Safe capacity (21.9)
  cvr: number;                    // Commitment ratio (1.28)
  sprintCount: number;            // Data points analyzed (10)
}
```

### 8.3 Risk Assessment Model

```typescript
interface RiskAssessment {
  overallRisk: RiskLevel;         // LOW | MEDIUM | HIGH
  totalScore: number;             // Aggregate score (8)
  maxPossibleScore: number;       // Maximum possible (14)
  factors: RiskFactor[];          // Individual breakdowns
  recommendations: Recommendation[]; // Action items
  assessedAt: Date;               // Timestamp
  confidence: AssessmentConfidence; // Data quality indicator
}

interface RiskFactor {
  name: string;           // "Commitment-to-Velocity Ratio"
  score: number;          // 0-3
  description: string;    // Human-readable explanation
  metricValue: number;    // The actual metric value
  threshold?: number;     // Threshold that was exceeded
}

interface Recommendation {
  id: string;             // Unique identifier
  title: string;          // "Reduce Sprint Scope"
  description: string;    // Detailed explanation
  priority: Priority;     // CRITICAL | HIGH | MEDIUM | LOW
  addressesRiskFactor: string; // Which factor this helps
  actionType: ActionType; // REDUCE_SCOPE | SPLIT_STORIES | ...
  suggestedChange?: string; // "Reduce by 8 points"
}
```

---

## 9. Configuration & Thresholds

### 9.1 Risk Thresholds

All thresholds are configured in `src/app/core/models/risk.model.ts`:

```typescript
const RISK_THRESHOLDS = {
  // Commitment-to-Velocity Ratio
  CVR: {
    LOW_MAX: 1.0,      // ≤ 1.0 = Low risk
    MEDIUM_MAX: 1.1,   // 1.0-1.1 = Medium risk
                       // > 1.1 = High risk
  },

  // Spillover Rate (percentage)
  SPILLOVER: {
    LOW_MAX: 20,       // < 20% = Low risk
    MEDIUM_MAX: 40,    // 20-40% = Medium risk
                       // > 40% = High risk
  },

  // Velocity Coefficient of Variation
  VELOCITY_CV: {
    LOW_MAX: 0.15,     // ≤ 15% = Stable
    MEDIUM_MAX: 0.25,  // 15-25% = Moderate
                       // > 25% = Unstable
  },

  // Capacity buffer multiplier
  CAPACITY_BUFFER: 0.8, // 80% rule

  // Total score classification
  TOTAL_SCORE: {
    LOW_MAX: 3,        // ≤ 3 = Low risk
    MEDIUM_MAX: 6,     // 4-6 = Medium risk
                       // ≥ 7 = High risk
  },

  // Confidence level requirements
  MIN_SPRINTS_FOR_HIGH_CONFIDENCE: 6,
  MIN_SPRINTS_FOR_MEDIUM_CONFIDENCE: 3,
};
```

### 9.2 Customization Guide

**To adjust thresholds for your team:**

1. Locate `RISK_THRESHOLDS` in `risk.model.ts`
2. Modify values based on your team's context
3. Consider your:
   - Sprint duration (1-week vs 2-week)
   - Team maturity
   - Domain complexity
   - Historical patterns

**Example: Stricter CVR for a mature team:**
```typescript
CVR: {
  LOW_MAX: 0.9,      // More conservative
  MEDIUM_MAX: 1.0,
}
```

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **Agile** | Iterative software development methodology emphasizing flexibility and collaboration |
| **Backlog** | Prioritized list of work items (features, bugs, tasks) to be completed |
| **Capacity** | Amount of work a team can complete in a sprint |
| **Coefficient of Variation (CV)** | Standard deviation divided by mean; measures relative variability |
| **Commitment** | Story points the team agrees to complete in a sprint |
| **CVR** | Commitment-to-Velocity Ratio; planned points ÷ average velocity |
| **Deterministic** | Same inputs always produce same outputs (no randomness) |
| **Effective Capacity** | Safe commitment level (typically 80% of velocity) |
| **Scrum Master** | Team facilitator who helps implement Scrum practices |
| **Spillover** | Work not completed in a sprint that carries over to the next |
| **Sprint** | Fixed time period (usually 1-2 weeks) for completing a set of work |
| **Standard Deviation** | Measure of how spread out values are from the average |
| **Story Points** | Unit of measure for estimating effort/complexity of work items |
| **User Story** | Feature described from end-user perspective |
| **Variance** | Average of squared differences from the mean |
| **Velocity** | Average story points completed per sprint |

---

## 11. Troubleshooting

### 11.1 Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "Low Confidence" warning | Less than 3 sprints of data | Add more historical data |
| CVR always showing high risk | Consistent overcommitment | Reduce planned points or re-estimate |
| Metrics not calculating | Invalid data format | Check CSV format matches expected |
| No recommendations shown | All factors below threshold | Sprint plan looks healthy! |

### 11.2 Data Quality Checks

Before relying on assessments, verify:

- [ ] At least 5 sprints of historical data
- [ ] Committed and completed points are realistic
- [ ] Spillover field is accurately recorded
- [ ] Data represents current team composition

### 11.3 Application Issues

**If the application won't start:**
```powershell
# Clear node modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
npm start
```

**If styles aren't loading:**
```powershell
# Rebuild with verbose output
npm run build -- --verbose
```

---

## 12. Future Roadmap

### Phase 1: Current Release ✅
- Historical data import
- Risk metrics calculation
- Risk classification
- Recommendations engine
- Dashboard visualization

### Phase 2: Enhanced Analytics (Planned)
- Velocity trend charts
- Sprint comparison views
- Export reports to PDF
- Team performance history

### Phase 3: Integrations (Future)
- Jira integration for automatic data sync
- Azure DevOps connector
- Slack notifications for high-risk sprints

### Phase 4: AI Enhancement (Future Scope)
- ML-based risk prediction
- Anomaly detection
- Smart story splitting suggestions

---

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Sprint Monitor Technical Documentation |
| **Version** | 1.0.0 |
| **Author** | Development Team |
| **Status** | Complete |
| **Review Date** | February 2026 |

---

*For questions or feedback about this documentation, please contact the development team.*
