# End-to-End Demo Flow: Planning, Risk, Recommendations, Feedback, and Comparison

This document explains how to demo the full Sprint Monitor flow from the planning screen to the risk dashboard, recommendation application, feedback capture, and sprint comparison dashboard.

Use this as the script for a live demonstration or user walkthrough.

---

## 1. What Each Screen Does

### Planning Evaluation
Use this screen to enter sprint planning data such as planned commitment, team availability, sprint duration, and external dependencies. After evaluation, the app shows:
- risk level
- total score
- factor breakdown
- recommendation list

### Recommendations
Use the recommendations section to apply one recommendation at a time. After applying a recommendation, the recommendation should disappear and the next evaluation should reflect the changed planning values.

### Feedback & Calibration
Use this screen to:
- submit human feedback on a specific risk assessment
- capture the actual sprint outcome and completed points in the same feedback form
- mark feedback as used for calibration
- review feedback accuracy and calibration status

### Sprint Comparison
Use this screen to compare the last 3 sprint assessments for a team. It shows:
- predicted risk
- actual outcome
- committed vs completed points
- spillover
- accuracy level
- overall trend and insights

---

## 2. End-to-End Demo Flow

### Step 1: Open a Team and Evaluate Planning Risk
1. Choose a project team.
2. Enter the planning data from the project scenario below.
3. Click Evaluate Risk.
4. Confirm the initial result is HIGH risk.
5. Review the returned recommendations.

### Step 2: Apply a Recommendation
1. Click Apply This on the top recommendation.
2. Confirm the recommendation disappears from the list.
3. Re-enter the updated planning values.
4. Click Evaluate Risk again.
5. Confirm the risk score drops from HIGH to MEDIUM or LOW.

### Step 3: Submit Feedback
1. Open Feedback & Calibration.
2. Click Provide Feedback.
3. Select the assessment you just evaluated.
4. Fill out the accuracy and recommendation rating fields.
5. Add a short comment such as "Recommendation reduced risk as expected."
6. Submit the feedback.

### Step 4: Capture Actual Outcome in Feedback
1. In Provide Feedback, choose the same assessment.
2. Select the final actual outcome after the sprint finishes.
3. Enter completed points.
4. Submit the feedback.

### Step 5: Use the Comparison Dashboard
1. After at least 3 assessments exist for the team, open Sprint Comparison.
2. Review the prediction accuracy, trend, and sprint-by-sprint cards.
3. Show how the system compares predicted risk against actual sprint outcome.
4. Explain how the feedback and outcome data help calibrate future risk assessments.

---

## 3. Demo Data by Project

The data below is designed to show a clear HIGH -> LOW progression after applying recommendations and updating planning inputs.

### 3.1 RDA (Rapid Damage Assessment)

#### Why this project is useful for the demo
- It starts with high workload and high dependencies.
- It responds strongly to scope reduction and improved availability.
- It is good for showing a clear drop in risk after applying recommendations.

#### Demo values
| Stage | Planned Commitment | Team Availability | Sprint Duration | External Dependencies | Expected Risk |
|---|---:|---:|---:|---:|---|
| Initial planning | 60 | 85% | 14 | 7 | HIGH |
| After recommendation | 42 | 100% | 14 | 4 | MEDIUM or LOW |

#### Recommendation to apply
- Reduce Scope
- Improve Team Availability
- Manage Dependencies

#### Suggested feedback entry
- Accuracy: Accurate
- Recommendations helpful: Yes
- Recommendation rating: 5
- Comment: Risk dropped after scope reduction and increased availability.

#### Suggested outcome entry
- Actual outcome: SUCCESS
- Completed points: 39 or 40
- Notes: Planning was adjusted and the sprint stayed under control.

#### Comparison dashboard story
After 3 RDA assessments, show a trend where:
- predicted risk begins as HIGH
- later assessments become MEDIUM or LOW
- actual outcomes match the final adjusted planning values

---

### 3.2 CatNet

