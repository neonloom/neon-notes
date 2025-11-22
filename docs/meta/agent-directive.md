---
title: Agent Directive
summary: Non-negotiable Dagify-first guardrails for coding assistants and LLMs working on the Hyper stack.
tags: [agents, dagify, guardrails]
updated: 2025-11-22
audience: llm
---

# Agent Directive v0.1 (Coding Assistants & LLMs)

_NeonLoom / Cyberpunk Conspiracy_

> **Core Principle:** The entire application is a **graph**. Every piece of logic is a **Dagify node**. Nodes are modular Lego blocks: pure, tiny, testable, and composed functionally. No giant abstractions, no multi-responsibility factories.

---

## 1. Core Intent

You are **not** here to create architectures or abstractions. You are here to produce **small, composable Dagify nodes**, each with one purpose, designed to fit cleanly into a larger FRP/DAG system.

You are *not* here to reinvent architecture or introduce your own frameworks.

You are a **precision tool** that:

- Extends **existing patterns**.
- Creates **small, focused units** (functions or nodes).
- Respects **decentralization and visual-graph design** goals.

If you are uncertain, **prefer doing less** and staying within the established patterns instead of “helpfully” overengineering.

---

## 2. Hard Invariants (Non-Negotiable)

1. **Everything external is a node.** All resources (Hyperswarm, Hyperdrive, Hypercore, Autobase, Corestore, sockets, crypto, anything IO) must be wrapped as Dagify nodes. Never created globally or inside large, stateful factories.
2. **Nodes are tiny Lego blocks. One job each.** If a node does more than one thing, split it.
3. **90% of nodes must be pure.** Side effects only occur in a **sink node** or an application-level subscription.
4. **No God objects. No multi-concern factories.** Do not write abstractions that combine: drive creation + connection handling + replication + filesystem API + swarm status, etc.
5. **RxJS: No `.subscribe()` in library code.** Composition only. Subscription is allowed only at the application boundary or inside explicit sink nodes.
6. **Async normalization.** Promises, thenables, event emitters → converted to Observables with `$` suffix.
7. **Naming conventions.** `$` suffix for Observables. Node factories end with `Node`. Node defs follow consistent `inputs`/`outputs/create()` shape.
8. **No architectural refactors.** Do not shift paradigms. Do not introduce new frameworks. Follow the existing FRP/DAG/node-centric design faithfully.
9. **Every argument is a node.** Factories and option bags must receive nodes, not plain values. Any raw value must be wrapped upstream before reaching library code. Library code should fail fast on non-nodes—no implicit `ensureNode` or auto-wrapping helpers.

---

## 3. Dagify Node Pattern (Omnipresent Architecture)

Your mental model is: **the app is the graph.** Everything is a node; everything flows as Observables.

### 3.1 Pure Nodes (90% of all nodes)
- Deterministic, side-effect free, testable, and do not mutate outer state.

Example:
```js
const depReactionCounterNode = dep$ => {
  let counter = 0;
  return createNode(() => counter++, dep$);
};
```

### 3.2 Reaction Nodes
Nodes that derive values from others but still remain pure.

### 3.3 Sink Nodes (Explicitly Impure)
All side effects must be completely encapsulated.

```js
createSinkNode(n => {
  // side effects allowed here
}, someDep$);

createNode(n => {
  // side effects allowed only because sink: true
}, someDep$, { sink: true });
```

### 3.4 Node Factories
Each behavior is a **separate factory function** that returns a Dagify node. Factories themselves are nodes whose value resolves to a function; errors otherwise. No function literals at call sites—callers pass a factory node.

```js
export const replicateNode = (resourceNode, connection$) =>
  createReferenceNode(
    ({ connection, resource }) => resource.replicate(connection),
    { connection: connection$, resource: resourceNode }
  );
```

### 3.5 Node Definition Objects (for visual graphs)
Prefer defining node descriptors that a visual editor can consume.

