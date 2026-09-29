# GLOBAL MARKETS — DEEP MARKET RESEARCH IMPLEMENTATION MASTER PROMPT

## BEFORE IMPLEMENTATION

This document is the authoritative implementation specification for this task.

You MUST read and understand this entire document before beginning implementation.

Do not treat the architecture documents as a replacement for this implementation prompt.

Before modifying application code, you must also read and understand:

1. `.agents/AGENTS.md`
2. `.agents/SUBAGENTS_EXECUTION_POLICY.md`
3. `.agents/ARCHITECTURE.md`
4. `.agents/DEEP_MARKET_RESEARCH_ARCHITECTURE.md`

### Document responsibilities

* `AGENTS.md` defines repository-wide agent instructions and guardrails.
* `SUBAGENTS_EXECUTION_POLICY.md` defines HOW the Main LLM and development subagents must perform the work.
* `MASTER_IMPLEMENTATION_PROMPT.md` defines WHAT must be implemented for this task.
* `ARCHITECTURE.md` defines the general application architecture.
* `DEEP_MARKET_RESEARCH_ARCHITECTURE.md` defines the authoritative Deep Market Research architecture.

All of these documents must be considered together.

The Master Implementation Prompt must NOT be partially read or treated as optional.

Do not begin implementation until the required documents have been read and understood.

## 1. FIRST: READ THE ARCHITECTURE DOCUMENTS

After reading this implementation prompt, read and understand:

* `.agents/ARCHITECTURE.md`
* `.agents/DEEP_MARKET_RESEARCH_ARCHITECTURE.md`

These documents provide the architectural constraints and technical context required to implement this specification correctly.

The architecture documents supplement this implementation prompt. They do not replace it.

If requirements appear to conflict, stop and resolve the conflict using the authority rules defined in `.agents/AGENTS.md` and `.agents/SUBAGENTS_EXECUTION_POLICY.md` before making implementation changes.

You are the lead software architect and senior full-stack engineer responsible for implementing the Deep Market Research system inside the existing **Global Markets** application.

Your task is to inspect the existing application, understand its architecture, and implement the complete Market Research feature across:

- backend;
- market monitoring and trigger logic;
- scheduler;
- Antigravity research-agent integration;
- research data persistence;
- API layer;
- UI;
- configuration;
- testing;
- error handling;
- production hardening.

Do not create a superficial prototype.

Implement this as a production-grade feature that fits naturally into the existing application.

---

# 1. FIRST: READ THE TWO ARCHITECTURE DOCUMENTS

Before changing any code, locate and thoroughly read the **two provided architecture documents** in the workspace/repository.

These documents contain the authoritative decisions for:

1. the Market Research architecture, trigger/monitor design and event lifecycle;
2. the Deep Market Research system prompt / event prompt / research behavior.

Read both documents completely before designing or modifying the implementation.

Treat those documents as the source of truth for:

- research behavior;
- trigger philosophy;
- event deduplication;
- research report structure;
- source selection;
- preferred-source registry;
- research limits;
- asset-class trigger thresholds;
- event lifecycle;
- research-agent behavior.

Do not replace their architecture with a simpler implementation merely because it is easier to code.

If the existing repository architecture differs from the documents, first determine the safest integration point.

Do not blindly rewrite existing systems.

---

# 2. IMPORTANT: PRESERVE THE EXISTING APPLICATION

This is an existing production-oriented application.

Before editing:

- inspect the repository structure;
- inspect the existing backend;
- inspect the existing Global News Agent;
- inspect existing data models;
- inspect existing APIs;
- inspect existing database/storage mechanisms;
- inspect existing environment variables and API-key handling;
- inspect existing scheduler infrastructure;
- inspect existing asset-class definitions;
- inspect existing UI patterns.

Do not delete or overwrite unrelated functionality.

Do not replace existing systems when the new Research Agent can be integrated alongside them.

Do not modify the underlying Global News Agent's existing behavior unless explicitly required for the new Research split.

The existing Global News Agent is existing user-owned work and must be preserved.

---

# 3. GLOBAL NEWS AGENT UI: SPLIT NEWS AND RESEARCH

The Deep Market Research system must live inside the existing **Global News Agent** area of the application.

