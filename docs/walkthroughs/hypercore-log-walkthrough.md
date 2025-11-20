---
title: Hypercore Log Walkthrough
summary: Operational steps for replaying, tailing, and appending Hypercore logs with FRP-friendly event streams.
tags: [hypercore, walkthrough, frp]
updated: 2025-10-18
audience: both
---

# Hypercore Log Walkthrough

> **Context Card**
> - **Scope:** Replay, tail, and append Hypercore logs with FRP semantics.
> - **Primary APIs:** `new Hypercore()`, `core.ready()`, `core.get()`, `core.append()`, `core.update()`.
> - **Protocols/Feeds:** Hypercore replication streams, Autobase writer inputs.
> - **Dependencies:** Node.js ≥18, `hypercore`, optional `corestore`.
> - **Outputs:** Historical replay iterators, live tail generators, appended blocks.
> - **Next Hop:** [`../reference/hypercore-api.md`](../reference/hypercore-api.md)

This document guides an agent through opening, subscribing to, and mutating a Hypercore in a way that supports FRP-style event streams.

## Goal
Treat a Hypercore as an append-only signal source: replay history, tail new blocks, and publish writes safely.

## Prerequisites
1. Access to a Corestore or Hypercore storage path.
2. Knowledge of the target Hypercore key or name.
3. Agreement on value encoding (raw binary, UTF-8, JSON, etc.).

## Phase 1 – Acquire the Hypercore Handle
1. If working through Corestore, call `const core = store.get({ name, valueEncoding })` or pass `{ key }` for existing cores.
2. Otherwise, instantiate directly: `const core = new Hypercore(storage, key?, opts)`.
3. Await readiness: `await core.ready()` to populate length and keys.

## Phase 2 – Historical Replay
1. Initialise a cursor `seq = 0`.
2. While `seq < core.length`:
   - Retrieve block: `const block = await core.get(seq, { valueEncoding })`.
   - Emit FRP event `{ type: 'hypercore.block', seq, payload: block }`.
   - Increment `seq`.
3. Persist the last processed sequence for restart scenarios.

## Phase 3 – Live Tail via Async Generator
1. Enter loop:
   - `await core.update({ wait: true })` to block until new blocks exist.
   - While `seq < core.length`, fetch and emit events as in Phase 2.
2. Provide this loop as an async generator so consumers can `for await` over `HypercoreEvent` payloads.
3. Include metadata such as `core.key`, `core.discoveryKey`, and writer public keys in each emission for traceability.

## Phase 4 – Appending Data
1. Validate that the local peer has write capability (`core.writable === true`).
2. Prepare payload according to agreed encoding.
3. Call `await core.append(value)` and capture the resulting sequence.
4. Optionally wait for replication acknowledgement by monitoring `core.on('append', ...)` or rerunning `await core.update()`.
5. Emit a local confirmation event `hypercore.appended` with the new sequence number.

## Phase 5 – Integrity & Verification
1. Use `await core.verify(seq, hash)` when accepting data from untrusted writers.
2. For FRP enforcement, emit `hypercore.block.invalid` events when verification fails so subscribers can quarantine state.
3. Consider enabling signature checks if the Hypercore is configured with key pairs.

## Phase 6 – Snapshotting & Resumption
1. Optionally call `const snapshot = await core.snapshot()` for a consistent read view.
2. Use the snapshot to iterate without blocking concurrent appends.
3. Store snapshot metadata if agents need deterministic replay at a later time.

## Phase 7 – Replication Hooks
1. Wire connections via Corestore: `store.replicate(stream)` automatically replicates the Hypercore.
2. If using Hypercore directly, call `core.replicate(stream, { live: true })` on each new connection.
3. Emit FRP events for replication start/stop to monitor peer health.

## Phase 8 – Shutdown Discipline
1. Break generator loops when the Hypercore is no longer required.
2. Call `await core.close()` to release storage handles.
3. Emit `hypercore.closed` so dependent systems stop tailing.

## Prompt Snippets for Agents
- "Replay Hypercore history and tail new blocks from namespace `__feed<json>__default__`."
- "Append JSON payload to Hypercore after verifying writer permissions." 
- "Verify block signatures before emitting downstream events."

Refer to the [Hypercore API Reference](../reference/hypercore-api.md) for detailed method signatures while implementing these steps.

## Next Steps
- Manage key material using the [Hypercore Crypto Walkthrough](hypercore-crypto-walkthrough.md).
- Integrate log events into higher-level views with the [Autobase Feed Walkthrough](autobase-feed-walkthrough.md).
- Capture deployment replication patterns in `../platforms/bare/overview.md`.