```js
export const replicateNodeDef = {
  id: "replicateNode",
  label: "Replicate resource over connection",
  kind: "effect", // "source" | "transform" | "effect"
  inputs: {
    connection: { type: "connectionStream" },
    resource: { type: "replicableResource" },
  },
  outputs: {},
  create({ connection, resource }) {
    return createReferenceNode(
      ({ connection, resource }) => resource.replicate(connection),
      { connection, resource }
    );
  },
};
```

**Guidelines:**
- Node factories (`replicateNode`, `joinSwarmNode`, etc.) receive other nodes or streams as **inputs**.
- Keep `createReferenceNode` callbacks small and pure; interact with external resources but avoid allocating new architectures.
- Avoid clever parameter shadowing (e.g. reusing `connection$` names).
- When asked to add new behavior, **add a new node def** instead of extending existing ones unless explicitly instructed otherwise.
- UI adapters (Svelte/RxJS) live at the edge; Svelte stores/Observables should only see Dagify nodes. No `.subscribe()` in library code—use sink nodes or app-level subscriptions.

---

## 4. Platform, Runtime & Library Constraints

- **Isomorphic by default.** Do **not** rely on Node-only globals or modules unless explicitly allowed:
  - ❌ `Buffer` global, `node:`-prefixed imports, Node `crypto`.
  - ✅ Use isomorphic libraries instead.
- **Buffers via `b4a` (required).** Replace `Buffer.*` with `b4a.*`.
- **Crypto via `sodium-universal` and `hypercore-crypto`.** No Node `crypto`.
- **Serialization.** Avoid JSON for protocol/log data; prefer `compact-encoding` or hyperschema. JSON is fine for debug/config/human-facing APIs.
- **Encoding/Schema guidelines.** Keep field names tight; propose `compact-encoding` schemas instead of raw JSON when optimizing logs/protocols.

---

## 5. Hyper* Stack Usage Rules

- Treat Hypercore / Hyperbee / Corestore / Autobase / Hyperswarm / Hyperdrive as **pluggable resources**. Lifecycle lives in small nodes, not uber-constructs.
- **Hyperswarm:** create inside a node factory; expose events as streams (`connection$`, `onClose$`, `onError$` via `fromEvent` + RxJS).
- **Hyperdrive & replication:** never monolithic helpers (e.g. `createHyperdriveNamespace`). Split into: storage dir node, corestore node, hyperdrive node, write/read nodes, replication node, swarm join node, swarm status node.
- **Bounded by default:** queues must set `maxQueueLength`; list/read streams must enforce `limit`/`range`; unbounded operations are banned unless explicitly justified and documented.

---

## 6. Resource Node Guardrails (Dagify)

- **No uncontrolled emits.** Wrap resources with `createNode`/`createReferenceNode` using `NO_EMIT` until they are fully ready; do not emit during construction.
- **Handles are reference nodes.** Autobase/Corestore/Hypercore/Hyperbee/Hyperdrive handles must be created via `createReferenceNode` so internal ticks don’t recompute; only emit when the handle changes.
- **Ops bags are nodes.** Expose operations via a `createNode` over the ready handle; methods return promises so completion is observable. Call ops with `invokeOnNode(node, "method", args)`—never touch `.value` directly.
- **Sinks are for fire-and-forget.** If the caller needs completion/failure, expose an async method on the ops bag, not a sink/command node.
- **Keep computed nodes pure.** Side effects only in ops methods invoked via `invokeOnNode` or in explicit sinks.
- **Adapter patterns.** Generalize shared flows (ready/update/events/get/put/watch) via adapters; avoid per-resource duplication.
- **Object dependencies.** Prefer object-shaped deps (e.g., `{ base: readyAutobase }`), one concern per node, for clean teardown and testing.
- **No implicit wrapping.** If an API needs a node, the caller must supply one; fail fast on non-nodes—no `ensureNode` wrappers inside libraries.
- **Lifecycle discipline.** Resource nodes register finalize/cleanup hooks, avoid global state, and gate async handles via ready/withReady before emitting.
- **Testing guardrails.** Any node that queues/limits or accepts external inputs must have tests covering overflow/invalid range and node-type validation.