However, the Global News Agent UI should be cleanly divided into two distinct sections:

## NEWS

The existing Global News Agent.

Its existing functionality must continue working as before.

Do not replace it with the Research Agent.

## RESEARCH

A separate Deep Market Research section within the same overall Global News Agent area.

The user should immediately understand that:

- News = scheduled news aggregation;
- Research = event-driven deep market research.

These are separate systems with separate triggers and schedules.

The Research UI should feel like a natural extension of the existing application, not a separate prototype.

---

# 4. RESEARCH AGENT — ACTUAL RUNTIME AGENT

The Research Agent itself must be implemented as an **Antigravity managed agent using Gemini 3.8 Flash**.

Target configuration:

- Antigravity agent;
- Gemini 3.8 Flash;
- medium reasoning/effort configuration if the currently supported SDK/API exposes such a parameter;
- Google Search;
- URL Context.

Do not invent unsupported API parameters.

Before implementing the integration, verify the currently installed Google SDK/API and its supported configuration.

Google's current documentation confirms that Antigravity managed agents support model selection and tools including Google Search and URL Context. The default Antigravity model is Gemini 3.8 Flash.

The Research Agent must NOT use another agent as a subagent.

The Research Agent is one autonomous research agent.

Do not build an internal multi-agent research hierarchy.

---

# 5. RESEARCH AGENT SYSTEM PROMPT

Use the provided Deep Market Research system prompt from the architecture documents as the authoritative system instruction.

Do not silently simplify it.

It must preserve the requirements around:

- data integrity;
- no fabricated financial data;
- no fabricated sources;
- confirmed facts vs reported claims vs inference;
- autonomous research;
- maximum 5 search queries;
- normally maximum 8–10 relevant source documents;
- stopping early when sufficient evidence exists;
- Preferred-Source Registry;
- Source Selection Rule;
- causality;
- Immediate Event;
- Direct Market / Sector Impact;
- Broader Context;
- market reaction;
- what to watch next;
- confidence;
- sources;
- event deduplication;
- conflicting information;
- no investment recommendations.

The Research Agent must perform the same full research standard for every triggered event.

There are NOT two research levels.

A triggered event always receives the full Deep Research workflow.

The only variable is whether an event crosses the deterministic trigger threshold.

---

# 6. PREFERRED-SOURCE REGISTRY

The system prompt must contain the Preferred-Source Registry defined in the architecture document.

The registry should distinguish at minimum:

## Primary / Official

Examples:

- company Investor Relations;
- company filings;
- SEC / EDGAR;
- Federal Reserve;
- ECB;
- Bank of England;
- Bank of Japan;
- U.S. Treasury;
- relevant governments;
- relevant regulators;
- official exchanges;
- OPEC;
- IEA;
- EIA;
- other relevant official agencies.

## Preferred Financial News

Examples:

- Reuters;
- Bloomberg;
- CNBC;
- Financial Times;
- Wall Street Journal.

## Preferred Real-Time Signals

Examples:

- Walter Bloomberg — X: @DeItaone;
- First Squawk — X: @FirstSquawk;
- LiveSquawk — X: @LiveSquawk;
- FinancialJuice — X: @financialjuice;
- Nick Timiraos — X: @NickTimiraos;
- The Kobeissi Letter — X: @KobeissiLetter.

Treat real-time signal accounts as early-warning sources, not automatic confirmation.

Multiple outlets repeating the same underlying report must not be counted as independent confirmation.

The registry is a reference set.

It is NOT a mandatory browsing sequence.

---

# 7. SOURCE SELECTION

The Research Agent must autonomously select the most relevant sources.

Selection priority:

1. relevance to the event;
2. ability to establish or verify the specific claim;
3. authority/reliability;
4. independence.

Do not force a browsing order such as:

Reuters → Bloomberg → government → ECB.

Instead:

- determine what happened;
- identify the information needed to establish it;
- select the most relevant sources;
- verify material claims;
- stop when sufficient evidence exists.

Example:

A company event:

Company IR / filing
→ independent financial reporting
→ specialist source if useful.

A geopolitical event:

Real-time signal
→ official government/agency source
→ independent financial reporting
→ specialist context if necessary.

---

# 8. MARKET MONITOR IS NOT AN AI AGENT

