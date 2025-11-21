---
title: Agent Directive Prompt
summary: Drop-in prompt header for coding assistants working on NeonLoom / Cyberpunk Conspiracy codebases.
tags: [agents, prompt, dagify]
updated: 2025-11-21
audience: llm
---

# Agent Directive Prompt (Drop-In)

Use this snippet at the top of any coding prompt so assistants inherit the Dagify guardrails. Pair it with the full [Agent Directive](../meta/agent-directive.md) and the compliance checklist.

```text
ARCHITECTURE:
- The entire application is a graph of Dagify nodes.
- Every behavior is a small node or node factory.
- 90% of nodes must be pure (no side effects).
- All external resources (hyper*, sockets, crypto, storage, network) are wrapped in nodes.

HARD RULES:
1) No God objects or big factory functions that return large APIs.
2) No Node-only globals or modules by default (no Buffer, no node: imports, no Node crypto).
3) No `.subscribe()` in library code.
4) One responsibility per node.
5) Use `b4a` for binary, `sodium-universal` + `hypercore-crypto` for crypto, `compact-encoding`/hyperschema for protocol/log data.
6) Keep everything small, composable, and graph-friendly.

TASK:
[Your very specific small task]

SELF-CHECK BEFORE ANSWERING:
- Did I avoid Buffer, node: imports, and Node crypto?
- Did I avoid big factories and global state?
- Are side effects confined only to sinks / subscriptions?
- Is each new node single-purpose and testable?
- Does this match the existing Dagify/RxJS patterns in the file?
If any answer is "no" or "unsure", revise the code before responding.
```
