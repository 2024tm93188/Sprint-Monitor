# Sprint Monitor: Planning & Recommendation Test Scenarios

## Overview

This document provides test scenarios for each project demonstrating the planning evaluation feature with recommendations and the risk calculation responsiveness. Each scenario shows:
1. **Initial HIGH risk state** with problematic metrics
2. **Recommendations provided** by the system
3. **Changes applied** to move from HIGH to LOW risk
4. **Expected result** showing risk reduction

---

## 1. RDA (Rapid Damage Assessment) Project

### Project Context
- **Team Characteristics**: Rapid response team with variable availability (81-92%)
- **Historical Pattern**: High spillover rate (~true/6-7 dependencies), moderate velocity variance
- **Use Case**: Emergency response assessments with external dependencies

### Test Scenario 1.1: HIGH Risk → LOW Risk via Scope Reduction

**Initial State (HIGH RISK - 8-9 points)**
```
Sprint: RDA-TEST-001
Planned Commitment: 60 story points
Team Availability: 85%
Sprint Duration: 14 days
Historical Avg Velocity: 42 points
Historical Spillover: 60% (true)
External Dependencies: 7
Team Size: 8

Calculated Metrics:
- CVR: 60/42 = 1.43 (Adjusted: 1.43 * 0.85 = 1.215) → Factor Score: 3
- Velocity Variance: 0.18 (estimated) → Factor Score: 2
- Spillover Rate: 65% → Factor Score: 2
- Capacity Utilization: High → Factor Score: 2
- Team Availability: 85% → Factor Score: 1
- External Dependencies: 7 → Factor Score: 2

TOTAL RISK SCORE: 12 → HIGH RISK
```

**Recommendations Generated:**
1. **REDUCE_SCOPE** - Reduce planned commitment by 20-25% (15 points)
2. **IMPROVE_TEAM_AVAILABILITY** - Increase team availability to 100%
3. **MANAGE_DEPENDENCIES** - Reduce external dependencies from 7 to 4

**Applied Changes:**
```
After Recommendation Application and Planning Changes:
Planned Commitment: 42 story points (reduced by 18)
Team Availability: 100%
External Dependencies: 4 (reduced)

New Calculated Metrics:
- CVR: 42/42 = 1.0 (Adjusted: 1.0 * 1.0 = 1.0) → Factor Score: 1 ✓
- Velocity Variance: 0.16 → Factor Score: 1 ✓
- Spillover Rate: 60% → Factor Score: 2
- Capacity Utilization: Normal → Factor Score: 1 ✓
- Team Availability: 100% → Factor Score: 0 ✓
- External Dependencies: 4 → Factor Score: 1 ✓

TOTAL RISK SCORE: 6 → MEDIUM RISK (borderline LOW)
```

**Steps to Test:**
1. Navigate to Planning Evaluation tab
2. Select Team: "RDA (Rapid Damage Assessment)"
3. Enter values:
   - Planned Commitment: 60
   - Team Availability: 85
   - Sprint Duration: 14
   - External Dependencies: 7
4. Click "Evaluate Risk"
5. Verify HIGH risk assessment (score >6)
6. Click "Apply This" on first recommendation (REDUCE_SCOPE)
7. Change inputs:
   - Planned Commitment: 42 (reduce by 18)
   - Team Availability: 100
   - External Dependencies: 4
8. Click "Evaluate Risk" again
9. Verify MEDIUM/LOW risk (score ≤6)

---

## 2. CatNet Project

### Project Context
- **Team Characteristics**: Highly stable team with exceptional availability (92-96%)
- **Historical Pattern**: Very low spillover, minimal external dependencies
- **Use Case**: Steady-state maintenance and core feature development

### Test Scenario 2.1: HIGH Risk → LOW Risk via Capacity Adjustment

**Initial State (HIGH RISK - 7-8 points)**
```
Sprint: catnet-TEST-001
Planned Commitment: 55 story points
Team Availability: 94%
Sprint Duration: 14 days
Historical Avg Velocity: 38 points
Historical Spillover: 5% (rarely true)
External Dependencies: 2
Team Size: 6

Calculated Metrics:
- CVR: 55/38 = 1.45 (Adjusted: 1.45 * 0.94 = 1.363) → Factor Score: 3
- Velocity Variance: 0.08 (stable) → Factor Score: 0
- Spillover Rate: 8% → Factor Score: 0
- Capacity Utilization: High → Factor Score: 2
- Team Availability: 94% → Factor Score: 0
- External Dependencies: 2 → Factor Score: 0

TOTAL RISK SCORE: 5 → MEDIUM RISK
** Can reach 6+ with minor velocity variance **
```