#### Why this project is useful for the demo
- It is a stable team with a low-risk profile.
- It is best for showing a clean HIGH to LOW drop using a simple scope reduction.
- It demonstrates the system’s ability to normalize low-variance teams.

#### Demo values
| Stage | Planned Commitment | Team Availability | Sprint Duration | External Dependencies | Expected Risk |
|---|---:|---:|---:|---:|---|
| Initial planning | 55 | 94% | 14 | 2 | MEDIUM or HIGH |
| After recommendation | 45 | 94% | 14 | 2 | LOW |

#### Recommendation to apply
- Reduce Scope

#### Suggested feedback entry
- Accuracy: Accurate
- Recommendations helpful: Yes
- Recommendation rating: 5
- Comment: Reducing scope was enough to bring the sprint into a safe range.

#### Suggested outcome entry
- Actual outcome: SUCCESS
- Completed points: 43 or 44
- Notes: Stable team completed most of the commitment after scope adjustment.

#### Comparison dashboard story
After 3 CatNet assessments, show:
- mostly Accurate predictions
- improving trend or stable trend
- low spillover and low dependency impact

---

### 3.3 OnePlatform

#### Why this project is useful for the demo
- It has more moving parts than CatNet.
- It is useful for showing multiple recommendations and a multi-step improvement path.
- It demonstrates how feedback and comparison capture partial improvement over time.

#### Demo values
| Stage | Planned Commitment | Team Availability | Sprint Duration | External Dependencies | Expected Risk |
|---|---:|---:|---:|---:|---|
| Initial planning | 65 | 86% | 14 | 5 | HIGH |
| After first recommendation | 50 | 86% | 14 | 5 | HIGH or MEDIUM |
| After second recommendation | 50 | 95% | 14 | 3 | MEDIUM or LOW |

#### Recommendation to apply
1. Reduce Scope
2. Improve Team Availability
3. Manage Dependencies

#### Suggested feedback entry
- Accuracy: PartiallyAccurate
- Recommendations helpful: Yes
- Recommendation rating: 4
- Comment: The first recommendation helped, but the sprint needed more than one change.

#### Suggested outcome entry
- Actual outcome: PARTIAL
- Completed points: 46 or 47
- Notes: The team improved after multiple planning changes but did not finish everything.

#### Comparison dashboard story
After 3 OnePlatform assessments, show:
- one HIGH risk sprint
- one partially improved sprint
- one LOW or MEDIUM sprint after the full adjustment path
- overall trend moving toward improving

---

### 3.4 Portfolio Insights

#### Why this project is useful for the demo
- It gives a balanced example where planning changes are meaningful but not extreme.
- It is useful for showing how team availability affects the CVR and capacity calculation.
- It works well for demonstrating calibration because the sprint outcome can match or slightly differ from the prediction.

#### Demo values
| Stage | Planned Commitment | Team Availability | Sprint Duration | External Dependencies | Expected Risk |
|---|---:|---:|---:|---:|---|
| Initial planning | 58 | 87% | 14 | 3 | HIGH |
| After recommendation | 46 | 100% | 14 | 3 | MEDIUM or LOW |

#### Recommendation to apply
- Reduce Scope
- Improve Team Availability

#### Suggested feedback entry
- Accuracy: Accurate
- Recommendations helpful: Yes
- Recommendation rating: 5
- Comment: The risk score dropped immediately after adjusting scope and availability.

#### Suggested outcome entry
- Actual outcome: SUCCESS
- Completed points: 45
- Notes: The sprint ended close to the new plan.

#### Comparison dashboard story
After 3 Portfolio assessments, show:
- first sprint as HIGH risk
- later sprints as better aligned with outcomes
- visible improvement trend in prediction quality

---

### 3.5 Property Insights

#### Why this project is useful for the demo
- It is the easiest project for a clean HIGH to LOW demonstration.
- It shows a strong effect from reducing planned commitment.
- It is good for presenting a simple and clear user flow.

