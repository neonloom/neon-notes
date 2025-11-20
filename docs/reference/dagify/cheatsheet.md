---
title: Dagify Cheatsheet
summary: Quick-reference grid of Dagify node builders, configs, and repo-specific helpers so humans and agents can snap blocks together without rediscovering APIs.
tags: [dagify, reference, cheatsheet]
updated: 2025-10-21
audience: both
---

# Dagify Cheatsheet

Use this sheet when you need to recall the core Dagify primitives (and the helpers we wrap around them) without re-reading the entire reference set. Treat it as the “Lego inventory” for the Dagify side of the Virtualia deck.

---

## Core builders (from Dagify)

- `createNode(initialValue | computeFn, deps?, config?)` — basic stateful or computed node. Accepts arrays/objects of dependencies or factory functions. filecitedocs/reference/dagify/core-api.md:31
- `createShallowNode(initial | fn, deps?, config?)` — only emits when the top-level reference changes (perfect for large objects/maps). Import from `"dagify/shallow"` to avoid reimplementing our `shallowNode` helper. filecitedocs/reference/dagify/node-behavior.md:29node_modules/dagify/docs/shallow-node-vs-deep.md:51
- `createComposite(structure)` — wrap object/array groups into a single node that emits combined values. filecitedocs/reference/dagify/core-api.md:114
- `createGraph()` — bundle multiple nodes and dependency edges when you need explicit graph management. filecitedocs/reference/dagify/core-api.md:83

### Lifecycle helpers
- `.subscribe(handler)` / `.once.subscribe(handler)` — run side effects safely outside computed nodes. filecitedocs/reference/dagify/side-effects.md:29docs/reference/dagify/side-effects.md:41
- `ReactiveNode.batch(fn)` — coalesce multi-step updates so downstream subscribers fire once. filecitedocs/reference/dagify/side-effects.md:50docs/reference/dagify/integration.md:175
- `disableBatching: true` — config flag for zero-loss nodes (command pipes, transport bridges). filecitedocs/reference/dagify/unbatched.md:17

---

## Behaviour & scheduling toggles

- **Shallow vs deep:** Prefer `createShallowNode` (or our `shallowNode` helper) when only identity changes matter; stick with regular nodes for nested mutation tracking. filecitedocs/reference/dagify/node-behavior.md:13-55
- **Activity thresholding:** Enable `enableActivityThresholding`, `activationThreshold`, and `decayInterval` to aggregate noisy events before recompute. Call `.visit()` to accumulate demand. filecitedocs/reference/dagify/activity-thresholding.md:15-105
- **Unbatched nodes:** Set `disableBatching: true` on critical nodes or use helpers (e.g., `createCommandNode`) that already ship unbatched. filecitedocs/reference/dagify/unbatched.md:26-78docs/reference/dagify/node-catalog.md:93-141

---

## Prefab nodes (Node Catalog highlights)

- **BridgeNode** — Mirror processed outputs back to inputs without losing the last computed value. Great for HUD panels that edit derived state. filecitedocs/reference/dagify/node-catalog.md:13-91
- **CommandNode** — Validated, optionally mapped command sink. Perfect for Dagify ↔ Hyperswarm triggers or HUD actions. filecitedocs/reference/dagify/node-catalog.md:93-141
- **FilterNode** (`createFilterNode(predicate, deps)`) — gate emissions without touching upstream logic. filecitedocs/reference/dagify/node-catalog.md:143-159
- **Sink nodes** (`createSinkNode(fn, deps)`) — terminal side-effect adapters (logging, HTTP, Autobase appends). They stay out of dependency graphs. filecitedocs/reference/dagify/node-catalog.md:161-179
- **Trigger nodes** (`trigger`, `triggerFromEvent`) — convert observables or DOM/EventEmitter streams into incrementing counters. Ideal for mesh taps or keyboard/gamepad inputs. filecitedocs/reference/dagify/node-catalog.md:183-217
- **Diff operator** (`diffOperator`) — RxJS operator that turns array streams into `{ new, del, same }`, handy for ledger/peer diffs. filecitedocs/reference/dagify/diff-operator.md:11-73

---

## Encoding, typing, keys

- **Value encodings** (`valueEncoding`) — choose from `raw.*`, numeric codecs, `"json"`, or custom compact-encoding descriptors to persist node values. filecitedocs/reference/dagify/encodings-and-types.md:15-53
- **Type registry** (`types.registerType`, `type: "email"` etc.) — validate node assignments before they commit, independent of encoding. filecitedocs/reference/dagify/encodings-and-types.md:56-99
- **Key generators** — swap 32-byte key factories via `registerKeyGenerator` / `useKeyGeneratorWhile` when building graphs that care about deterministic IDs. filecitedocs/reference/dagify/encodings-and-types.md:144-170

---

## Side-effect discipline

- Keep computed nodes pure; run I/O inside `.subscribe()` handlers, sink nodes, or command nodes. filecitedocs/reference/dagify/side-effects.md:15-74
- Batch coordinated state changes and use `once.subscribe` for single-fire effects (e.g., onboarding flows). filecitedocs/reference/dagify/side-effects.md:41-57
- Combine with RxJS/Svelte using the integration patterns so Dagify remains the “state pool” and other frameworks stay in “stream” mode. filecitedocs/reference/dagify/integration.md:13-199

---

## Repo-specific Lego (FRP helpers)

These helpers sit in `lib/frp/nodes.js` so agents don’t recreate wiring around Dagify primitives:

- `shallowNode(valueOrNode)` — wraps literals or existing nodes, ensuring we only react to reference changes when feeding Dagify graphs. filecitelib/frp/nodes.js:6-8
- `readyResource(node)`, `updateResource(node)`, `readyAndUpdateResource(node)` — async nodes that gate Hyper resources behind `ready()`/`update()` lifecycles. filecitelib/frp/nodes.js:23-46
- `streamResource(node, config)` — exposes `createReadStream` outputs as RxJS observables inside Dagify, already marked `disableBatching`. filecitelib/frp/nodes.js:48-58
- `createMethodSink(targetNode, method)`, `createSequentialSink(deps, handler)` — deterministic sinks for invoking resource methods or enforcing sequential async operations. filecitelib/frp/nodes.js:62-83
- `waitForNodeValue(node, predicate?)` — promise helper that resolves when a node emits a desired value; perfect for testing or boot choreography. filecitelib/frp/nodes.js:86-94

Pair these with the storage and network helpers (`lib/storage/*.js`, `lib/net/swarm.js`) when you need “ready → replicate → stream” flows.

---

## When to reach for what

| Goal | Use these blocks |
|------|-----------------|
| Reduce chatter from telemetry feeds | `createShallowNode`, activity thresholding, `diffOperator` |
| Run deterministic I/O | `createSinkNode`, `.subscribe()`, `createSequentialSink`, `createMethodSink` |
| Wire HUD or mesh controls | `BridgeNode` for edit loops, `CommandNode` for actions, `trigger()` for UI events |
| Persist/replicate state | `valueEncoding` + `types`, our `readyResource`/`streamResource` wrappers feeding Hyper resources |
| Zero-loss transport bridges | Nodes with `disableBatching`, triggers, unbatched command nodes, `ReactiveNode.batch` around mirrored state |

Keep this cheatsheet handy (or embed it in prompts) so higher-level plans can reference the exact Dagify bricks instead of reinventing them.