**Recommendations Generated:**
1. **INCREASE_CAPACITY** - Improve team capacity by prioritizing and reducing overhead
2. **REDUCE_SCOPE** - Reduce scope by 15% (8 points)

**Applied Changes:**
```
After Recommendation Application:
Planned Commitment: 45 story points (reduced by 10)
Team Availability: 94% (maintained - already optimal)
External Dependencies: 2 (maintained)

New Calculated Metrics:
- CVR: 45/38 = 1.18 (Adjusted: 1.18 * 0.94 = 1.11) → Factor Score: 1 ✓
- Velocity Variance: 0.08 → Factor Score: 0
- Spillover Rate: 5% → Factor Score: 0
- Capacity Utilization: Normal → Factor Score: 1 ✓
- Team Availability: 94% → Factor Score: 0
- External Dependencies: 2 → Factor Score: 0

TOTAL RISK SCORE: 2 → LOW RISK ✓
```

**Steps to Test:**
1. Navigate to Planning Evaluation tab
2. Select Team: "CatNet"
3. Enter values:
   - Planned Commitment: 55
   - Team Availability: 94
   - Sprint Duration: 14
   - External Dependencies: 2
4. Click "Evaluate Risk"
5. Verify HIGH/MEDIUM risk (score 5-7)
6. Click "Apply This" on REDUCE_SCOPE recommendation
7. Change input:
   - Planned Commitment: 45 (reduce by 10)
8. Click "Evaluate Risk"
9. Verify LOW risk (score ≤3)

---

## 3. OnePlatform Project

### Project Context
- **Team Characteristics**: Growing team with variable availability (85-91%)
- **Historical Pattern**: High spillover rate, moderate dependencies
- **Use Case**: Cross-functional feature development with external integrations

### Test Scenario 3.1: HIGH Risk → LOW Risk via Multiple Interventions

**Initial State (HIGH RISK - 9-10 points)**
```
Sprint: oneplatform-TEST-001
Planned Commitment: 65 story points
Team Availability: 86%
Sprint Duration: 14 days
Historical Avg Velocity: 44 points
Historical Spillover: 70% (frequently true)
External Dependencies: 5
Team Size: 8

Calculated Metrics:
- CVR: 65/44 = 1.48 (Adjusted: 1.48 * 0.86 = 1.27) → Factor Score: 3
- Velocity Variance: 0.12 → Factor Score: 1
- Spillover Rate: 75% → Factor Score: 3
- Capacity Utilization: Very High → Factor Score: 3
- Team Availability: 86% → Factor Score: 1
- External Dependencies: 5 → Factor Score: 2

TOTAL RISK SCORE: 13 → HIGH RISK
```

**Recommendations Generated:**
1. **REDUCE_SCOPE** - Reduce commitment by 25% (16 points)
2. **IMPROVE_TEAM_AVAILABILITY** - Increase to 95%+
3. **MANAGE_DEPENDENCIES** - Reduce external dependencies to 3

**Applied Changes (Multi-step):**
```
Step 1: Apply REDUCE_SCOPE Recommendation
Planned Commitment: 50 (reduced by 15)
Team Availability: 86% (unchanged initially)
External Dependencies: 5 (unchanged)
→ Risk drops to ~9 (still HIGH)

Step 2: Apply IMPROVE_TEAM_AVAILABILITY Recommendation
Planned Commitment: 50 (maintained)
Team Availability: 95% (increased from 86%)
External Dependencies: 5 (unchanged)
→ Risk drops to ~7 (MEDIUM)

Step 3: Apply MANAGE_DEPENDENCIES Recommendation
Planned Commitment: 50 (maintained)
Team Availability: 95% (maintained)
External Dependencies: 3 (reduced)
→ Risk drops to ~4 (LOW)

Final Calculated Metrics:
- CVR: 50/44 = 1.14 (Adjusted: 1.14 * 0.95 = 1.08) → Factor Score: 1 ✓
- Velocity Variance: 0.10 → Factor Score: 1
- Spillover Rate: 65% (improved targeting) → Factor Score: 2
- Capacity Utilization: Normal → Factor Score: 1 ✓
- Team Availability: 95% → Factor Score: 0 ✓
- External Dependencies: 3 → Factor Score: 0 ✓

TOTAL RISK SCORE: 5 → MEDIUM RISK (or 4-5 → LOW RISK with improved spillover)
```

**Steps to Test (Multi-step Application):**
1. Navigate to Planning Evaluation tab
2. Select Team: "OnePlatform"
3. Enter Initial Values:
   - Planned Commitment: 65
   - Team Availability: 86
   - Sprint Duration: 14
   - External Dependencies: 5
