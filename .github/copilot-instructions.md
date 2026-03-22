## Purpose

This file gives compact, actionable guidance for AI coding agents working in this repository.
Keep edits short and focused — the repo is a minimal, root-level Java example application.

## Big picture

- Single-file Java program located at `Hello.java` in the repository root.
- No build system (Maven/Gradle) or tests present. The project is intentionally minimal: source is package-less, compiled and run with the JDK tools.

## How to run (developer workflows)

Use Windows PowerShell (the developer's default shell):

```powershell
javac Hello.java; if ($LASTEXITCODE -eq 0) { java Hello }
```

This compiles `Hello.java` and runs the `Hello` class if compilation succeeded. Output is printed to stdout.

## Project-specific patterns & conventions

- Files live at the repository root; there are no packages. Expect global, package-less Java classes (see `Hello.java`).
- Avoid adding package declarations unless you also introduce a directory structure and update compile/run instructions.
- No external dependencies or resource files are present — treat new additions as self-contained unless you add a build tool.

## What AI agents should do first

1. Inspect `Hello.java` to learn the code style and scope (it demonstrates simple arithmetic and stdout use).
2. If adding features, mirror the existing repo layout: create files at the root or introduce a single top-level `src/` layout and update this doc with build/run steps.
3. Do not assume existence of tests or CI; if you add tests or CI, update this file with commands and expectations.

## Examples from this codebase

- `Hello.java` (root): package-less class with `public static void main(String[])`, uses `System.out.println` for output. Use it as the canonical example for small, self-contained Java changes.

## Integration points and external dependencies

- Currently none. If you introduce libraries, add a build tool (Gradle/Maven) and update the "How to run" section.

## Merge guidance for humans/agents

- Keep the repo minimal and explicit about any new workflow steps.
- When adding a build system, include: a) install/run commands for Windows PowerShell, b) how to run tests, c) expected artifacts.

## When something is unclear

- Look for additional top-level files (README, build files). If none exist, follow the single-file pattern and document any new conventions in this file.

---
If you'd like, I can also: add a tiny `README.md` that mirrors these run instructions, or convert the project to a `src/` layout with a Gradle wrapper and basic test harness. Which would you prefer?