This distinction is critical.

The Market Monitor / Trigger Engine must NOT be an LLM agent.

It must be deterministic application code.

The trigger is hard-coded/configured in the application.

The Market Monitor should:

1. retrieve verified market data;
2. calculate the relevant movement;
3. compare the movement against the configured asset-specific threshold;
4. determine whether the asset is enabled for Research;
5. detect whether the movement represents a new event;
6. deduplicate against existing events;
7. create a Research Event;
8. queue the Research Agent.

The LLM must never decide whether a market movement crosses the initial trigger threshold.

That decision belongs to deterministic application code.

---

# 9. TRIGGER CONFIGURATION

Use the trigger architecture from the supplied trigger document.

Do not invent a completely new threshold model.

Triggers must be defined by asset/security group and must be configurable in code.

The system must support different thresholds for different categories such as:

- indices;
- sector indices / ETFs;
- mega-cap stocks;
- large/mid-cap stocks;
- small/mid/high-beta stocks;
- Brent;
- WTI;
- gold;
- silver;
- major FX;
- crypto;
- gas / energy;
- other commodities.

The trigger must be based on verified market data.

Never create synthetic movement data.

---

# 10. INDIVIDUAL RESEARCH ENABLE / DISABLE

Users must be able to control which assets are monitored for Deep Research.

The configuration UI must allow:

- individual securities to be enabled/disabled;
- groups of assets to be enabled/disabled;
- asset classes to be enabled/disabled;
- commodities to be enabled/disabled;
- securities groups to be enabled/disabled.

For example:

Asset Class
  → Aerospace & Defense
      → RTX [Research ON]
      → LMT [Research ON]
      → BA [Research OFF]

Commodity
  → Energy
      → Brent [Research ON]
      → WTI [Research ON]

The configuration should be persistent.

Do not require users to edit source code to enable or disable individual research coverage.

---

# 11. RESEARCH SCHEDULER

The existing News Agent operates on scheduled news runs.

Do NOT copy that four-times-per-day schedule for Research.

Research requires a separate market-monitoring scheduler.

The Research scheduler should wake the server / market monitor approximately every:

- 5 minutes, OR
- 10 minutes.

Make the interval configurable.

Do not make the Research Agent itself continuously poll the market.

The scheduler wakes the application.

Then:

Scheduler
→ Market Monitor
→ deterministic trigger evaluation
→ Research Event
→ Antigravity Research Agent.

If there are no qualifying events:

- do not call the Research Agent;
- exit cleanly.

This prevents unnecessary agent usage and cost.

---

# 12. EVENT DEDUPLICATION

Do not create a new research report every time the same asset moves another percentage point.

Example:

Brent:

+4.2%
→ research event

+4.8%
→ same underlying event

+5.1%
→ same underlying event

These should normally remain one research event unless evidence indicates a materially new catalyst.

A new event can be created when there is:

- a new catalyst;
- escalation;
- policy action;
- confirmation;
- reversal;
- separate fundamental development.

Do not define event identity solely by:

- ticker;
- timestamp;
- percentage movement.

Use the event/catalyst model defined in the architecture document.

---

# 13. RESEARCH EVENT LIFECYCLE

Implement the event lifecycle from the architecture document.

At minimum support states conceptually equivalent to:

NEW
→ RESEARCHING
→ ACTIVE
→ COOLED_DOWN
→ CLOSED

Use the existing application's naming conventions if they differ.

The important behavior is:

- prevent duplicate research;
- track active research;
- track completion/failure;
- allow subsequent materially new catalysts to create new events.

---

# 14. RESEARCH REPORT DATA MODEL

Create a persistent research report model containing, at minimum:

- report ID;
- event ID;
- asset;
- ticker;
- asset class;
- triggered movement;
- movement period;
- trigger timestamp;
- executive summary;
- immediate catalyst;
- direct market/sector impact;
- broader context;
- what the market is reacting to;
- what to watch next;
- confidence;
- sources;
- creation timestamp;
- research status.

Preserve source metadata where available.

Sources should include:

- title;
- URL;
- publisher;
- source category;
- relevance;
- accessed/retrieved timestamp where available.

Do not fabricate metadata.

---