4. Click "Evaluate Risk"
5. Verify HIGH risk (score ≥9)
6. **Step 1**: Apply REDUCE_SCOPE
   - Change Planned Commitment: 50
   - Click "Evaluate Risk"
   - Note: Risk should drop but still be HIGH/MEDIUM
7. **Step 2**: Apply IMPROVE_TEAM_AVAILABILITY
   - Change Team Availability: 95
   - Click "Evaluate Risk"
   - Note: Risk should improve to MEDIUM
8. **Step 3**: Apply MANAGE_DEPENDENCIES
   - Change External Dependencies: 3
   - Click "Evaluate Risk"
   - Verify LOW/MEDIUM risk (score ≤5)

---

## 4. Portfolio Insights Project

### Project Context
- **Team Characteristics**: Moderate availability (86-92%), mixed spillover patterns
- **Historical Pattern**: Variable performance, balanced dependencies
- **Use Case**: Business analytics and reporting platform

### Test Scenario 4.1: HIGH Risk → LOW Risk via Availability Improvement

**Initial State (HIGH RISK - 8-9 points)**
```
Sprint: PortfolioI-TEST-001
Planned Commitment: 58 story points
Team Availability: 87%
Sprint Duration: 14 days
Historical Avg Velocity: 40 points
Historical Spillover: 55% (sometimes true)
External Dependencies: 3
Team Size: 7

Calculated Metrics:
- CVR: 58/40 = 1.45 (Adjusted: 1.45 * 0.87 = 1.26) → Factor Score: 3
- Velocity Variance: 0.14 → Factor Score: 1
- Spillover Rate: 60% → Factor Score: 2
- Capacity Utilization: High → Factor Score: 2
- Team Availability: 87% → Factor Score: 1
- External Dependencies: 3 → Factor Score: 1

TOTAL RISK SCORE: 10 → HIGH RISK
```

**Recommendations Generated:**
1. **IMPROVE_TEAM_AVAILABILITY** - Increase to 100% (remove blockers)
2. **REDUCE_SCOPE** - Reduce by 12 points to reach 46
3. **MANAGE_SPILLOVER** - Implement sprint buffer (5%)

**Applied Changes:**
```
After Applying Recommendations:
Planned Commitment: 46 story points (reduced by 12)
Team Availability: 100% (increased from 87%)
External Dependencies: 3 (maintained)

New Calculated Metrics:
- CVR: 46/40 = 1.15 (Adjusted: 1.15 * 1.0 = 1.15) → Factor Score: 1 ✓
- Velocity Variance: 0.12 → Factor Score: 1
- Spillover Rate: 50% → Factor Score: 2
- Capacity Utilization: Normal → Factor Score: 1 ✓
- Team Availability: 100% → Factor Score: 0 ✓
- External Dependencies: 3 → Factor Score: 1

TOTAL RISK SCORE: 6 → MEDIUM RISK (borderline LOW)
```

**Steps to Test:**
1. Navigate to Planning Evaluation tab
2. Select Team: "Portfolio Insights"
3. Enter values:
   - Planned Commitment: 58
   - Team Availability: 87
   - Sprint Duration: 14
   - External Dependencies: 3
4. Click "Evaluate Risk"
5. Verify HIGH risk (score ≥8)
6. Click "Apply This" on IMPROVE_TEAM_AVAILABILITY
7. Change inputs:
   - Planned Commitment: 46
   - Team Availability: 100
8. Click "Evaluate Risk"
9. Verify MEDIUM/LOW risk (score ≤6)

---

## 5. Property Insights Project

### Project Context
- **Team Characteristics**: Stable team with excellent availability (91-95%)
- **Historical Pattern**: Very low spillover, minimal dependencies
- **Use Case**: Property data management and analytics

### Test Scenario 5.1: HIGH Risk → LOW Risk via Scope Reduction

**Initial State (HIGH RISK - 7-8 points)**
```
Sprint: PI-TEST-001
Planned Commitment: 52 story points
Team Availability: 93%
Sprint Duration: 14 days
Historical Avg Velocity: 36 points
Historical Spillover: 10% (rarely true)
External Dependencies: 1
Team Size: 6

Calculated Metrics:
- CVR: 52/36 = 1.44 (Adjusted: 1.44 * 0.93 = 1.34) → Factor Score: 3
- Velocity Variance: 0.06 (very stable) → Factor Score: 0
- Spillover Rate: 15% → Factor Score: 0
- Capacity Utilization: High → Factor Score: 2
- Team Availability: 93% → Factor Score: 0
- External Dependencies: 1 → Factor Score: 0

TOTAL RISK SCORE: 5 → MEDIUM RISK
** Can reach 6+ with minor variations **
```

