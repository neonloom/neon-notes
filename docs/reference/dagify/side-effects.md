---
title: Managing Side Effects in Dagify
summary: Keep effects at the application edge with sinks/commands/bridges while leaving libraries pure and subscription-free.
tags: [dagify, effects, practices]
updated: 2025-11-21
audience: both
---

# Managing Side Effects in Dagify

Dagify is built for reactive state, but graphs still need to hit the outside world. Keep side effects at **app edges only** and use `dagify/effect` helpers so library code stays pure per the Agent Directive.

## What counts as a side effect
- Network/database/filesystem I/O, logging, metrics.
- UI operations (DOM updates), timers, and any mutation outside the node.
- External subscriptions (event emitters, websockets, streams).

## Guardrails (Agent Directive)
- No `.subscribe()` in reusable libraries; subscribe only in app glue or explicit sink nodes.
- All external resources must live inside nodes (commands/bridges/sinks/triggers) not globals.
- One concern per node; split replication, IO, and status into separate nodes.

## Patterns for controlled effects

### Edge subscription (app code only)
```js
import { createNode } from "dagify";

const userId = createNode(1);
const userData = createNode(null);

// App layer: map the state node to an effect
const stop = userId.subscribe(async id => {
  if (id == null) return;
  const response = await fetch(`/api/users/${id}`);
  userData.set(await response.json());
});
```

### Commands and bridges for request/response
```js
import { createNode } from "dagify";
import { command, bridge } from "dagify/effect";

const payloads = createNode("");
const processed = createNode(([value]) => value.trim(), [payloads]);
const apiBridge = bridge(payloads, processed);

const updateUser = command("@user/update", async payload => {
  await api.call(payload);
  return { ok: true };
}, { disableBatching: false });
```

- Use commands for IO; pair a bridge to coordinate payloads and derived results.
- For ordered async work, wrap a `createQueuedNode` upstream.

### Sink nodes and cleanup helpers
```js
import { createNode, NO_EMIT } from "dagify";
import { sink, invokeOnNode } from "dagify/effect";

const logSink = sink(value => console.log("Log:", value));
const resource = createNode(NO_EMIT);
const dispose = invokeOnNode(resource, "cleanup");
```

- Sinks are explicit effect boundaries; return `NO_EMIT` if you want to silence downstream.
- `invokeOnNode` calls a method on whatever the node emits (handy for teardown).

### Batch and queue effects
- Wrap multiple `set` calls in `batch()` to avoid recomputation storms.
- Configure `command(..., { disableBatching: false })` for lossy coalescing, or use `createQueuedNode` with `maxQueueLength`, `overflowStrategy`, and `onOverflow` for strict ordering.

## Common pitfalls
| Mistake | Why it hurts | Fix |
| --- | --- | --- |
| Performing side effects inside computed nodes | Re-runs unpredictably | Push effects to sinks/commands or app-level subscriptions |
| Subscribing in shared libraries | Violates purity, hides effects | Move subscriptions to app glue; expose sinks/commands instead |
| Not batching bursty updates | Noisy recomputation and backpressure issues | Use `batch()` and queued/command options |
| Reusing references on mutation | Shallow nodes suppress emits | Emit new objects; prefer deep nodes unless modeling wholesale replacements |
