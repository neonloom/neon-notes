---
title: Retrieval Playbook
summary: Guidelines for keeping prompts and context lean when collaborating with LLMs.
tags: [meta, llm, retrieval]
updated: 2025-10-18
audience: both
---

# Retrieval Playbook

> **Context Card**
> - **Scope:** Shared rules for assembling lightweight task context for humans and LLMs.
> - **Primary APIs:** N/A — focuses on prompt and document assembly workflows.
> - **Protocols/Feeds:** References Hyper docs, Autobase feeds, and service manifests by link only.
> - **Dependencies:** Access to `docs/index.md`, related references, and project source.
> - **Outputs:** Concise prompt packets, citation bundles, follow-up TODOs.
> - **Next Hop:** [`../templates/context-card.md`](../templates/context-card.md)

Keep this checklist in mind when preparing collaboration packets or retrieval prompts. The aim is to hand LLMs exactly what they need — no more — while leaving breadcrumbs for humans to audit.

## 1. Choose the smallest useful slice
- Start from `docs/index.md` and pull only the headings or files relevant to the task.
- Prefer linking (`../reference/hypercore-api.md`) over pasting full text unless the model must quote exact snippets.
- If a doc is long but only one section matters, include just that heading and a brief summary.

## 2. Lead with a context card
- Add the `Context Card` block to any doc that an agent will read end-to-end.
- When preparing custom notes, mirror the template: scope, APIs, feeds, dependencies, outputs, next hop.
- Keep cards under eight bullets so they fit inside narrow context windows.

## 3. Bundle code and protocol facts
- Cite feeds/topics exactly (32-byte topic hex, Autobase namespace) so agents can locate the right resource.
- Record message codecs and encodings inline when they are non-default; otherwise link to the definition.
- For FRP flows, list the generator order and `update()` cadence up front.

## 4. Compress examples
- Provide the shortest representative code snippet that still compiles or runs.
- Replace repeated scaffolding with comments (`// setup omitted`) so the focus stays on the API surface.
- Point to real files (`src/services/foo.js:42`) instead of duplicating large blocks.

## 5. Flag gaps instead of guessing
- If a doc or feed is missing, add a TODO to the nearest **Next Steps** section instead of inventing details.
- When an agent uncovers a gap, drop a note into `inbox/` with context so it can be triaged later.

## 6. Validate retrieval results
- Ask the model to restate assumptions before acting; review the list for missing constraints.
- Cross-check any non-trivial claim against the referenced doc or API sheet.
- Keep a short post-session log (bullet list) summarising files touched and outstanding questions.

Following this playbook keeps decentralised, FRP-heavy projects approachable while ensuring documentation remains token-efficient for downstream automation.
