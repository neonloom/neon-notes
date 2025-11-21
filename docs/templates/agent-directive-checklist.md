---
title: Agent Directive Compliance Checklist
summary: Drop-in checklist to enforce Dagify-first guardrails before any coding assistant touches a Hyper project.
tags: [agents, dagify, template]
updated: 2025-11-21
audience: both
---

# Agent Directive Compliance Checklist

Use this snippet in every project README or onboarding doc so all coding assistants follow the Dagify guardrails by default.

## Before Coding
- Load the full directive: [docs/meta/agent-directive.md](../meta/agent-directive.md) (or the project-local copy) into the active prompt; keep it pinned for the entire session.
- Confirm the task fits existing Dagify patterns; do not invent new architectures or abstractions.
- Treat all external resources as nodes; avoid global factories and hidden state machines.
- Keep `.subscribe()` out of library code; put side effects only in sink nodes or app boundaries.
- Normalize async to Observables with `$` suffix naming; ensure node factories end with `Node`.
- Split multi-concern work into discrete nodes; push back on scope that violates the directive until the human explicitly overrides it.

## During & After
- Re-check outputs against the directive before shipping: node purity, single responsibility, no God objects.
- Update navigation or links if the directive location changes so future agents can find it.
- If a human asks for a conflicting change, log the exception in the PR or task notes for traceability.

## Next Steps
- Copy this checklist into new project templates so guardrails are enforced automatically.
- Pair this with the [Agent Operations Guide](../../Agents.md) when onboarding new assistants.
