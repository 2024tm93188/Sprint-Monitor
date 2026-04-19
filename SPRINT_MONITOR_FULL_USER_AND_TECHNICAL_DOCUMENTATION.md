# Sprint Monitor - Full User Flow and Technical Documentation

## 1. Document Purpose

This document provides complete documentation for:
- End-to-end user flow for the updated Sprint Monitor experience
- Updated screen behavior and UX details
- Frontend design and component architecture
- Backend design and API flow
- Database design and entity relationships
- Feature mapping: functionality -> frontend component -> backend file -> database table

This is intended for product, QA, developers, reviewers, and maintainers.

---

## 2. System Overview

Sprint Monitor is a risk detection and planning support platform for Agile sprint execution.

Core capability areas:
1. Authentication and user profile management
2. Team-based sprint planning input and historical import
3. Deterministic risk evaluation (score + explainability)
4. Recommendation generation and recommendation application loop
5. Feasibility studies and status workflow
6. Human feedback collection for prediction quality
7. Sprint comparison and trend insights

High-level architecture:
- Frontend: Angular standalone components + NgRx + Angular Material + custom SCSS theme
- Backend: ASP.NET Core Web API + Entity Framework Core + SQL Server
- Auth: JWT access token + refresh token

---

## 3. Updated Screen Summary

The updated experience centers around a single tabbed workspace with tighter flow between planning, risk output, recommendations, and validation tabs.

Main updates included in current implementation:
1. Green visual theme standardization across cards, tabs, form controls, sliders, select options, checkboxes, and radios
2. Updated Risk Dashboard layout with simplified, data-first cards
3. Recommendation application now immediately recalculates risk and updates state
4. Applied recommendations are removed from the active list
5. Team selector dropdown panel styling and fixed panel width behavior
6. Snackbar action can navigate users directly to Risk Dashboard
7. Team switch resets planning state and reloads team-bound data
8. Feedback and Comparison tabs lazy-refresh data on tab entry

Primary updated files:
- sprint-monitor/src/styles.scss
- sprint-monitor/src/app/app.component.html
- sprint-monitor/src/app/app.component.scss
- sprint-monitor/src/app/features/planning-evaluation/planning-evaluation.component.ts
- sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.html
- sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.scss

---

## 4. Complete User Flow

## 4.1 Authentication Flow

1. User opens application route
2. authGuard checks local auth state
3. If unauthenticated -> redirect to login
4. User logs in
5. Frontend stores access token, refresh token, and user profile
6. User lands on the main tabbed workspace

Frontend files:
- sprint-monitor/src/app/app.routes.ts
- sprint-monitor/src/app/core/guards/auth.guard.ts
- sprint-monitor/src/app/core/services/auth.service.ts
- sprint-monitor/src/app/core/interceptors/auth.interceptor.ts

Backend files:
- sprint-monitor-api/SprintMonitor.API/Controllers/AuthController.cs
- sprint-monitor-api/SprintMonitor.API/Services/AuthService.cs

DB table used:
- Users

## 4.2 Team Selection and Data Context Flow

1. App bootstraps and loads teams from API
2. Selected team resolved from local storage or default first team
3. Team switch updates central TeamService state
4. Team switch triggers:
   - planning state reset
   - sprint data reload for selected team
   - feedback/comparison data reload when those tabs are opened

Frontend files:
- sprint-monitor/src/app/app.component.ts
- sprint-monitor/src/app/core/services/team.service.ts
- sprint-monitor/src/app/core/services/sprint.service.ts

Backend files:
- sprint-monitor-api/SprintMonitor.API/Controllers/TeamsController.cs
- sprint-monitor-api/SprintMonitor.API/Services/TeamService.cs

DB table used:
- Teams

## 4.3 Planning Input -> Risk Evaluation Flow

1. User opens Planning Input tab
2. User can:
   - enter planning details manually
   - import CSV history
   - select existing sprint to prefill fields
3. User submits Evaluate Risk
4. PlanningEvaluation component dispatches loading action to NgRx
5. Frontend calls risk API with:
   - teamId
   - optional sprintId
   - plannedCommitment
   - teamAvailability
   - externalDependencies