**Recommendations Generated:**
1. **REDUCE_SCOPE** - Reduce by 14 points to reach 38
2. **INCREASE_CAPACITY** - Improve throughput by 10%

**Applied Changes:**
```
After Recommendation Application:
Planned Commitment: 38 story points (reduced by 14)
Team Availability: 93% (maintained - already optimal)
External Dependencies: 1 (maintained)

New Calculated Metrics:
- CVR: 38/36 = 1.06 (Adjusted: 1.06 * 0.93 = 0.986) → Factor Score: 0 ✓
- Velocity Variance: 0.06 → Factor Score: 0
- Spillover Rate: 10% → Factor Score: 0
- Capacity Utilization: Normal → Factor Score: 1 ✓
- Team Availability: 93% → Factor Score: 0
- External Dependencies: 1 → Factor Score: 0

TOTAL RISK SCORE: 1 → LOW RISK ✓
```

**Steps to Test:**
1. Navigate to Planning Evaluation tab
2. Select Team: "Property Insights"
3. Enter values:
   - Planned Commitment: 52
   - Team Availability: 93
   - Sprint Duration: 14
   - External Dependencies: 1
4. Click "Evaluate Risk"
5. Verify MEDIUM/HIGH risk (score 5-7)
6. Click "Apply This" on REDUCE_SCOPE recommendation
7. Change input:
   - Planned Commitment: 38 (reduce by 14)
8. Click "Evaluate Risk"
9. Verify LOW risk (score ≤3)

---

## Testing Checklist

### For Each Scenario, Verify:

- [ ] **Initial Risk Assessment**
  - [ ] Risk score calculated correctly
  - [ ] Risk level displayed as HIGH/MEDIUM
  - [ ] All 6 risk factors visible with individual scores
  - [ ] Recommendations list populated

- [ ] **Recommendation Display**
  - [ ] Recommendations shown in correct priority order
  - [ ] Action type clearly described (REDUCE_SCOPE, IMPROVE_TEAM_AVAILABILITY, etc.)
  - [ ] Suggested changes specific and actionable
  - [ ] "Apply This" button functional

- [ ] **Applied Recommendation Removal**
  - [ ] After clicking "Apply This", recommendation disappears from list
  - [ ] Recommendation does NOT reappear after subsequent evaluations
  - [ ] Other recommendations remain visible

- [ ] **Risk Recalculation**
  - [ ] Risk score updates immediately after changing values
  - [ ] Risk level changes appropriately (HIGH→MEDIUM→LOW)
  - [ ] Individual factor scores reflect changes
  - [ ] CVR factor shows availability multiplier effect

- [ ] **Multi-step Application**
  - [ ] Multiple recommendations can be applied in sequence
  - [ ] Each application correctly filters from recommendations list
  - [ ] Cumulative effect properly reduces total risk score

### Acceptance Criteria:

✓ **HIGH risk sprint** (score >6) can be moved to **LOW/MEDIUM risk** (score ≤6) through:
  - Reducing planned commitment (scope reduction)
  - Increasing team availability
  - Reducing external dependencies
  - Single or multiple recommendation applications

✓ **Last recommendation** disappears immediately after application and does NOT reappear when evaluating risk again

✓ **Risk factors** properly reflect changes to input parameters, especially:
  - CVR responds to commitment AND availability changes
  - Capacity Utilization responds to commitment changes
  - Team Availability factor reflects input value

---

## Sample Test Data Summary

| Project | High Risk State | Low Risk State | Primary Lever | Secondary Levers |
|---------|-----------------|----------------|---------------|------------------|
| RDA | 60 pts, 85% avail, 7 deps | 42 pts, 100% avail, 4 deps | Scope + Availability | Dependencies |
| CatNet | 55 pts, 94% avail | 45 pts, 94% avail | Scope | (Already optimal) |
| OnePlatform | 65 pts, 86% avail, 5 deps | 50 pts, 95% avail, 3 deps | Multi-step | Scope → Availability → Dependencies |
| Portfolio | 58 pts, 87% avail | 46 pts, 100% avail | Scope + Availability | Spillover |
| Property | 52 pts, 93% avail | 38 pts, 93% avail | Scope | (Already optimal) |

---

## Notes for QA Team

1. **Browser Caching**: Clear browser cache between test scenarios to ensure fresh data loads
2. **Backend Restart**: Restart backend API if recommendations seem stale
3. **Concurrent Testing**: Each scenario can run in isolation; order doesn't matter
4. **Data Persistence**: Risk assessments are stored; check database if recommendations persist unexpectedly
5. **Performance**: Backend should respond to risk evaluation within 500ms

