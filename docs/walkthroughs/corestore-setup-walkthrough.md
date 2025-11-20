---
title: Corestore Setup Walkthrough
summary: Deterministic procedure for provisioning Corestore namespaces, replication, and FRP hooks.
tags: [corestore, walkthrough]
updated: 2025-10-18
audience: both
---

# Corestore Setup Walkthrough

> **Context Card**
> - **Scope:** Provision a Corestore instance, namespaces, and replication hooks.
> - **Primary APIs:** `corestore(path)`, `store.namespace()`, `store.get()`, `store.replicate()`.
> - **Protocols/Feeds:** Hypercore discovery keys, Autobase writer feeds, replication streams.
> - **Dependencies:** Node.js ≥18, `corestore`, `hypercore`.
> - **Outputs:** Namespaced store handles, replication duplex, FRP-ready helper functions.
> - **Next Hop:** [`../reference/corestore-api.md`](../reference/corestore-api.md)

Use this playbook to stand up a Corestore session that other Hyper components (Autobase, Hypercore, Hyperbee) can rely on. Steps are written so automation agents can follow them deterministically.

## Goal
Create a namespaced Corestore, prepare it for replication, and expose helper hooks for FRP-aware consumers.

## Prerequisites
1. Determine the filesystem path for storage (`./store.db` by default).
2. Ensure the process has read/write access to that directory.
3. Decide on a namespace string (for example `__core<record<string, json>>__default__`).
4. Optional: have a primary key ready if deterministic key derivation is required.

## Phase 1 – Instantiate Corestore
1. Import or require Corestore (`const Corestore = require('corestore')`).
2. If no global store exists, create one: `const root = new Corestore(path)`. Persist this instance somewhere accessible.
3. Await readiness if necessary (`await root.ready?.()` depending on API version).

## Phase 2 – Namespace & Sessions
1. Obtain a namespace: `const nsStore = root.namespace(namespaceString)`.
2. For scoped lifecycles (temporary tasks), create a session: `const session = nsStore.session()`.
3. Document that closing the session (`await session.close()`) will close every Hypercore opened through it.

## Phase 3 – Opening Cores
1. For each domain resource, derive a core handle via `session.get({ name: '<resource-name>', valueEncoding: ... })`.
2. If joining an existing core, pass `{ key: bufferOrString }` instead of `name`.
3. Log or emit an event describing the mapping `resource-name -> discoveryKey` so other agents can subscribe.

## Phase 4 – Replication Wiring
1. Instantiate Hyperswarm (`const swarm = new Hyperswarm()`), or reuse an existing swarm.
2. On `connection`, invoke `root.replicate(socket)` to replicate every active core.
3. When a new core is opened, Corestore automatically adds it to the replication stream; optionally emit a `corestore.core.opened` FRP event so subscribers learn about it.

## Phase 5 – Monitoring & FRP Hooks
1. Register a watcher: `root.watch(core => emit('corestore.core.opened', { discoveryKey: core.discoveryKey }))`.
2. For FRP consumers, expose an async generator that yields whenever `watch` fires, translating the core metadata into semantic events.
3. If using `root.list(namespace)`, iterate the resulting stream to discover historical cores and emit bootstrapping events.

## Phase 6 – Key Management
1. When deterministic writer keys are required, call `await root.createKeyPair(name)` and distribute the public key through the appropriate feed.
2. Store or emit these keys so agents can request writer access later.

## Phase 7 – Suspend/Resume & Shutdown
1. If the process needs to pause disk IO, call `await root.suspend()` and later `await root.resume()`.
2. Before exiting, close any sessions, then run `await root.close()` to flush resources.
3. Emit a `corestore.closed` event so dependent agents know streams are ending.

## Prompt Snippets for Agents
- *Initialise storage*: "Create Corestore at `./store.db`, namespace `__feed<json>__default__`, expose replication connection handler." 
- *Discover cores*: "List namespace `__entity__grid__`, emit discovery keys to subscribers." 
- *Rotate namespace*: "Create new session for temporary import, close when import completes to release resources."

Pair these steps with the [Corestore API Reference](../reference/corestore-api.md) when translating instructions into concrete calls.

## Next Steps
- Wire replication peers with the [Hyperswarm Discovery Walkthrough](hyperswarm-discovery-walkthrough.md).
- Connect Autobase feeds using the [Autobase Feed Walkthrough](autobase-feed-walkthrough.md).
- Document storage policies in `../meta/authoring-guide.md`.
