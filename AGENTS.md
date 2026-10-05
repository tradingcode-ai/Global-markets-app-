# AGENTS.md — Global Markets

## Purpose

This file is the repository entrypoint for coding agents working on Global Markets. It contains durable project guardrails. Task-specific requirements belong in the active user request and in the relevant architecture document.

## Required reading before changes

Read these in order:

1. AGENTS.md
2. docs/architecture/3d-logo-loading.md when the task concerns loading screens, stock/company marks, Three.js, or logo assets
3. The actual files named by the task, especially src/components/StockLogoLoader.tsx and src/components/StockLogo.tsx
4. package.json for the available verification commands

Do not follow references to missing .agents files as if they were authoritative. If documentation and code disagree, inspect the code and record the discrepancy.

## Repository-wide guardrails

- Make the smallest change that satisfies the explicit request.
- Preserve existing behavior outside the requested scope. Avoid broad refactors, dependency changes, generated placeholders, and unrelated formatting changes.
- Never fabricate financial, market, macroeconomic, earnings, or company data. Keep source, timestamp, live/delayed status, and unavailable status truthful.
- Never invent source URLs, citations, API responses, test results, screenshots, or deployment status.
- Never print, hard-code, commit, or expose secrets, tokens, or private configuration.
- Respect existing user changes. Resolve conflicts by inspecting the current branch; do not overwrite unrelated work.
- Verify the actual diff and run the relevant checks before claiming success.

## Scope protection for the 3D logo-loading task

When the active task is the 3D logo-loading task:

- Change only the loading animation implementation, its loading-only asset manifest, and directly required supporting code.
- Do not change the static StockLogo component or logos shown in navigation, dashboards, cards, maps, tables, or detail views unless the user explicitly expands the scope.
- Do not change financial data, data providers, calculations, API routes, research logic, or market-news logic.
- Do not modify, replace, delete, or refactor the Global News Agent. Treat src/components/GlobalNewsAgentView.tsx and services/marketNewsAgentService.ts as protected unless the user explicitly says otherwise.
- If a shared constant is needed, prefer a loading-specific adapter or manifest so other surfaces keep their existing behavior.
- A raster fallback must never be presented as a rotating 3D logo. If real logo geometry cannot load, use a recognizable static logo or an explicit non-animated fallback.

## Builder–Tester–Auditor workflow

The main agent is the orchestrator and final independent auditor.

1. Main agent: inspect the repository, identify the exact defect, research and approve external logo assets, write the implementation brief, and review all changes.
2. Builder: implement only the approved asset set and bounded loading-animation changes. The Builder must not independently search for or substitute logo assets.
3. Tester: independently test the Builder result, including the rendered loading animation, source loading, fallbacks, reduced motion, repeated loading, and scope regression.
4. Main agent: audit the diff, evidence, and test report. If a defect remains, return a precise fix request to the Builder and require a new Tester pass.

Model gate for the logo task:

- Builder: Opus 5.5, medium.
- Tester: Flash 3.8, high.
- The orchestrator must verify that these exact model identifiers and settings are available before delegation. If they are unavailable, do not silently substitute another model and do not claim that the requested models were used; report the blocker and request an approved replacement.

Only the main agent performs internet research and selects replacement logo assets. The Builder and Tester may inspect approved assets and the repository, but they do not choose new external sources.

## Verification expectations

Use the commands that actually exist in package.json:

- npm run lint (TypeScript no-emit check)
- npm run build (Vite production build)

Run focused tests when they exist. Visual checks must be performed on the actual loading flow, not inferred from source alone. Record checks that could not be performed.

## Completion standard

A task is complete only when:

- the requested behavior is implemented within scope;
- the actual diff has been audited;
- relevant build, type, lint, and focused tests have been run;
- visual evidence exists for each affected logo when the task is visual;
- protected files and behavior remain unchanged;
- remaining limitations are stated clearly.

When blocked, stop at the concrete blocker, preserve the repository, and report the exact missing capability or decision.


## Runtime prompt templates

The following files are templates to inject explicitly at runtime:

- agents/prompts/main-system.md — Main Agent system/developer prompt
- agents/prompts/builder.md — Builder role prompt
- agents/prompts/tester.md — Tester role prompt

These files do not grant permissions or tool access by themselves. The runner must explicitly provide the tools, skills, model, branch, and task context assigned to each role. Keep the runtime prompt separate from durable repository guardrails.
