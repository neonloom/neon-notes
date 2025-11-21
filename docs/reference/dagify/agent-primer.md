---
title: Dagify Agent Primer
summary: Quick brief for LLM/human handoffs when working on Dagify graphs.
tags: [dagify, agents, meta]
updated: 2025-11-21
audience: llm
---

# Agent Primer

Keep LLM and human collaborators aligned when using Dagify. Pair this with the [Agent Directive](../../meta/agent-directive.md) before coding.

- **Read this first:** `PROMPT.md` and `DAGIFY-PROMPT-FOR-LLM.md` at the Dagify repo root describe the expected API understanding and sample exercises for Dagify 2.x.
- **Source of truth:** Follow the navigation in `../index.md`. Use reference pages for exact signatures; defer to source code if anything disagrees.
- **Safety rails:** Keep effects at the edge (commands/bridges/sinks), don’t mutate shared references with shallow nodes, and prefer batched updates when emitting bursts.
- **Handoffs:** Include the graph shape (nodes + edges), dependency shapes (object vs array), and fail-fast/backpressure settings in any task you pass to another agent.
- **Testing:** Exercise commands and bridges with representative payloads before calling external APIs; use the examples in `../examples/recipes.md` as templates.