# 15. DATABASE / KEYS / EXISTING INFRASTRUCTURE

Reuse the application's existing database, persistence layer, environment variables, API keys and infrastructure whenever appropriate.

Do not create unnecessary parallel databases.

Do not create duplicate API-key configuration if the application already has the necessary credentials.

Use the same existing environment/configuration patterns.

If the Research Agent needs a key already used by the application:

- reuse the existing environment variable/configuration;
- never hard-code the secret;
- never expose secrets to the client;
- never commit secrets;
- never print secrets in logs.

If a new credential is genuinely required, integrate it through the application's existing secret/configuration mechanism.

---

# 16. UI REQUIREMENTS

The Research section must look professional and production-ready.

It should not look like a debug console.

The UI should make it immediately clear:

- which asset moved;
- by how much;
- when it triggered;
- why research was initiated;
- current research status;
- whether research is complete;
- confidence;
- key catalyst;
- source count;
- relevant context.

Every research report should prominently display the relevant:

- ticker;
- company/asset name;
- asset class;
- market movement;
- timestamp.

For example:

┌─────────────────────────────────────────┐
│ RTX                                      │
│ RTX Corp. · Aerospace & Defense          │
│                                         │
│  -6.4%                                   │
│ Triggered 14:35 CET                      │
│                                         │
│ Deep Market Research                     │
│ Research completed                       │
└─────────────────────────────────────────┘

The exact design should follow the existing application's visual language.

Use existing components where appropriate.

Do not introduce an unrelated design system.

---

# 17. RESEARCH DASHBOARD

The Research section should provide a clear overview of:

## Active Research

Events currently being researched.

## Recent Research

Recently completed reports.

## Triggered Events

Events that crossed thresholds.

## Research Configuration

Controls for:

- asset classes;
- groups;
- individual securities;
- research enable/disable;
- scheduler interval if appropriate.

Use clear visual status indicators.

Avoid excessive UI complexity.

---

# 18. RESEARCH REPORT VIEW

A completed report should be presented as a professional market-research document.

At the top:

- ticker;
- asset;
- asset class;
- movement;
- period;
- timestamp;
- research status.

Then:

### Market Move

### Executive Summary

### 1. Immediate Catalyst

### 2. Direct Market / Sector Impact

### 3. Broader Context

### 4. What the Market Is Reacting To

### 5. What to Watch Next

### 6. Confidence

### 7. Sources

Use source links where available.

Do not hide the sources behind an opaque UI.

The user should be able to inspect the evidence.

---

# 19. NO SEPARATE QUALITY-CONTROL AGENT IN THE PRODUCT

Do NOT add the previously discussed Flash-Lite quality-control agent to the application.

The production architecture should contain:

Market Monitor
→ Research Agent
→ Research Report
→ deterministic application validation
→ persistence
→ UI.

There is no second AI agent that reviews every research report.

The Research Agent itself is responsible for following its system prompt.

The application should still perform deterministic validation such as:

- required report sections exist;
- ticker matches event;
- movement matches trigger;
- source list exists;
- report is not empty;
- research status is valid;
- timestamps are valid;
- report belongs to the correct event.

These are application-level validations, not an AI reviewer.

---

# 20. SOFTWARE DEVELOPMENT SUBAGENT WORKFLOW

For implementing this feature, use 2–3 subagents if the Antigravity coding environment supports subagent/parallel task execution.

IMPORTANT:

These subagents are **development assistants only**.

They are NOT part of the production Research Agent architecture.

Use them like a professional software engineering team.

Recommended structure:

## SUBAGENT 1 — ARCHITECTURE / BACKEND

Responsibilities:

- inspect existing backend;
- inspect database/persistence;
- inspect scheduler;
- inspect existing market data;
- inspect environment/configuration;
- design Research Event and Research Report integration;
- identify safest integration points;
- implement backend/agent integration.

Do not modify unrelated systems.

## SUBAGENT 2 — FRONTEND / UI

Responsibilities:

- inspect existing Global News Agent UI;
- design the News / Research split;
- implement Research dashboard;
- implement Research configuration UI;
- implement research report view;
- reuse existing visual components;
- ensure responsive and professional presentation.

Do not change backend behavior unless required for the UI contract.

