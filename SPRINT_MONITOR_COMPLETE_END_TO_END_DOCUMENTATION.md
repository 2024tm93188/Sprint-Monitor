# Sprint Monitor Complete End-to-End Documentation

## 1. Purpose

This document gives a single end-to-end view of Sprint Monitor: what the system does, how the user flows through it, and how the frontend, backend, database, and ML service connect to each other.

It is written for product review, QA, development, and dissertation documentation.

## 2. System Summary

Sprint Monitor is a sprint planning and risk analysis platform for Agile teams. It combines deterministic scoring, team-specific configuration, recommendation generation, feedback capture, sprint comparison, and an ML-based risk prediction service.

The system is built as three connected layers:

1. Angular frontend for user interaction and state orchestration.
2. ASP.NET Core API for business rules, persistence, and team-specific configuration.
3. Python FastAPI ML service for optional prediction support.

## 3. Core Architecture

### 3.1 Frontend

The frontend lives in [sprint-monitor/src/app](sprint-monitor/src/app) and uses:

- Angular standalone components
- Angular Material
- NgRx for planning evaluation state
- RxJS for reactive state and API flows
- SCSS for custom layout and visual styling

### 3.2 Backend

The backend lives in [sprint-monitor-api/SprintMonitor.API](sprint-monitor-api/SprintMonitor.API) and uses:

- ASP.NET Core Web API
- Entity Framework Core
- SQL Server / LocalDB
- Controllers and services for all domain operations

### 3.3 ML Service

The ML service lives in [ml-service/ml_service.py](ml-service/ml_service.py) and uses:

- FastAPI
- Uvicorn
- Scikit-learn model loading through Joblib
- A `/predict` endpoint and a `/health` endpoint

## 4. Feature Map

### 4.1 Authentication

Users sign in before accessing the main workspace. JWT-based auth is handled by the backend, and the frontend stores auth state for subsequent requests.

### 4.2 Team Context

The application is team-driven. The selected team determines:

- planning inputs
- risk configuration
- historical sprint data
- feedback history
- sprint comparison results

### 4.3 Planning Evaluation

The planning screen collects sprint inputs and triggers risk evaluation.

### 4.4 Team Risk Configuration

Each team can maintain its own thresholds, weights, and team-dynamics settings.

### 4.5 Risk Dashboard

The dashboard presents the computed risk level, score, confidence, factor breakdown, and recommendations.

### 4.6 Recommendations

Recommendations can be applied to change planning values and trigger a new evaluation.

### 4.7 Feedback

Users can capture actual outcome, helpfulness, accuracy, and comments for a prior assessment.

### 4.8 Sprint Comparison

The comparison view summarizes the last three assessments for a team and shows trend information.

### 4.9 Feasibility Studies

Feasibility records are managed separately but share the same team context and overall platform state.

## 5. End-to-End User Flow

## 5.1 Open the App

1. The user opens the Angular app.
2. The app loads auth state and selected team state.
3. The main tabbed workspace is shown after login.

## 5.2 Select a Team

1. The user selects a team from the team selector.
2. The selected team is stored in shared frontend state.
3. Team-specific data is loaded for planning, configuration, feedback, and comparison.

## 5.3 Configure Team Risk Settings

1. The user opens Team Risk Configuration.
2. The app loads the selected team’s saved configuration.
3. The user adjusts thresholds, weights, or team-dynamics settings.
4. The user saves the configuration.
5. The app shows a snackbar confirmation.
6. If there is an active planning input, the app re-runs evaluation so the planning view reflects the new config immediately.

This is important because the saved team-dynamics thresholds must be visible in the planning section without requiring a manual refresh.

## 5.4 Enter Planning Data

1. The user opens the planning input form.
2. The user enters sprint values such as planned commitment, availability, sprint duration, dependencies, and team-dynamics inputs.
3. The user can also prefill from sprint history or CSV import.

## 5.5 Evaluate Risk

1. The user clicks Evaluate Risk.
2. The frontend creates a risk request payload.
3. The backend calculates metrics, factor scores, recommendations, and confidence.
4. The result is saved and shown in the dashboard and recommendations areas.

## 5.6 Apply Recommendations

1. The user reviews the generated recommendations.
2. The user applies one recommendation at a time.
3. The frontend updates planning values and removes the applied recommendation from the active list.
4. The app re-evaluates risk immediately with the updated values.

## 5.7 Submit Feedback

1. The user opens Feedback.
2. The user selects an assessment.
3. The user records actual outcome, completed points, helpfulness, and comments.
4. The backend stores feedback and the UI refreshes calibration-related data.

## 5.8 Review Comparison

1. The user opens Sprint Comparison.
2. The app loads the last three assessments for the selected team.
3. The comparison view shows risk trend, actual outcome, and prediction quality.

## 6. Frontend Technical Flow

### 6.1 Planning Input