6. Backend computes metrics, scores factors, generates recommendations, persists assessment
7. Frontend updates store with assessment + metrics
8. Risk Dashboard and Recommendations tabs become active
9. Snackbar shows risk result and allows direct navigation to dashboard

Frontend files:
- sprint-monitor/src/app/features/sprint-input/sprint-input.component.ts
- sprint-monitor/src/app/features/planning-evaluation/planning-evaluation.component.ts
- sprint-monitor/src/app/core/services/risk-engine.service.ts
- sprint-monitor/src/app/core/services/api.service.ts
- sprint-monitor/src/app/core/store/planning-evaluation.actions.ts
- sprint-monitor/src/app/core/store/planning-evaluation.reducer.ts
- sprint-monitor/src/app/core/store/planning-evaluation.selectors.ts

Backend files:
- sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs
- sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs
- sprint-monitor-api/SprintMonitor.API/Services/MetricsService.cs

DB tables used:
- Sprints (historical source)
- RiskAssessments
- RiskFactors
- Recommendations

## 4.4 Recommendation Application Loop (Updated Behavior)

1. User opens Recommendations tab
2. User clicks Apply This on recommendation
3. Frontend:
   - marks recommendation key as applied
   - removes it from current store recommendation list
   - mutates relevant planning fields depending on action type
   - re-evaluates risk immediately using refreshed form values
4. Updated risk result and recommendations are stored
5. Previously applied recommendations remain filtered out
6. Snackbar offers View action to open dashboard

Action examples:
- REDUCE_SCOPE -> reduce planned points
- ADD_BUFFER -> reserve buffer from planned points
- RESOLVE_DEPENDENCIES -> reduce dependency count
- INCREASE_CAPACITY -> increase availability

Frontend files:
- sprint-monitor/src/app/features/recommendations/recommendations.component.ts
- sprint-monitor/src/app/features/planning-evaluation/planning-evaluation.component.ts

Backend files:
- sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs

DB tables used:
- RiskAssessments
- RiskFactors
- Recommendations

## 4.5 Risk Dashboard Consumption Flow

1. Dashboard reads current assessment and metrics from inputs/store-backed parent
2. Displays:
   - risk level
   - risk score
   - confidence
   - sprint metrics
   - factor-by-factor breakdown
3. Class-based color coding reflects low/medium/high and factor score severity

Frontend files:
- sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.ts
- sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.html
- sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.scss

Backend dependency:
- Indirect via risk evaluation response and metrics in RiskAssessmentService

DB tables used:
- RiskAssessments
- RiskFactors

## 4.6 Feasibility Study Flow

1. User opens Feasibility tab
2. Loads existing studies for selected team
3. User can create/edit/delete studies
4. User can update status via workflow values (Proposed, Under Review, Approved, Deferred, Rejected)
5. Summary stats displayed

Frontend files:
- sprint-monitor/src/app/features/feasibility-study/feasibility-study.component.ts
- sprint-monitor/src/app/core/services/feasibility.service.ts

Backend files:
- sprint-monitor-api/SprintMonitor.API/Controllers/FeasibilityController.cs
- sprint-monitor-api/SprintMonitor.API/Services/FeasibilityService.cs

DB table used:
- ImplementationFeasibilities

## 4.7 Feedback and Calibration Flow

1. User opens Feedback tab
2. User can open feedback form and select a prior assessment
3. User submits:
   - actual outcome
   - optional completed points
   - agreement level
   - recommendation rating/helpfulness
   - comments
4. Backend upserts feedback for assessment
5. Accuracy metrics are recalculated and displayed

Frontend files:
- sprint-monitor/src/app/features/risk-feedback/risk-feedback.component.ts
- sprint-monitor/src/app/core/services/feedback.service.ts

Backend files:
- sprint-monitor-api/SprintMonitor.API/Controllers/RiskFeedbackController.cs
- sprint-monitor-api/SprintMonitor.API/Services/RiskFeedbackService.cs

DB tables used:
- RiskFeedbacks
- RiskAssessments
- Sprints

## 4.8 Sprint Comparison Flow

1. User opens Comparison tab
2. Frontend requests last-three assessment comparison for selected team
3. Backend combines:
   - assessments
   - linked sprint data
   - linked feedback data
