---
title: Autobase Feed Walkthrough
summary: Procedural steps for joining, reading, and writing Autobase-backed feeds with async generators.
tags: [autobase, feed, walkthrough]
updated: 2025-10-18
audience: both
---

# Autobase Feed Walkthrough (Async Generator Style)

> **Context Card**
> - **Scope:** Step-by-step Autobase feed join/read/write procedure for agents.
> - **Primary APIs:** `corestore(namespace)`, `new Autobase()`, `autobase.open()`, `autobase.update()`, `view.sub()`.
> - **Protocols/Feeds:** Autobase writer cores, merged feed view, FRP generator loop.
> - **Dependencies:** Node.js ≥18, `corestore`, `autobase`, `hyperbee`, matching `compact-encoding`.
> - **Outputs:** Async generator consumption, appended records, updated Autobase view state.
> - **Next Hop:** [`../reference/autobase-api.md`](../reference/autobase-api.md)

The goal of this walkthrough is to spell out, in procedural language, how an automation agent should join a Hyper feed, project it into FRP-style events, and append new data. Each numbered step can map directly to API calls described in `../reference/`.

## Prerequisites
1. Confirm the process has access to the on-disk data dir (default `./store.db`).
2. Load the compact-encoding codec that matches the feed payloads (JSON, binary, custom).
3. Obtain either the base key (for joining an existing feed) or ensure you can create a genesis writer key.

## Phase 1 – Initialise Storage & Keys
1. Call `initCorestore(path)` once (see `lib/store/index.js`). Persist the returned instance for later reuse.
2. Determine the namespace string: `const ns = "__feed<binary>__default__"` for the default binary feed, or follow the naming convention `<type>` + `<name>`.
3. If supplied with a z32-encoded base key, decode it using `z32.decode`. Otherwise, create a local writer key by invoking `Feed.create({ name, type })`.

## Phase 2 – Construct Autobase + View
1. Open the namespace: `const store = openCorestore(ns)`.
2. Build the Autobase config object:
   - `open(store)` → return `store.get({ name: "<viewName>", valueEncoding: feedBaseEncoding(...) })`.
   - `apply(nodes, view, host)` → iterate `for await (const node of nodes)` and append values whose `op === "append"`; delegate writer-management ops to `host`.
   - `valueEncoding` → wrap the payload codec with `feedBaseEncoding`.
3. Instantiate the feed: `const feed = new Feed(baseKey, { name }, configOverrides, viewOptions)`.
4. Await readiness: `await feed.ready()` (BaseBase inherits from `ReadyResource`).
5. Trigger one full replay: `await feed.update()`; capture `const head = feed.view.length` as the last processed sequence.

## Phase 3 – Expose an Async Generator
1. Create a loop that stores the last seen sequence `seq = head`.
2. Repeat forever:
   1. `await feed.update({ wait: true })` to block until new nodes arrive.
   2. While `seq < feed.view.length`:
      - Fetch `const entry = await feed.view.get(seq, { valueEncoding: feedPayloadCodec })`.
      - Decode `{ op, value }`.
      - If `op === "append"`, `yield { type: "feed.event", seq, writer: entry.from.key, payload: value }`.
      - If `op` is a writer-management command, emit a separate control event (`feed.writer.add/remove`).
      - Increment `seq++`.
3. Consumers `for await` over this generator to integrate with FRP operators (map, filter, sample).

## Phase 4 – Append New Entries
1. Ensure the current process is an authorised writer. If not, append a control message `{ op: "add", key: <writerKey> }` from an authorised peer and wait until it takes effect.
2. Encode the payload with the agreed codec.
3. Call `await feed.append(encodedValue)` which internally appends `{ op: "append", value }`.
4. Optionally block on `await feed.update()` to confirm the write is visible in the local view before acknowledging success upstream.

## Phase 5 – Recovery & Catch-Up
1. Persist the last processed sequence number for each consumer (e.g., `seq.json`).
2. On restart, reinitialise phases 1–2.
3. Resume the generator at the stored `seq`: skip historical entries until `seq >= storedSeq`, then continue tailing.
4. If snapshots exist (Hyperbee case), load the snapshot first and then only stream entries beyond the checkpoint.

## Phase 6 – Replication Hooks
1. Create a Hyperswarm instance (`new Hyperswarm()`).
2. On `connection`, call `replicate(stream)` so corestore replicates all Hypercores.
3. Join the discovery key: `swarm.join(feed.base.discoveryKey)`.
4. Keep the async generator running; new remote writes will surface automatically through `feed.update({ wait: true })`.

## Phase 7 – Shutdown Discipline
1. Stop consumer loops (break the async generator) once no more events are needed.
2. `await feed.close()` to close the Autobase and view handles cleanly.
3. Optionally `await corestore.close()` if the whole process ends.

## Prompt Template for Agents
- "Initialise feed subscriber": follow Phases 1–3, expose generator events labelled `feed.event`.
- "Publish feed entry": ensure Phase 1–2 complete, run Phase 4 steps with supplied payload.
- "Synchronise after downtime": execute Phase 5 recipe, using stored `seq` to avoid duplicate processing.

Use this walkthrough alongside [Autobase FRP Playbook](../guides/autobase-frp-playbook.md) (strategy) and [Hyper FRP Integration Guide](../guides/frp-overview.md) (mental model) for a full picture.

## Next Steps
- Dive into API specifics with the [Autobase API Reference](../reference/autobase-api.md).
- Validate replication flow with the [Hyperswarm Discovery Walkthrough](hyperswarm-discovery-walkthrough.md).
- Capture automation prompts in `../templates/doc-template.md` for reuse.