#### Demo values
| Stage | Planned Commitment | Team Availability | Sprint Duration | External Dependencies | Expected Risk |
|---|---:|---:|---:|---:|---|
| Initial planning | 52 | 93% | 14 | 1 | MEDIUM or HIGH |
| After recommendation | 38 | 93% | 14 | 1 | LOW |

#### Recommendation to apply
- Reduce Scope

#### Suggested feedback entry
- Accuracy: Accurate
- Recommendations helpful: Yes
- Recommendation rating: 5
- Comment: Scope reduction made the sprint much safer.

#### Suggested outcome entry
- Actual outcome: SUCCESS
- Completed points: 36 or 37
- Notes: The final plan matched team capacity better.

#### Comparison dashboard story
After 3 Property Insights assessments, show:
- stable low spillover
- strong agreement between predicted and actual outcome
- low-risk trend after planning improvements

---

## 4. Suggested Demo Script

You can use this exact order during the demo:

1. Open Planning Evaluation.
2. Select a project.
3. Enter the initial high-risk values.
4. Show the HIGH risk score and recommendations.
5. Apply the top recommendation.
6. Show that the recommendation disappears.
7. Change the planning values to the lower-risk values.
8. Re-evaluate and show the score dropping.
9. Open Feedback & Calibration.
10. Submit feedback for the assessment.
11. Record the actual sprint outcome.
12. Open Sprint Comparison.
13. Show the last 3 sprint cards and the trend.
14. Explain how the feedback improves calibration.

---

## 5. What to Point Out During the Demo

- The planning screen reacts to changes in planned commitment and team availability.
- Applying a recommendation removes it from the active recommendation list.
- The risk score changes after the planning update is evaluated again.
- Feedback captures whether the prediction was accurate and whether the recommendation helped.
- Feedback submission now includes actual outcome and completed points for comparison data.
- The comparison dashboard shows the last 3 sprint assessments, making the risk story visible over time.

---

## 6. Recommended Story for a Clean End-to-End Demo

If you want the simplest live demo, use this sequence:

1. **Project:** Property Insights
2. **Initial Planning:** 52 points, 93% availability, 1 dependency
3. **Result:** HIGH or MEDIUM risk
4. **Apply Recommendation:** Reduce Scope
5. **Updated Planning:** 38 points, 93% availability, 1 dependency
6. **Result:** LOW risk
7. **Feedback:** Accurate, helpful, 5-star rating, SUCCESS, 36-37 completed points
9. **Comparison:** Show the last 3 assessments and stable/improving trend

This is the easiest project to explain in a short demo while still showing the complete workflow.

---

## 7. Notes for Presenting Results

- Use the same team throughout a single demo sequence so the comparison dashboard has enough history.
- If the comparison dashboard is empty, you need at least 3 assessed sprints for that team.
- Feedback only appears after an assessment exists.
- Outcome and completed points are captured directly in the feedback form.
- The most convincing demo is the one where the initial score is clearly HIGH and the updated score becomes LOW after the recommendation is applied.

---

## 8. Quick Reference Table

| Project | Best Demo Type | Initial State | Final State | Best Recommendation |
|---|---|---|---|---|
| RDA | High pressure team | 60 pts, 85% availability, 7 deps | 42 pts, 100% availability, 4 deps | Reduce Scope + Improve Availability |
| CatNet | Stable simple flow | 55 pts, 94% availability, 2 deps | 45 pts, 94% availability, 2 deps | Reduce Scope |
| OnePlatform | Multi-step flow | 65 pts, 86% availability, 5 deps | 50 pts, 95% availability, 3 deps | Reduce Scope, then improve availability |
| Portfolio Insights | Balanced demo | 58 pts, 87% availability, 3 deps | 46 pts, 100% availability, 3 deps | Reduce Scope + Improve Availability |
| Property Insights | Cleanest demo | 52 pts, 93% availability, 1 dep | 38 pts, 93% availability, 1 dep | Reduce Scope |