4. Frontend displays trend, per-sprint cards, and generated insights

Frontend files:
- sprint-monitor/src/app/features/sprint-comparison/sprint-comparison.component.ts
- sprint-monitor/src/app/core/services/feedback.service.ts

Backend files:
- sprint-monitor-api/SprintMonitor.API/Controllers/RiskFeedbackController.cs
- sprint-monitor-api/SprintMonitor.API/Services/RiskFeedbackService.cs

DB tables used:
- RiskAssessments
- RiskFeedbacks
- Sprints

---

## 5. Frontend Design Documentation

## 5.1 Visual Language

Global design tokens are defined in styles.scss:
- Primary brand color family based on green/teal
- Soft neutral surfaces and subtle gradient backgrounds
- Rounded cards, softened borders, reduced harsh shadows
- Explicit Angular Material MDC overrides to remove default blue emphasis

Typography:
- Headings/tabs/cards: Space Grotesk
- Body/content/forms: Manrope

Core design files:
- sprint-monitor/src/styles.scss
- sprint-monitor/src/app/app.component.scss

## 5.2 App Shell and Navigation Design

Main shell behavior:
- Sticky toolbar at top
- Team selector in toolbar
- User profile menu with role/email
- Sticky tab header, scrollable tab content
- Footer with product context

Design intent:
- Keep planning workflow centered and continuous
- Preserve tab content state across tab switches
- Show risk status badges directly in tab labels

Files:
- sprint-monitor/src/app/app.component.html
- sprint-monitor/src/app/app.component.scss

## 5.3 Updated Risk Dashboard Design

Visual structure:
1. Risk Summary card
2. Sprint Metrics card
3. Risk Factors card

Design choices:
- Uniform green-border card system
- Color-coded severity chips (risk and factor score)
- Data-first rows with high readability
- Mobile fallback to single-column grids

Files:
- sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.html
- sprint-monitor/src/app/features/risk-dashboard/risk-dashboard.component.scss

## 5.4 Form and Control Design

Implemented control consistency:
- Form field focus/outline/caret all mapped to brand green
- Slider track/handle green
- Checkbox/radio selected state green
- Select option selected/hover states green

Key files:
- sprint-monitor/src/styles.scss
- sprint-monitor/src/app/app.component.scss
- sprint-monitor/src/app/features/sprint-input/sprint-input.component.scss

## 5.5 Responsive Behavior

Main responsive patterns:
- Dashboard summary and metric grids collapse to single-column on narrow widths
- Sprint input actions stack vertically on small devices
- Core layout remains usable in mobile by preserving card blocks and scannable rows

---

## 6. Frontend Technical Design

## 6.1 Routing and Access

Route strategy:
- Login/register/forgot/reset routes for unauthenticated users
- Main app route guarded by authGuard
- noAuthGuard prevents authenticated users from reopening auth pages

Files:
- sprint-monitor/src/app/app.routes.ts
- sprint-monitor/src/app/core/guards/auth.guard.ts

## 6.2 State Management (NgRx)

Feature stores:
1. planningEvaluation
2. team
3. sprint

planningEvaluation state:
- planningInput
- assessment
- metrics
- loading

Files:
- sprint-monitor/src/app/core/store/app.state.ts
- sprint-monitor/src/app/core/store/planning-evaluation.state.ts
- sprint-monitor/src/app/core/store/planning-evaluation.actions.ts
- sprint-monitor/src/app/core/store/planning-evaluation.reducer.ts
- sprint-monitor/src/app/core/store/planning-evaluation.selectors.ts

## 6.3 HTTP and Auth Interceptor

- Functional interceptor injects Bearer token
- Skips token on public auth endpoints
- On 401, performs refresh-token flow and retries request

File:
- sprint-monitor/src/app/core/interceptors/auth.interceptor.ts

## 6.4 Environment and API Base Paths

Current frontend env values:
- apiBaseUrl: http://localhost:5001/api
- apiUrl: http://localhost:5001/api/auth

File:
- sprint-monitor/src/environments/environment.ts

---

## 7. Backend Design Documentation

## 7.1 Backend Layering

