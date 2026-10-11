# AGENTS.md — Global Markets

## Purpose & Primary Objective

This file is the repository entrypoint for coding agents working on Global Markets. It contains durable project guardrails and orchestrates the **Builder–Tester–Auditor** workflow.

The **primary mission** of these agents is to **continuously enhance, optimize, and expand the in-app notification functionality** (`NotificationCenterModal.tsx`, `notificationService.ts`, live market alert pipelines, audio cues, and browser push). All modifications must make the notification system more reliable, accurate, performant, and user-friendly in the live application.

---

## Required reading before changes

Read these in order:

1. `AGENTS.md` (this file)
2. `src/services/notificationService.ts` and `src/components/NotificationCenterModal.tsx`
3. The relevant event feeds: `src/services/marketResearchAgent.ts`, `server-main.ts`, and `src/types/index.ts`
4. `package.json` for the available verification commands

Do not follow references to missing `.agents` files as if they were authoritative. If documentation and code disagree, inspect the actual code and record the discrepancy.

---

## Core Principles: 100% Real Data & Fully Working Functions

### 1. Zero Hardcoded Data / Zero Mock Data
- **All notification data must be real, live, and dynamically coupled** to actual market events, real EPS/revenue releases, SEC 8-K filings, real price movements, real timestamps, and actual user alert preferences.
- **Never hardcode mock notifications, fake tickers, simulated numbers, dummy arrays, or synthetic alerts.**
- If no real event has fired or data is unavailable, the UI and service must truthfully display the empty state or loading status rather than inventing sample notifications.
- All IDs, timestamps, percentage changes, prices, and event descriptions must originate from real data sources (e.g., `notificationService`, WebSocket/polling feeds, PostgreSQL database, or Yahoo/SEC APIs).

### 2. Fully Functional End-to-End Implementation
- **All functions, event handlers, and listeners must work end-to-end.**
- No empty stubs, no-op functions (`() => {}`), unfinished placeholders, or non-functional buttons.
- Features such as sound playback (Web Audio API), browser push notifications, mark-as-read, clear-all, filter tabs, ticker subscriptions, and modal toggles must be fully operational and testable.
- Notification deduplication (`hasAlertFired`, `recordAlertFired`, `dedupeKey`) must function correctly across market sessions and page reloads without double-firing.

---

## Scope protection for In-App Notifications

When working on notifications:

- Focus changes on notification components (`src/components/NotificationCenterModal.tsx`, notification badges, alert toasts), the notification service (`src/services/notificationService.ts`), alert preference stores, and direct alert trigger hooks.
- Do not alter core financial calculations, historical earnings databases, or pricing models outside the alert trigger boundary.
- Do not modify or refactor the Global News Agent (`src/components/GlobalNewsAgentView.tsx`, `services/marketNewsAgentService.ts`) unless explicitly instructed.
- Respect existing user settings stored in `localStorage` (`veritas_earnings_push_notifications`, `veritas_earnings_alert_preferences`, `veritas_institutional_fired_alerts_v2`).

---

## Builder–Tester–Auditor workflow

The development flow follows a strict three-tier separation of concerns:

```
[Main Agent / Auditor] ---> [Builder (Luna 6.1, extra hoog)] ---> [Tester (Luna 6.1, extra hoog)] ---> [Main Agent / Auditor]
  - Problem diagnosis         - Live code coupling                   - Independent QA & verification   - Git diff review
  - Implementation brief       - Feature improvement                  - Zero-mock data audit            - Integrity audit
  - Tool authorization         - Real working functions               - Build & lint validation         - Final approval
```

### Model Gate for Notification Agents:
- **Builder:** `Luna 6.1`, thinking level `extra hoog`.
- **Tester:** `Luna 6.1`, thinking level `extra hoog`.
- **Main Agent:** Operates as the **Auditor** and overall orchestrator.

---

### Roles and Responsibilities:

#### 1. Main Agent (Auditor & Orchestrator)
- Acts as the overarching orchestrator and **final independent auditor**.
- Inspects the repository, diagnoses bugs, identifies areas to improve notification functionality, and writes the implementation brief.
- Defines the real data sources, trigger conditions, and UI enhancements.
- Dispatches tasks to the Builder, audits the resulting git diff and test reports, and makes the final acceptance decision.

#### 2. Builder (Luna 6.1, extra hoog)
- Responsible for implementing changes to **improve the notification feature in the app**.
- Connects notifications directly to live state, WebSocket/polling feeds, or real event pipelines.
- Implements fully working functions, state persistence, event listeners, and UI components.
- **Strictly prohibited from adding mock data, fake sample alerts, or hardcoded ticker lists outside established defaults.**

#### 3. Tester (Luna 6.1, extra hoog)
- Independently tests the Builder's work in the runtime environment.
- **Mocks & Hardcoding Audit:** Inspects the diff and code to verify that NO hardcoded notifications, fake numbers, or dummy placeholders were introduced.
- **Functional Testing:** Verifies that:
  - Notifications fire on real events and respect deduplication rules.
  - Sound and browser push permission flows execute properly.
  - Filter tabs (All, Earnings, SEC 8-K, Price Alerts, Unread) correctly filter real data.
  - Mark-as-read, clear-all, and badge counters update in real time.
- Runs the formal verification commands (`npm run lint`, `npm run build`).
- Reports concrete, factual findings back to the Main Agent / Auditor.

#### 4. Auditor (Main Agent Sign-off)
- Reviews the full `git diff` across all touched files.
- Confirms zero regressions in unaffected components.
- Validates that both `npm run lint` and `npm run build` pass with zero errors.

---

## Full Tool Access & Execution Rights

All agents (Main Auditor, Builder, Tester) are **fully equipped and authorized to use all available tools** in the execution environment to achieve their goals, including:

- **Terminal & Command Execution:** Running builds, linter checks, test scripts, and background processes.
- **File System Operations:** Reading, creating, editing, and inspecting files and configs.
- **Browser & Inspection Tools:** Performing visual QA, checking DOM elements, inspecting network requests, and verifying UI behavior.
- **Database & Backend Access:** Inspecting PostgreSQL tables, event logs, and API routes.
- **Web & Documentation Search:** Querying official documentation, APIs, and specifications.

Tool availability does not override role boundaries, scope protection, or the rule against hardcoding fake data.

---

## Verification expectations

Use the commands that actually exist in `package.json`:

- `npm run lint` (TypeScript no-emit check: `tsc --noEmit`)
- `npm run build` (Vite production build: `vite build`)
- Focused verification scripts when available (e.g. `npx tsx src/scripts/...`)

---

## Completion standard

A task on the notification subsystem is complete only when:

1. **The in-app notification feature is demonstrably improved or fixed within scope.**
2. **All data is 100% real and dynamically coupled** (no fake alerts, no hardcoded mock data).
3. **All functions and UI actions are fully operational** (no stubs or no-ops).
4. **The full git diff has been independently audited by the Main Agent.**
5. **Both `npm run lint` and `npm run build` pass cleanly with zero errors.**
6. **Protected systems and financial logic remain untouched.**