The planning form is assembled in [sprint-monitor/src/app/features/sprint-input/sprint-input.component.ts](sprint-monitor/src/app/features/sprint-input/sprint-input.component.ts).

It collects the planning values that drive the risk engine:

- planned commitment
- team availability
- sprint duration
- external dependencies
- team size
- meeting hours
- new members count
- average experience level
- collaboration score

### 6.2 Evaluation Orchestration

The planning evaluation flow is coordinated in [sprint-monitor/src/app/features/planning-evaluation/planning-evaluation.component.ts](sprint-monitor/src/app/features/planning-evaluation/planning-evaluation.component.ts).

That component:

- subscribes to planning state
- dispatches loading actions
- calls the risk engine service
- stores the final assessment and metrics in NgRx

### 6.3 Risk Engine Service

The risk engine logic is in [sprint-monitor/src/app/core/services/risk-engine.service.ts](sprint-monitor/src/app/core/services/risk-engine.service.ts).

It can:

- call the backend API
- fall back to local rule-based evaluation when needed
- map backend responses back into frontend models

### 6.4 Rules Engine

The deterministic frontend scoring helpers live in [sprint-monitor/src/app/core/utils/rules.util.ts](sprint-monitor/src/app/core/utils/rules.util.ts).

They implement the scoring functions for:

- CVR
- velocity variability
- spillover rate
- capacity utilization
- team availability
- risk level determination

### 6.5 Store Flow

The planning evaluation state is managed by NgRx in the planning-evaluation store slice.

The store holds:

- current assessment
- calculated metrics
- current planning input
- loading state

### 6.6 Team Risk Configuration Screen

The configuration screen is implemented in:

- [sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.ts](sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.ts)
- [sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.html](sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.html)
- [sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.scss](sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.scss)

It does three jobs:

1. Loads the selected team’s saved config.
2. Saves edited thresholds and team-dynamics settings.
3. Re-runs planning evaluation after save so the current result is not stale.

## 7. Backend Technical Flow

### 7.1 Startup and Dependency Registration

The backend bootstraps in [sprint-monitor-api/SprintMonitor.API/Program.cs](sprint-monitor-api/SprintMonitor.API/Program.cs).

At startup it:

- registers controllers
- configures EF Core with SQL Server
- registers auth services
- registers sprint, team, feedback, feasibility, and risk services
- registers the ML HTTP client
- applies database migrations
- seeds canonical data if needed

### 7.2 Risk Assessment Pipeline

The central scoring logic is in [sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs](sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs).

The backend pipeline is:

1. receive request in the controller
2. load current sprint history
3. load the latest team-specific risk config
4. calculate metrics
5. score each factor
6. generate recommendations
7. persist assessment, factors, and recommendations
8. return the final response

### 7.3 Team Risk Configuration

Team-specific risk settings are stored and loaded by [sprint-monitor-api/SprintMonitor.API/Services/TeamRiskConfigurationService.cs](sprint-monitor-api/SprintMonitor.API/Services/TeamRiskConfigurationService.cs).

This service is the source of truth for:

- threshold bands
- weight distribution
- team-dynamics toggles
- meeting hours bands
- experience and collaboration bands

### 7.4 API Controllers

Important controllers include:

- [sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs)
- [sprint-monitor-api/SprintMonitor.API/Controllers/TeamsController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/TeamsController.cs)
- [sprint-monitor-api/SprintMonitor.API/Controllers/RiskFeedbackController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/RiskFeedbackController.cs)
- [sprint-monitor-api/SprintMonitor.API/Controllers/FeasibilityController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/FeasibilityController.cs)

## 8. ML Service Technical Flow

The ML service is a FastAPI microservice that loads a trained model at startup.

### 8.1 Startup

On startup it loads:

- `risk_model.pkl`
- `label_encoder.pkl`

If the files are missing, the service starts but reports that the model is not loaded.

### 8.2 Prediction Endpoint

The `/predict` endpoint accepts sprint features and returns:

- predicted risk label
- confidence score
- class probabilities

### 8.3 Health Endpoint

The `/health` endpoint reports whether the model is ready.

### 8.4 Backend Integration

The backend calls the ML service through the HTTP client configured in `Program.cs`.

The configured base URL is `http://localhost:5001`.

## 9. Data and Persistence Model

### 9.1 Main Database Entities

The main domain data is stored in SQL Server / LocalDB and includes:

- Users
- Teams
- Sprints
- RiskAssessments
- RiskFactors
- Recommendations
- RiskFeedbacks
- ImplementationFeasibilities

### 9.2 Data Dependencies

The system is team-centric. Most flows depend on the selected team, and the backend uses the team id to resolve historical data and team-specific configuration.

### 9.3 Persistence Order

For a risk evaluation, the backend typically persists:

1. assessment row
2. factor rows
3. recommendation rows