Layer map:
1. Controllers: HTTP contracts and validation
2. Services: business logic, scoring, mapping
3. Data layer: EF Core DbContext and entity configuration
4. SQL Server persistence via migrations

Core bootstrap:
- Program configures JWT auth, CORS, Swagger, DI, EF migrations, seed checks

File:
- sprint-monitor-api/SprintMonitor.API/Program.cs

## 7.2 Controllers and Responsibilities

1. AuthController
- login/register/refresh/logout/me/change-password/profile/users/forgot/reset/validate

2. TeamsController
- team CRUD and deactivation

3. SprintsController
- sprint CRUD, recent sprint fetch, CSV import

4. MetricsController
- computed metrics, velocity chart, spillover analysis

5. RiskAssessmentController
- evaluate risk, fetch assessment history/detail

6. FeasibilityController
- feasibility CRUD, status updates, summary

7. RiskFeedbackController
- submit feedback, team feedback list, accuracy, sprint comparison

Controller files:
- sprint-monitor-api/SprintMonitor.API/Controllers/AuthController.cs
- sprint-monitor-api/SprintMonitor.API/Controllers/TeamsController.cs
- sprint-monitor-api/SprintMonitor.API/Controllers/SprintsController.cs
- sprint-monitor-api/SprintMonitor.API/Controllers/MetricsController.cs
- sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs
- sprint-monitor-api/SprintMonitor.API/Controllers/FeasibilityController.cs
- sprint-monitor-api/SprintMonitor.API/Controllers/RiskFeedbackController.cs

## 7.3 Services and Responsibilities

1. AuthService
- credential validation, token generation, refresh logic, profile and password operations

2. TeamService
- team lifecycle and DTO mapping

3. SprintService
- sprint CRUD and team-specific retrieval

4. CsvImportService
- bulk sprint ingestion for historical baseline

5. MetricsService
- average velocity, variance, spillover, effective capacity, recommendations baseline

6. RiskAssessmentService
- deterministic scoring engine, factor scoring, recommendation generation, persistence

7. FeasibilityService
- feasibility workflow and summary metrics

8. RiskFeedbackService
- feedback upsert, accuracy analytics, last-three sprint comparison analysis

Service files:
- sprint-monitor-api/SprintMonitor.API/Services/AuthService.cs
- sprint-monitor-api/SprintMonitor.API/Services/TeamService.cs
- sprint-monitor-api/SprintMonitor.API/Services/SprintService.cs
- sprint-monitor-api/SprintMonitor.API/Services/CsvImportService.cs
- sprint-monitor-api/SprintMonitor.API/Services/MetricsService.cs
- sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs
- sprint-monitor-api/SprintMonitor.API/Services/FeasibilityService.cs
- sprint-monitor-api/SprintMonitor.API/Services/RiskFeedbackService.cs

## 7.4 Security Design

- JWT Bearer authentication required on all core controllers
- Auth endpoints exposed anonymously where needed (login/register/forgot/reset/refresh)
- Role-based authorization available for admin routes
- Refresh token lifecycle stored against user record

---

## 8. Database Design Documentation

## 8.1 DbContext and Entity Sets

Entity sets defined in SprintMonitorDbContext:
- Teams
- Sprints
- RiskAssessments
- RiskFactors
- Recommendations
- TeamSettings
- ImplementationFeasibilities
- RiskFeedbacks
- Users

File:
- sprint-monitor-api/SprintMonitor.API/Data/SprintMonitorDbContext.cs

## 8.2 Table-by-Table Functional Purpose

1. Teams
- Team master profile and active status
- Parent for sprint and assessment data context

2. Sprints
- Historical and current sprint execution data
- Foundation for metrics and risk calculation

3. RiskAssessments
- Snapshot of each planning evaluation output
- Stores score, risk level, confidence, and optional actual outcome

4. RiskFactors
- Explainable breakdown rows for each assessment score contributor

5. Recommendations
- Action items produced per assessment

6. TeamSettings
- Team-level threshold/config storage

7. ImplementationFeasibilities
- Feasibility studies and approval status tracking

8. RiskFeedbacks
- Human evaluation of prediction quality and recommendation usefulness

