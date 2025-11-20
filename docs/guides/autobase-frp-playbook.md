---
title: Autobase FRP Playbook
summary: Step-by-step checklist for orchestrating Autobase resources as functional reactive streams and agent prompts.
tags: [autobase, frp, playbook]
updated: 2025-10-18
audience: both
---

# Autobase FRP Playbook

> **Context Card**
> - **Scope:** Stepwise FRP workflow for Autobase resources and agents.
> - **Primary APIs:** `autobase.open()`, `autobase.update()`, `record.sub()`.
> - **Protocols/Feeds:** Core record feed, writer lifecycle stream, agent output buses.
> - **Dependencies:** Node.js ≥18, `autobase`, `hypercore`, `hyperbee`, `corestore`.
> - **Outputs:** Ordered Autobase views, agent prompts, replication-ready ops.
> - **Next Hop:** [`../reference/autobase-api.md`](../reference/autobase-api.md)

Use this guide when you need an agent-level recipe for building on the Hyper ecosystem without diving into raw code. The goal is to describe *what to do* and *in which order* so an automation agent can translate the steps into concrete API calls.

## 1. Conceptual Map
- **Corestore namespace** → communication channel. All resources tied to the same namespace share writer and replication context.
- **Hypercore log** → stream of immutable entries. Length increments indicate new events to pick up.
- **Autobase instance** → orchestrator that merges multiple writer logs and replays them into a deterministic order.
- **View** → projection maintained by Autobase. Feeds use the raw Hypercore view; records use Hyperbee for key/value state.
- **Async generator** → FRP façade. Every time Autobase processes updates, the generator yields a normalised event payload.

## 2. Common Terminology
- *Writer*: a peer allowed to append to the Autobase log. Managed through `add`, `add-indexer`, `remove` operations.
- *Genesis peer*: the writer whose local core key matches the base key; responsible for one-off initialisation (time, seed, etc.).
- *Sub-bee*: a logical partition inside a Hyperbee view (for example, `genesis`, `services`).
- *Codec*: the compact-encoding schema applied to keys and values; every stream documents which codec is active.

## 3. Lifecycle Checklist
1. **Corestore Setup**
   - Ensure `initCorestore(path)` has been called once per process.
   - Open the namespace matching the resource type (pattern: `__<type>__<name>__`).
2. **Key Material**
   - If joining existing state, decode the provided z32 key string.
   - If bootstrapping, call `BaseBase.create({ type, name })` to mint a new local writer key.
3. **Autobase Construction**
   - Provide the namespace store, boot key (existing base key or `undefined`), and config containing:
     - `open(store)` → returns the view (Hypercore or Hyperbee).
     - `apply(nodes, view, host)` → iterates over ordered nodes and mutates the view.
     - `valueEncoding` → codec aligning with the payloads you intend to append.
4. **Initial Synchronisation**
   - `await base.ready()` to load headers and existing view checkpoints.
   - `await base.update()` once to bring the view current. Record the resulting `view.length` (feeds) or key snapshots (records).
5. **Async Generator Binding**
   - Create a loop that, after each `await base.update({ wait: true })`, inspects new nodes and yields FRP events to subscribers.
   - Maintain cursors per consumer so replays and live tails are handled uniformly.
6. **Writer Governance**
   - When a new peer must emit events, append `{ op: "add", key: <writerKey> }`.
   - Use `{ op: "add-indexer" }` for peers responsible for ordering checkpoints.
   - Remove peers with `{ op: "remove" }`.
7. **Teardown**
   - `await base.close()` when the resource is no longer needed; close views and stop generator emission.

## 4. Encoding Rules of Thumb
- **Feeds**: Wrap the chosen payload codec with `feedBaseEncoding`. Sample tags:
  - `op = "append"` → domain data entry.
  - `op = "add" | "remove"` → writer management event.
- **Records**: Key codec matches URI-safe identifiers (`c.raw.utf8`), value codec aligns with the native data shape (`c.raw.json`, custom binary, etc.). Apply the same codecs when reading (`get`) or scanning (`createScanStream`).
- **Custom Payloads**: Document the schema inside the agent prompt: e.g., "Value codec is `mlpConfigHeaderEncoding`; expect header objects with `{ layerCount, activation }`".

## 5. Event Walkthroughs
### A. Bootstrapping the Core Record
1. Genesis peer appends `{ op: "put", key: "birth", sub: "genesis", value: <UTC timestamp> }`.
2. Autobase replays node → `Record._op` writes to Hyperbee under `genesis/birth`.
3. Async generator yields event: `type = "core.genesis.birth"`, payload carries timestamp and metadata (`version`, `writerId`).
4. Subscribers cache the timestamp; late joiners replay the same sequence to synchronise.

### B. Adding a Service Configuration
1. Authorised writer appends `{ op: "put", key: "catalogs", sub: "services", value: [...keys] }`.
2. Hyperbee view updates the `services/catalogs` sub-tree.
3. Generator emits `type = "core.services.catalogs"`, `change = "updated"`, payload containing the new list and diff metadata.
4. Consumers compare with previous emission and dispatch enable/disable pulses to downstream agents.

### C. Streaming Feed Entries
1. Writer appends `{ op: "append", value: { agentId, status, observedAt } }` to a Feed.
2. Autobase applies → Hypercore view gets a new entry at the tail.
3. Generator (watching `view.length`) yields `type = "feed.agent-status"`, payload equals the decoded value, plus contextual metadata (seq number, writer, timestamp).
4. FRP pipelines filter by `agentId`, sample, or aggregate before acting.

## 6. Patterns for Agents
- **Stateful Consumers**: Maintain local projection by replaying generator history, then respond only to new emissions. Useful for dashboards or long-lived services.
- **Stateless Reactors**: Treat each emission as standalone. Ideal for notifications or triggers where past state is irrelevant.
- **Derived Streams**: Combine multiple generators (e.g., core record + spatial feed) by zipping on timestamp or sequence boundaries. Ensure latency compensation logic is documented.
- **Backpressure & Throttling**: If a consumer lags, note the latest processed sequence and resume from there. Agents should persist cursors externally (file, DB) to survive restarts.

## 7. Operational Guidance
- Always initialise generators after `ready()` but before replication begins to avoid missing early events.
- When running in optimistic mode, verify payloads inside `apply` before acknowledging writers; reject unverifiable entries to keep the log clean.
- Snapshot Hyperbee views periodically if agents need fast catch-up without replaying entire histories.
- Coordinate codec changes: bump a documented version string and provide dual-read logic during migration windows.

## 8. Suggested Agent Prompt Snippets
- *"Subscribe to the Core record"*: "Attach to namespace `__core<record<string, json>>__default__`, replay `genesis` and `services` sub-bees, emit semantic events (`core.genesis.birth`, `core.services.catalogs`)."
- *"Produce new feed entry"*: "Ensure writer key is registered, encode payload with feed codec, append `{ op: 'append', value: ... }`, wait for `update()` confirmation before acknowledging upstream caller."
- *"Monitor writer topology"*: "Listen for `{ op: 'add' | 'remove' }` nodes, update local peer roster, expose derived observable `writer.online: true/false`."

Use this playbook as the narrative layer; pair each step with the corresponding API calls from `../reference/` when translating instructions into code. The combination should enable any automation agent to act confidently inside the Hyper FRP ecosystem.

## Next Steps
- Review the mental model in [Hyper FRP Integration Guide](frp-overview.md) to align terminology across teams.
- Combine these procedures with API specifics under `../reference/` when scripting automations.
- Capture project-specific prompt snippets in `../templates/doc-template.md` for future reuse.