Feedback and feasibility records are stored separately and later reused by comparison and calibration flows.

## 10. Risk Calculation Model

### 10.1 Deterministic Scoring

The risk engine uses deterministic thresholds so results are explainable.

Core factors include:

- CVR
- velocity stability
- spillover
- capacity utilization
- availability
- dependencies

### 10.2 Team Dynamics

Team dynamics is a team-specific scoring layer controlled by saved configuration.

Inputs include:

- meeting hours per sprint
- new members count
- average experience level
- collaboration score

The team configuration determines how those values are scored and whether the layer is active.

### 10.3 Latest Config Behavior

The backend loads the team configuration fresh on each evaluation. That means changes to the selected team’s configuration affect the next risk calculation without requiring an application restart.

This behavior is what keeps the planning section and score output aligned after a config save.

## 11. User-Facing Screens

### 11.1 Planning Input

This is the entry point for risk evaluation. The user defines what they want to commit and what constraints exist.

### 11.2 Risk Dashboard

This is the primary output screen. It shows the risk score, severity, confidence, and factor breakdown.

### 11.3 Recommendations

This screen explains what to change and lets the user apply recommended actions.

### 11.4 Team Risk Configuration

This screen lets the user tune scoring behavior per team without changing the core model.

### 11.5 Feedback

This screen captures real outcome data so assessments can be validated and compared.

### 11.6 Comparison

This screen shows historical trend and prediction quality over the last three assessments.

### 11.7 Feasibility Studies

This screen manages implementation feasibility and workflow status.

## 12. Important Runtime Connections

### 12.1 Frontend to Backend

Frontend API calls target `http://localhost:5000/api` in development.

### 12.2 Backend to ML

Backend ML requests target `http://localhost:5001` in development.

### 12.3 Team Selection to Evaluation

Changing the selected team changes the planning context, the team config, the historical sprint data, and the comparison results.

### 12.4 Config Save to Planning Update

After saving team risk configuration, the UI re-evaluates the current planning input if one exists.

That is the most important cross-feature connection for team dynamics because it keeps the planning result from going stale.

## 13. Validation Summary

The current implementation has been verified with:

- backend targeted tests
- Angular build verification
- live service startup checks for frontend, backend, and ML service

## 14. Suggested Demo Story

For a clean live walkthrough, use this order:

1. Select a team.
2. Open Team Risk Configuration and change team-dynamics values.
3. Save the configuration.
4. Show that the planning result refreshes automatically.
5. Open Planning Input and evaluate a sprint.
6. Review the dashboard and recommendation list.
7. Apply a recommendation and re-evaluate.
8. Submit feedback for the assessment.
9. Open Sprint Comparison and show the recent trend.

## 15. File Reference Guide

### Frontend

- [sprint-monitor/src/app/core/utils/rules.util.ts](sprint-monitor/src/app/core/utils/rules.util.ts)
- [sprint-monitor/src/app/core/services/risk-engine.service.ts](sprint-monitor/src/app/core/services/risk-engine.service.ts)
- [sprint-monitor/src/app/features/planning-evaluation/planning-evaluation.component.ts](sprint-monitor/src/app/features/planning-evaluation/planning-evaluation.component.ts)
- [sprint-monitor/src/app/features/sprint-input/sprint-input.component.ts](sprint-monitor/src/app/features/sprint-input/sprint-input.component.ts)
- [sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.ts](sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.ts)
- [sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.html](sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.html)
- [sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.scss](sprint-monitor/src/app/features/team-risk-configuration/team-risk-configuration.component.scss)

### Backend

- [sprint-monitor-api/SprintMonitor.API/Program.cs](sprint-monitor-api/SprintMonitor.API/Program.cs)
- [sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs](sprint-monitor-api/SprintMonitor.API/Services/RiskAssessmentService.cs)
- [sprint-monitor-api/SprintMonitor.API/Services/TeamRiskConfigurationService.cs](sprint-monitor-api/SprintMonitor.API/Services/TeamRiskConfigurationService.cs)
- [sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/RiskAssessmentController.cs)
- [sprint-monitor-api/SprintMonitor.API/Controllers/TeamsController.cs](sprint-monitor-api/SprintMonitor.API/Controllers/TeamsController.cs)

### ML Service

- [ml-service/ml_service.py](ml-service/ml_service.py)

## 16. Summary

Sprint Monitor is a connected planning, scoring, recommendation, feedback, and comparison system.

The user flow starts with team selection, moves through planning and risk evaluation, and continues through recommendation application, feedback capture, and historical comparison.

The technical architecture keeps the layers separated but coordinated:

- Angular owns the user experience and local orchestration.
- The API owns authoritative scoring, persistence, and team configuration.
- The ML service provides a supplemental prediction path.

The most important end-to-end guarantee is that team-specific configuration changes are reflected in the next planning evaluation, so the user always sees the latest risk logic applied to the current team.