9. Users
- Authentication and profile storage

## 8.3 Relationship Design

Primary relationships:
- Team 1..* Sprint
- Team 1..* RiskAssessment
- RiskAssessment 1..* RiskFactor
- RiskAssessment 1..* Recommendation
- Team 1..* TeamSetting
- RiskFeedback *..1 RiskAssessment
- RiskFeedback *..1 Sprint (optional)
- User *..1 Team (optional)

Deletion behavior highlights:
- Team delete cascades to sprints, risk assessments, and settings
- Risk assessment delete cascades to factors and recommendations
- Risk feedback links to sprint with NoAction delete behavior

## 8.4 Seed and Startup Data Behavior

Startup flow:
1. Apply migrations
2. If no teams exist -> full canonical seed
3. Else -> ensure canonical teams/sprints exist without resetting runtime history

File:
- sprint-monitor-api/SprintMonitor.API/Data/DbSeeder.cs

---

## 9. Functionality Mapping (Complete)

| Functionality | Frontend Component/Service | Backend Controller/Service | DB Table(s) |
|---|---|---|---|
| Login | features/auth/login + AuthService | AuthController + AuthService | Users |
| Register | features/auth/register + AuthService | AuthController + AuthService | Users |
| Forgot/Reset Password | auth forms + AuthService | AuthController + AuthService | Users |
| Team listing and selection | app.component + TeamService | TeamsController + TeamService | Teams |
| Sprint history loading | SprintService + SprintInputComponent | SprintsController + SprintService | Sprints |
| CSV import | SprintInputComponent | SprintsController + CsvImportService | Sprints |
| Risk evaluation | PlanningEvaluationComponent + RiskEngineService | RiskAssessmentController + RiskAssessmentService + MetricsService | Sprints, RiskAssessments, RiskFactors, Recommendations |
| Risk dashboard display | RiskDashboardComponent | (served from RiskAssessment APIs) | RiskAssessments, RiskFactors |
| Recommendation apply and re-evaluate | RecommendationsComponent + PlanningEvaluationComponent | RiskAssessmentController + RiskAssessmentService | RiskAssessments, RiskFactors, Recommendations |
| Feasibility study CRUD | FeasibilityStudyComponent + FeasibilityService | FeasibilityController + FeasibilityService | ImplementationFeasibilities |
| Feedback submission | RiskFeedbackComponent + RiskFeedbackService | RiskFeedbackController + RiskFeedbackService | RiskFeedbacks, RiskAssessments, Sprints |
| Prediction accuracy analytics | RiskFeedbackComponent | RiskFeedbackController + RiskFeedbackService | RiskFeedbacks, RiskAssessments |
| Last-three sprint comparison | SprintComparisonComponent | RiskFeedbackController + RiskFeedbackService | RiskAssessments, RiskFeedbacks, Sprints |
| Metrics API and chart data | services/api + metrics consumers | MetricsController + MetricsService | Sprints |

---

## 10. API Surface (Operational Summary)

Authentication:
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/change-password
- PUT /api/auth/profile
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/validate

Teams:
- GET /api/teams
- GET /api/teams/{teamId}
- POST /api/teams
- PUT /api/teams/{teamId}
- DELETE /api/teams/{teamId}

Sprints:
- GET /api/sprints/team/{teamId}
- GET /api/sprints/team/{teamId}/recent
- GET /api/sprints/{sprintId}
- POST /api/sprints
- PUT /api/sprints/{sprintId}
- DELETE /api/sprints/{sprintId}
- POST /api/sprints/import/{teamId}
- POST /api/sprints/import/{teamId}/string

Metrics:
- GET /api/metrics/team/{teamId}
- GET /api/metrics/team/{teamId}/velocity-chart
- GET /api/metrics/team/{teamId}/spillover-analysis

Risk Assessment:
- POST /api/riskassessment/evaluate
- GET /api/riskassessment/history/{teamId}
- GET /api/riskassessment/{assessmentId}

Feasibility:
- GET /api/feasibility
- GET /api/feasibility/{feasibilityId}
- GET /api/feasibility/team/{teamId}/latest
- GET /api/feasibility/summary
- POST /api/feasibility
- PUT /api/feasibility/{feasibilityId}
- PATCH /api/feasibility/{feasibilityId}/status
- DELETE /api/feasibility/{feasibilityId}

