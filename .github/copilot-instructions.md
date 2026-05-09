## Purpose

This file gives compact, actionable guidance for AI coding agents working in the Sprint Monitor workspace.
Keep edits narrow, evidence-driven, and aligned with the existing frontend, backend, and ML architecture.

## Big picture

- The workspace is a multi-project system with Angular frontend, ASP.NET Core API, and a Python ML service.
- The main backend behavior lives in `sprint-monitor-api/SprintMonitor.API`.
- The main frontend behavior lives in `sprint-monitor/src/app`.
- The ML runtime lives in `ml-service`.
- Existing architecture docs and status notes are part of the source of truth; inspect them before changing behavior.

## How to run (developer workflows)

Use Windows PowerShell (the developer's default shell):

```powershell
dotnet test sprint-monitor-api/SprintMonitor.sln
```

```powershell
Set-Location "c:\Users\sunit\Desktop\Dissertation Project\Sprint_Monitor\sprint-monitor"; npm run build
```

```powershell
Set-Location "c:\Users\sunit\Desktop\Dissertation Project\Sprint_Monitor\ml-service"; python -m uvicorn ml_service:app --host 127.0.0.1 --port 8000
```

## Project-specific patterns & conventions

- Keep frontend, backend, and ML contracts synchronized when changing request/response shapes.
- Prefer the existing orchestration flow: rule engine, ML fallback, then combined risk result.
- When behavior changes, inspect the nearest controller, service, DTO, model, and test together.
- Preserve the current architecture unless the request explicitly calls for a refactor.

## What AI agents should do first

1. Inspect the nearest feature code and any relevant architecture docs or status notes.
2. Identify the exact layer that owns the behavior: frontend, backend, ML, or cross-service contract.
3. Check for existing tests or smoke flows that already cover the slice.
4. Make the smallest change that matches the current architecture.
5. Re-run the narrowest verification that can disprove the hypothesis.

## Integration points and external dependencies

- Backend API talks to the ML service through `IMlRiskService`.
- Angular consumes the backend API through `ApiService` and related feature services.
- If you change one side of a contract, update the matching DTO, model, and test surface on the other side.

## Merge guidance for humans/agents

- Keep changes local to the affected slice.
- Add or update validation whenever the architecture contract changes.
- Prefer explicit run commands and targeted tests over broad exploratory edits.

## When something is unclear

- Look for additional top-level docs such as `SPRINT_MONITOR_FULL_USER_AND_TECHNICAL_DOCUMENTATION.md`, `SPRINT_MONITOR_CODE_FLOW.md`, and the repository notes.
- Trace the request through the relevant service boundary before editing.
- If behavior appears inconsistent after a change, verify the live API and ML runtime before assuming the code is wrong.