---

## 7. Task Style & Scope

- Assume the user wants **small, incremental changes**.
- Prefer **micro-tasks** (e.g., “Add a node that converts a Hyperdrive discovery key to z32 string.”).
- Copy existing patterns before inventing new ones.
- Do not silently introduce new dependencies or frameworks.

---

## 8. Autonomy & Drift Control

- **Do not** introduce large abstractions, multi-responsibility interfaces, or paradigm shifts.
- **Do** ask for the smallest useful change, keep contributions easy to delete, and leave clear comments when behavior is non-obvious.
- Default to minimal, obvious code that matches local style.

---

## 9. Testing Philosophy

- Favor tests around **individual nodes/functions**, not just end-to-end flows.
- Add/adjust tests when introducing new behavior:
  - Single responsibility checks.
  - Basic error paths.
  - Integration with hyper* resources using stubs/mocks.
- Example goals:
  - `hyperdriveWriteNode`: fake drive with `put`; ensure `put(path, buffer)` called and returns `buffer.length`.
  - `hyperdriveReplicationNode`: fake drive + mock duplex stream; ensure `drive.replicate` is called and piping is wired.

---

## 10. Agent Prompt Template (Drop-In)

Use this as the **standard header** whenever an AI coding assistant works on NeonLoom / CPC code. Paste at the top of the prompt before any task-specific details.

```text
You are working on NeonLoom / Cyberpunk Conspiracy code.

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

STYLE:
- Use `$` suffix for Observables, and `Node` suffix for node factories.
- Prefer creating new small nodes over expanding existing ones.
- Do not introduce new frameworks or paradigms.

TASK:
[Describe the specific, small task here – e.g. "Add a hyperdriveWriteNode that writes a file via Hyperdrive using b4a."]

SELF-CHECK BEFORE ANSWERING:
- Did I avoid Buffer, node: imports, and Node crypto?
- Did I avoid big factories and global state?
- Are side effects confined only to sinks / subscriptions?
- Is each new node single-purpose and testable?
- Does this match the existing Dagify/RxJS patterns in the file?
If any answer is "no" or "unsure", revise the code before responding.
```

---

## 11. Red Flags vs Green Flags

### 11.1 Red Flags (Drift)
- Large factory functions that create resources, manage state, and expose many methods/fields at once (e.g. `createHyperdriveNamespace` returning a big object).
- Module-level mutable state mixed with behavior (e.g. `let swarming = false;`, `const activeConnections = new Set();`).
- Direct use of `Buffer.from`, `Buffer.isBuffer`, `import fs from 'node:fs'`, `import crypto from 'node:crypto'`, or JSON for protocol/log payloads.
- `.subscribe(...)` calls inside reusable libraries/nodes.
- Nodes that do more than one conceptual job (join + replicate + describe + log).

### 11.2 Green Flags (On-Pattern)
- Small node factories such as `joinSwarmNode`, `replicateNode`, `hyperdriveWriteNode`, `hyperdriveReadNode`.
- Pure transformation nodes that map/merge/filter Observables, convert data formats, or compute derived values.
- Sink nodes clearly marked and isolated (`createSinkNode(...)` or nodes with `{ sink: true }`).
- Consistent use of `b4a` for buffers, `hypercore-crypto` for randomBytes/hash/sign/verify, and `compact-encoding`/hyperschema for log entries.
- Code that is easy to unit test in isolation.

---

## 12. Summary

- The app is a graph of small Dagify nodes; everything external is wrapped as a node.
- 90% of nodes are pure; impurity is explicit and quarantined in sinks.
- hyper* + b4a + sodium-universal + hypercore-crypto + compact-encoding are the default toolkit.
- Agents must work incrementally and pattern-faithfully, using the prompt template and self-check to avoid drift.
- If in doubt: **shrink the change, split the node, and keep the graph clean.** Always prefer the local pattern over generic best practice.
