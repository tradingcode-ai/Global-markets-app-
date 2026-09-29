# GLOBAL MARKETS — AGENT INSTRUCTIONS

This repository contains the Global Markets application.

These instructions are the entry point for AI coding agents working in this repository.

## 1. REQUIRED READING ORDER

Before modifying any application code, read these documents in this order:

1. `.agents/AGENTS.md`
2. `.agents/SUBAGENTS_EXECUTION_POLICY.md`
3. `.agents/MASTER_IMPLEMENTATION_PROMPT.md`
4. `.agents/ARCHITECTURE.md`
5. `.agents/DEEP_MARKET_RESEARCH_ARCHITECTURE.md`

Do not begin implementation until the required documents have been read and understood.

`AGENTS.md` defines the entrypoint and repository-wide guardrails.

`SUBAGENTS_EXECUTION_POLICY.md` defines HOW implementation work must be performed.

`MASTER_IMPLEMENTATION_PROMPT.md` defines WHAT must be implemented.

The architecture documents define the authoritative technical architecture and constraints.

## 2. EXISTING APPLICATION MUST BE PRESERVED

This is an existing production-oriented application.

Do not rebuild, replace, simplify, or broadly refactor existing functionality unless explicitly required by the implementation task.

Preserve existing behavior that is outside the requested scope.

In particular:

- Do not remove existing Global Markets functionality.
- Do not overwrite unrelated features.
- Do not replace the existing Global News Agent.
- Do not modify the Global News Agent's underlying news system unless explicitly required.
- The News UI may be separated from the Research UI as specified by the implementation prompt, but the existing News functionality must remain intact.

## 3. DATA INTEGRITY IS NON-NEGOTIABLE

Never fabricate financial or market data.

Do not invent:

- prices;
- historical prices;
- percentage changes;
- financial statements;
- earnings;
- analyst ratings;
- price targets;
- economic data;
- market statistics;
- sources;
- citations;
- timestamps;
- API responses.

If reliable data is unavailable, represent that explicitly as unavailable rather than creating substitute values.

Live, delayed, cached, historical, and unavailable data must remain distinguishable.

Do not use synthetic market data, random values, noise, placeholder financial history, or formulas intended to make charts appear populated.

## 4. VERIFY BEFORE CLAIMING SUCCESS

Never claim that code works, builds, passes tests, or has been deployed unless that has actually been verified.

After implementation:

1. inspect the resulting diff;
2. run the appropriate tests;
3. run type checking/build/lint where applicable;
4. verify affected functionality;
5. check for regressions outside the requested scope.

If a verification step cannot be executed, state that clearly.

## 5. SCOPE CONTROL

Make the smallest correct change that satisfies the task.

Do not perform unrelated cleanup, redesigns, dependency changes, migrations, or refactors merely because they appear desirable.

If a requested change requires broader architectural changes, follow the authoritative architecture documents and implementation prompt.

## 6. SECURITY

Never expose, commit, hard-code, or print secrets, API keys, credentials, tokens, or private configuration.

Use the repository's existing environment-variable and secret-management mechanisms.

Do not invent environment variables or configuration keys when an existing mechanism can be reused.

## 7. DEVELOPMENT SUBAGENTS

When development subagents are available, follow:

`.agents/SUBAGENTS_EXECUTION_POLICY.md`

Subagents are development-time implementation assistants.

They must perform actual bounded implementation work when delegated.

They are not the production Deep Market Research Agent.

The Main LLM remains responsible for:

- architecture;
- task decomposition;
- delegation;
- reviewing subagent work;
- integration;
- conflict resolution;
- final validation.

Do not treat a subagent's report as proof that its implementation is correct. Inspect and verify the actual repository changes.

## 8. AUTHORITATIVE DOCUMENTS

When instructions conflict, do not silently choose one.

Identify the conflict and follow the applicable authority hierarchy:

1. explicit current user request;
2. applicable system/developer/tool constraints;
3. this `AGENTS.md`;
4. `.agents/SUBAGENTS_EXECUTION_POLICY.md` for development workflow;
5. `.agents/MASTER_IMPLEMENTATION_PROMPT.md` for implementation requirements;
6. authoritative architecture documents for technical architecture;
7. existing repository implementation and conventions.

If an architecture document and the existing implementation disagree, inspect the actual repository state and determine the smallest safe change required by the current task.

## 9. DO NOT GUESS

If an important fact cannot be established from the repository, authoritative documentation, or verified external source, do not invent it.

Prefer:

- inspect;
- search;
- verify;
- state uncertainty;
- ask when necessary.

Never replace missing information with plausible-looking assumptions.

## 10. FINAL RULE

Work like a senior production software engineer.

Understand the existing system before changing it.

Delegate substantial implementation work to development subagents when appropriate.

Review all delegated work.

Protect existing functionality.

Preserve data integrity.

Verify the final result before declaring the task complete.