Risk Feedback:
- POST /api/riskfeedback
- GET /api/riskfeedback/{feedbackId}
- GET /api/riskfeedback/team/{teamId}
- GET /api/riskfeedback/assessment/{assessmentId}
- GET /api/riskfeedback/team/{teamId}/accuracy
- GET /api/riskfeedback/team/{teamId}/comparison

---

## 11. Technical Flow Diagrams (Textual)

## 11.1 Evaluate Risk Sequence

1. SprintInputComponent emits planning payload
2. PlanningEvaluationComponent dispatches startRiskEvaluation
3. RiskEngineService calls ApiService.evaluateRisk
4. Auth interceptor injects JWT
5. RiskAssessmentController validates request
6. RiskAssessmentService loads team sprints
7. MetricsService calculates derived metrics
8. RiskAssessmentService scores factors and generates recommendations
9. Persist RiskAssessment + RiskFactors + Recommendations
10. Response returned to frontend
11. completeRiskEvaluation updates store
12. App enables Risk Dashboard and Recommendations tabs

## 11.2 Apply Recommendation Sequence

1. RecommendationsComponent emits selected recommendation
2. AppComponent routes apply event to PlanningEvaluationComponent
3. PlanningEvaluationComponent marks recommendation as applied and removes from store list
4. Planning form values are adjusted by action type
5. PlanningEvaluationComponent re-runs evaluation
6. Store receives fresh assessment while filtering already-applied recommendation keys
7. Snackbar action optionally redirects user to Risk Dashboard tab

## 11.3 Feedback and Comparison Sequence

1. User submits feedback from RiskFeedback tab
2. RiskFeedbackController -> RiskFeedbackService upserts feedback
3. Feedback tab reloads list + accuracy summary
4. Comparison tab requests team comparison
5. RiskFeedbackService merges assessments + sprints + feedback into comparison DTO
6. Frontend renders trend and sprint cards

---

## 12. Design and Engineering Notes for Future Changes

1. Keep recommendation filtering key strategy aligned across frontend and backend recommendation fields
2. If risk thresholds are made configurable at runtime, TeamSettings should become source of truth in RiskAssessmentService
3. Current risk score max values in service and model should stay aligned when factor weights change
4. Continue explicit Material MDC overrides while using prebuilt themes to avoid style regression to default blue
5. If project grows, split app-level tabs into route-based lazy modules for bundle optimization

---

## 13. Quick File Index

Frontend app shell and theme:
- sprint-monitor/src/styles.scss
- sprint-monitor/src/app/app.component.ts
- sprint-monitor/src/app/app.component.html
- sprint-monitor/src/app/app.component.scss

Frontend feature modules:
- sprint-monitor/src/app/features/sprint-input
- sprint-monitor/src/app/features/planning-evaluation
- sprint-monitor/src/app/features/risk-dashboard
- sprint-monitor/src/app/features/recommendations
- sprint-monitor/src/app/features/feasibility-study
- sprint-monitor/src/app/features/risk-feedback
- sprint-monitor/src/app/features/sprint-comparison
- sprint-monitor/src/app/features/auth

Frontend platform services and state:
- sprint-monitor/src/app/core/services
- sprint-monitor/src/app/core/store
- sprint-monitor/src/app/core/interceptors/auth.interceptor.ts
- sprint-monitor/src/app/core/guards/auth.guard.ts

Backend API and data layers:
- sprint-monitor-api/SprintMonitor.API/Program.cs
- sprint-monitor-api/SprintMonitor.API/Controllers
- sprint-monitor-api/SprintMonitor.API/Services
- sprint-monitor-api/SprintMonitor.API/Data
- sprint-monitor-api/SprintMonitor.API/Models
- sprint-monitor-api/SprintMonitor.API/DTOs

---

## 14. Current Runtime Defaults

Frontend base URL assumptions:
- Frontend app served on localhost (Angular dev server)
- Backend API configured to localhost:5001

Environment file:
- sprint-monitor/src/environments/environment.ts

---

End of document.
