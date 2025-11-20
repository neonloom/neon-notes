---
title: Hyperbee State Walkthrough
summary: Procedures for projecting Hyperbee key/value stores into FRP-friendly streams and performing deterministic writes.
tags: [hyperbee, walkthrough, frp]
updated: 2025-10-18
audience: both
---

# Hyperbee State Walkthrough

> **Context Card**
> - **Scope:** Project Autobase logs into Hyperbee state and FRP change streams.
> - **Primary APIs:** `new Hyperbee()`, `bee.ready()`, `bee.get()`, `bee.put()`, `bee.createReadStream()`.
> - **Protocols/Feeds:** Hyperbee over Hypercore, sub-bee namespaces, Autobase replay.
> - **Dependencies:** Node.js ≥18, `hyperbee`, `corestore`, `compact-encoding`.
> - **Outputs:** Key-value projections, live iterators, deterministic write batches.
> - **Next Hop:** [`../reference/hyperbee-api.md`](../reference/hyperbee-api.md)

Use this recipe to project Autobase logs into key/value state with Hyperbee and expose FRP-friendly change streams.

## Goal
Open a Hyperbee, replay its dataset into domain state, subscribe to live mutations, and perform writes deterministically.

## Prerequisites
1. An open Hypercore or Corestore namespace backing the Hyperbee.
2. Knowledge of key/value encodings (for example `c.raw.utf8` for keys and `c.raw.json` for values).
3. Optional: list of subtrees (sub-bees) to monitor.

## Phase 1 – Obtain the Hyperbee
1. If using Corestore, create a handle: `const core = store.get({ name, valueEncoding: Node })`.
2. Instantiate Hyperbee: `const bee = new Hyperbee(core, { keyEncoding, valueEncoding })`.
3. Await readiness: `await bee.ready()` to ensure metadata is loaded.

## Phase 2 – Snapshot Historical State
1. Acquire an iterator: `const it = bee.createReadStream({ gt: '', lt: '\uffff' })`.
2. Iterate through all entries, emitting FRP events `hyperbee.entry` with `{ key, value }`.
3. Populate a local cache or behaviour subject to reflect current state.
4. If sub-bees are used, repeat the process with `bee.sub(subKey)` handles.

## Phase 3 – Live Update Generator
1. Build an Autobase or feed generator that emits `{ op, key, value, sub }` updates.
2. For each update, map to Hyperbee mutations:
   - `put` → update cache, emit `hyperbee.change` with `change: 'put'`.
   - `del` → remove from cache, emit `change: 'del'`.
3. Provide this as an async generator so FRP consumers can subscribe to change events rather than raw log nodes.

## Phase 4 – Query Helpers
1. Implement request-response helpers: `await bee.get(key)` for direct lookups, `bee.createRange({ gte, lte })` for slices.
2. Wrap them in stateless commands so agents can request specific projections (e.g., "list services").

## Phase 5 – Writing Data
1. Ensure writer permissions exist (via Autobase writer list or Hypercore writability).
2. Use transactions when available: `const batch = bee.batch()`.
3. Apply `await batch.put(key, value)` or `await batch.del(key)`.
4. `await batch.flush()` to commit.
5. Emit `hyperbee.write` events describing the mutation for auditing.

### Example: Update Service Catalog
1. Prepare payload `services/catalogs` with codec `c.raw.json`:
   ```json
   [
     "core-control",
     "agent-routing",
     "telemetry"
   ]
   ```
2. Start a batch on the sub-bee: `const services = bee.sub('services'); const batch = services.batch()`.
3. `await batch.put('catalogs', payload)`.
4. `await batch.flush()` (or call `await services.put('catalogs', payload)` directly for single writes).
5. Emit/record event `{ type: 'hyperbee.services.catalogs', change: 'put', keys: ['core-control', ...] }`.
6. Downstream agents watching the change stream react by provisioning the listed services.

## Phase 6 – Consistency & Replays
1. Hyperbee rewinds and reapplies updates if Autobase reorders nodes. Ensure your change generator reacts idempotently.
2. When receiving `reorg` notifications (if surfaced), rebuild the cache by replaying the iterator or by applying the new sequence of changes.

## Phase 7 – Sub-bee Management
1. Obtain sub-bee via `const subBee = bee.sub('services')`.
2. Follow Phases 2–6 for each sub-bee independently.
3. Emit events with namespacing, e.g., `hyperbee.services.change`, to help downstream routing.

## Phase 8 – Shutdown
1. Stop iteration loops and dispose of iterators.
2. `await bee.close()` if you created the Hyperbee directly.

## Prompt Snippets for Agents
- "Mirror Hyperbee `genesis` subtree into local cache and emit change events." 
- "Write service config to `services/catalogs` and confirm flush." 
- "Batch delete keys under prefix `entities/obsolete/`."

Consult the [Hyperbee API Reference](../reference/hyperbee-api.md) for detailed API details when converting these steps into code.

## Next Steps
- Map mutation events to application logic with the [Autobase FRP Playbook](../guides/autobase-frp-playbook.md).
- Coordinate storage provisioning via the [Corestore Setup Walkthrough](corestore-setup-walkthrough.md).
- Document domain-specific key layouts in `../templates/doc-template.md`.