## SUBAGENT 3 — TESTING / INTEGRATION REVIEW

Responsibilities:

- inspect the combined implementation;
- run tests/build/lint where available;
- inspect API contracts;
- inspect trigger behavior;
- inspect event deduplication;
- inspect scheduler behavior;
- inspect error handling;
- identify regressions;
- identify accidental changes to Global News Agent;
- recommend or implement fixes.

If only two subagents are available, combine the testing/integration role with the architecture/backend role.

---

# 21. IMPORTANT SUBAGENT RULE

Do not allow subagents to independently redesign the architecture.

The two architecture documents remain authoritative.

The main Antigravity coding agent remains the final integrator.

The workflow should be:

1. Read architecture documents.
2. Inspect repository.
3. Build implementation plan.
4. Delegate bounded tasks.
5. Review subagent changes.
6. Integrate carefully.
7. Run deterministic tests.
8. Run build/lint/type checks.
9. Inspect the final diff.
10. Verify that unrelated functionality was not modified.

Do not simply accept subagent output without reviewing it.

---

# 22. IMPLEMENTATION ORDER

Implement in this order:

## Phase 1 — Repository analysis

Inspect:

- existing Global News Agent;
- market data layer;
- scheduler;
- database;
- asset/security universe;
- API routes;
- UI components;
- environment configuration.

Do not change code yet.

## Phase 2 — Architecture mapping

Map the two architecture documents onto the existing application.

Identify:

- integration points;
- reusable services;
- existing data structures;
- existing APIs;
- existing scheduler;
- required new tables/collections/files;
- required UI components.

## Phase 3 — Backend foundation

Implement:

- research configuration;
- deterministic market trigger;
- research event;
- event deduplication;
- research queue;
- scheduler;
- research persistence.

## Phase 4 — Antigravity integration

Implement:

- Gemini 3.8 Flash Antigravity agent;
- Google Search;
- URL Context;
- system instruction;
- event prompt;
- source registry;
- research limits;
- error handling;
- timeout handling;
- retry behavior where appropriate.

Verify the actual Google SDK/API schema before coding.

Do not invent fields.

Current Google documentation shows that Antigravity supports `google_search` and `url_context`, and supports Gemini 3.8 Flash as the default model.

## Phase 5 — UI

Implement:

- News / Research split;
- Research dashboard;
- active/recent research;
- configuration;
- individual security toggles;
- group toggles;
- report view;
- source presentation.

## Phase 6 — Integration

Connect:

Market trigger
→ Event
→ Scheduler/queue
→ Antigravity
→ Report
→ Persistence
→ UI.

## Phase 7 — Validation

Run:

- TypeScript checks;
- lint;
- build;
- relevant tests;
- API checks;
- scheduler checks;
- trigger checks;
- deduplication tests.

Fix all issues found.

---

# 23. DATA INTEGRITY

This application handles financial information.

Never:

- generate synthetic prices;
- generate fake historical values;
- generate fake financial figures;
- fabricate analyst data;
- fabricate sources;
- fabricate citations;
- create placeholder financial data that looks real;
- silently substitute invented data when an API fails.

If data is unavailable:

- return unavailable/N/A;
- use an existing verified cached snapshot where the application's existing architecture permits it;
- clearly label cached/stale data.

Do not hide uncertainty.

---

# 24. FAILURE HANDLING

The Research Agent may fail.

Handle:

- API errors;
- timeout;
- search failures;
- URL fetch failures;
- quota errors;
- malformed agent output;
- incomplete research;
- scheduler failure;
- database failure.

A failed research event must not appear as a successful completed report.

Store appropriate status/error metadata.

Do not silently publish incomplete research as complete.

---

# 25. COST AND USAGE CONTROL

The system should minimize unnecessary Antigravity usage.

Only invoke the Research Agent after:

1. market data has been checked;
2. trigger threshold is crossed;
3. research is enabled for the asset;
4. the event is not already covered by an active/recent equivalent event.

Do not invoke the agent for every scheduler cycle.

Do not invoke the agent for movements below the deterministic threshold.

Do not let the Research Agent continuously monitor markets.

The scheduler is responsible for waking the system.

---

# 26. SECURITY

Never expose:

- Gemini API keys;
- database credentials;
- internal service credentials;
- environment secrets

to the browser/client.

Never commit secrets.

Never log secrets.

Research source URLs may be stored and displayed.

---

# 27. EXISTING GLOBAL NEWS AGENT PROTECTION

This is extremely important.

The existing Global News Agent must remain functional.

Do not:

- delete it;
- replace it;
- rewrite its backend unnecessarily;
- change its scheduling behavior;
- change its RSS processing;
- change its existing data pipeline.

The required change is to add a separate Research capability alongside it and split the existing UI area into:

NEWS
+
RESEARCH.

If an existing shared component must be modified, make the smallest compatible change possible.

---

# 28. FINAL ARCHITECTURE

The intended final architecture is:

                    GLOBAL MARKETS APP
                           │
             ┌─────────────┴─────────────┐
             │                           │
          NEWS                        RESEARCH
             │                           │
      Existing News Agent        Market Scheduler
                                         │
                                         ▼
                                  Market Monitor
                                         │
                                         ▼
                                  Hard-coded /
                                  deterministic
                                  trigger engine
                                         │
                                         ▼
                                  Event Deduplication
                                         │
                                         ▼
                                  Research Event
                                         │
                                         ▼
                              Antigravity Research Agent
                                  Gemini 3.8 Flash
                                  Search + URL Context
                                         │
                                         ▼
                                  Research Report
                                         │
                                         ▼
                              Deterministic validation
                                         │
                                         ▼
                                  Persistence / DB
                                         │
                                         ▼
                                  Research UI


SOURCE FLOW:

Preferred-Source Registry
          │
          ▼
Source Selection Rule
          │
          ▼
Relevant sources for event
          │
          ▼
Research Agent
          │
          ▼
Evidence-based report

The Registry defines preferred sources.

The Selection Rule determines which sources are actually relevant.

The Market Monitor is deterministic application code.

The Research Agent performs the full research.

There is no production quality-control AI agent.

---

# 29. FINAL ACCEPTANCE CRITERIA

Do not consider the implementation complete until all of the following are true:

### Architecture
- Two architecture documents were read and followed.
- Existing architecture was preserved where appropriate.
- Global News Agent remains functional.

### Market monitoring
- Scheduler wakes the system every configurable 5–10 minutes.
- Market Monitor is deterministic code.
- Trigger thresholds are hard-coded/configured in the application.
- No LLM decides the initial trigger.
- Individual research enable/disable works.
- Group/asset-class enable/disable works.
- Event deduplication works.

### Research Agent
- Antigravity is used.
- Gemini 3.8 Flash is used.
- Google Search is enabled.
- URL Context is enabled.
- Correct current SDK/API schema is used.
- System prompt is implemented.
- Event prompt is implemented.
- Preferred-Source Registry is implemented.
- Source Selection Rule is implemented.
- Maximum research limits are represented.
- No fabricated financial data or sources are permitted.

### UI
- News and Research are clearly separated.
- Research dashboard is professional.
- Relevant ticker is prominently shown.
- Asset name and asset class are shown.
- Movement and trigger timestamp are shown.
- Research status is shown.
- Complete report structure is displayed.
- Sources are visible and inspectable.
- Research configuration is accessible.
- Individual and group toggles work.

### Engineering
- Existing database/infrastructure is reused where appropriate.
- Existing API keys/environment variables are reused safely.
- No secrets are exposed.
- No unrelated files/features are unnecessarily changed.
- Type checking passes.
- Lint passes where configured.
- Production build passes.
- Relevant tests pass.
- Final diff has been reviewed.

If any acceptance criterion fails, fix it before declaring the implementation complete.

Do not claim success merely because the code was written.

---

# 30. FINAL PRINCIPLE

Build this as a real financial-market research subsystem inside the existing Global Markets application.

Do not build a demo.

Do not simplify the architecture without justification.

Do not replace the existing News Agent.

Do not create a second AI quality-control agent.

Use deterministic application logic for market triggers.

Use Antigravity Gemini 3.8 Flash for the actual Deep Research.

Use the two architecture documents as the source of truth.

Use development subagents only to improve implementation coverage, code quality, testing and integration review.

The final system should be reliable, auditable, maintainable and production-oriented.
