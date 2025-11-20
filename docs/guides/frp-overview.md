---
title: Hyper FRP Integration Guide
summary: Reframe Hyper primitives as functional reactive signals so Autobase workflows stay deterministic across peers.
tags: [frp, autobase, hypercore]
updated: 2025-10-18
audience: both
---

# Hyper FRP Integration Guide

> **Context Card**
> - **Scope:** FRP patterns applied to Hyper primitives (Corestore, Autobase, Hyperbee).
> - **Primary APIs:** `corestore.namespace()`, `autobase.update()`, `hyperbee.sub()`.
> - **Protocols/Feeds:** Autobase merge feeds, Hyperbee records, writer lifecycle streams.
> - **Dependencies:** Node.js ≥18, `autobase`, `hypercore`, `hyperbee`, `compact-encoding`.
> - **Outputs:** Deterministic async generators, derived behaviours, replication-ready state flow.
> - **Next Hop:** [`../guides/autobase-frp-playbook.md`](../guides/autobase-frp-playbook.md)

This guide reframes Hyper primitives as async-generator-friendly signals so the approach works across projects that build on the ecosystem. Pair it with the API notes in `../reference/` when you need exact method signatures.

## Mental Model
- Corestore namespaces are your stream channels. Initialising one namespace (for example `__feed<json>__default__`) establishes a distinct signal path shared by all peers.
- Each Autobase instance consumes one or more Hypercores and emits a totally ordered event stream once `update()` completes. Treat it as a cold stream that becomes hot after `ready()` and the first `update()`.
- Views turn event streams into behaviours. A feed keeps the raw Hypercore log as the behaviour; a record swaps the view for Hyperbee so the behaviour represents “latest value per key.”
- Writer-management messages (`op: add`, `add-indexer`, `remove`) are higher-order events. They alter who can emit into the stream and should be surfaced alongside domain payloads.

## Building Blocks Recap
- **Corestore** (`../reference/corestore-api.md`): single process-wide factory. Once opened, replication via Hyperswarm pushes every namespace’s Hypercores to remote peers without extra stream wiring.
- **Hypercore** (`../reference/hypercore-api.md`): append-only log the async generators will iterate over. Length increments signal new emissions.
- **Autobase** (`../reference/autobase-api.md`): merges all writer Hypercores, invoking `open(store)` once per view and replaying ordered nodes through `apply(nodes, view, host)`.
- **Hyperbee** (`../reference/hyperbee-api.md`): ordered KV projection layered on the Autobase log. Sub-bees (`view.sub('services')`) behave like derived behaviours.
- **Compact-encoding** (`../reference/compact-encoding-api.md`): declarative wire formats used at every tier. Default is JSON, but Feed/Record override with feed-specific codecs as needed.

## End-to-End Event Flow
1. A resource appends an operation. Example: the Core record appends `{ op: "put", key: "seed", sub: "genesis" }`.
2. Autobase receives the node, linearises it against other writers, and hands it to the registered `apply` hook.
3. The hook updates the view. For a Record, Hyperbee writes the new key/value while the async generator notes that "seed" changed.
4. Subscribers that are iterating the generator observe the new emission, project it into domain events, and forward them to agents or UI.
5. Replication propagates the append, causing remote peers to replay steps 2–4 in deterministic order.

## Async Generator Patterns
- **Log Subscription**: Start iteration only after `resource.ready()` and one `resource.update()`. Subsequent `update()` calls become the cadence that drives the generator forward.
- **Backfill Handling**: When a subscriber first attaches, iterate historical entries (oldest to newest) to populate state, then switch to tailing mode by checking the current length at each `update()`.
- **Writer Lifecycle Stream**: Maintain a secondary generator focused on nodes whose `op` is `add`, `add-indexer`, or `remove`. Use it to broadcast replication and access-control changes.
- **Derived Signals**: For Hyperbee-backed views, pair the generator with occasional snapshot reads (`await record.get(key)`) to recover from missed events or to initialise caches.

## Encoding Playbook
- **Base Defaults**: `BaseBase` ensures `autobaseConfig.valueEncoding` defaults to `c.json`. Override when you need binary payloads.
- **Feed Entries**: `Feed` wraps whichever encoding you pass in `feedBaseEncoding`, tagging every node with `{ op, value }`. Consumers decode `op` first to decide whether the entry is data (`append`) or infrastructure (`add`).
- **Record Keys/Values**: `RecordStringJson` enforces `c.raw.utf8` for keys and `c.raw.json` for values so ordering is stable across peers. When you fork this class, keep the pairings aligned with the data you store.
- **Custom Codecs**: Place bespoke encodings in `lib/agents/.../lib`. Reference them via `valueEncoding` arguments when fetching (`core.get(idx, { valueEncoding: customCodec })`) or when initialising new namespaces.

## Practical Scenarios
- **Agent State Bus**: Subscribe to the feed that carries agent outputs. Each emission becomes an FRP event; operators filter by `agentId`, batch over a window, then append summarised state into another feed for dashboards.
- **Configuration Watcher**: Listen to the `services` sub-bee of the Core record. On `put`, push a configuration update event to interested agents; on `del`, emit a teardown signal.
- **Topology Awareness**: Project the writer lifecycle stream into a live map of connected peers. Downstream, use it to throttle speculative writes when quorum drops.
- **Recovery Routine**: When an agent restarts, replay the full generator history, rebuild in-memory caches, then continue tailing the stream. Because compact-encoding ensures deterministic decoding, the rebuilt state matches peers byte-for-byte.

## Implementation Notes
- Always configure the Corestore before constructing resources; otherwise namespaces point to separate stores and no longer behave as shared signals.
- Generators should gracefully handle sparse log indices, mirroring `coreCreateScanStream` (skip holes, continue). Terminating on decode errors will break peer convergence.
- Document which encoding a stream uses and bump the version when it changes. Consumers can then branch logic based on version metadata rather than guessing.
- For deep API details (encryption, optimistic appends, wakeup protocols), refer to the dependency notes in `../reference/` while keeping this FRP view as the conceptual map.

Use this guide to align new contributors: think in streams and behaviours, wire async generators around Autobase updates, and lean on compact-encoding to keep everything deterministic across peers.

## Next Steps
- Pair this mental model with the lifecycle checklists in [Autobase FRP Playbook](autobase-frp-playbook.md).
- Cross-reference API specifics in the relevant files under `../reference/`.
- Capture project-specific FRP extensions in the template at `../templates/doc-template.md`.
