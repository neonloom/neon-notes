---
title: Hyperdrive Sync Walkthrough
summary: Procedures for mounting, mirroring, and replicating Hyperdrive file trees with event-driven updates.
tags: [hyperdrive, walkthrough, filesystem]
updated: 2025-10-18
audience: both
---

# Hyperdrive Sync Walkthrough

> **Context Card**
> - **Scope:** Mount, mirror, and replicate Hyperdrive file trees with FRP event wiring.
> - **Primary APIs:** `new Hyperdrive()`, `drive.mount()`, `drive.mirror()`, `drive.readdir()`, `drive.watch()`.
> - **Protocols/Feeds:** Hyperdrive backing Hypercores, mirror streams, replication channels.
> - **Dependencies:** Node.js ≥18, `hyperdrive`, optional `corestore`, `hyperswarm`.
> - **Outputs:** Local cache, live change events, mirrored directories, published edits.
> - **Next Hop:** [`../reference/hyperdrive-api.md`](../reference/hyperdrive-api.md)

Hyperdrive offers a filesystem abstraction on top of Hypercore. This walkthrough explains how an agent can mount, mirror, and stream file updates in tandem with the FRP patterns used throughout a Hyper project.

## Goal
Mount a Hyperdrive, synchronise its contents locally, stream file change events, and publish edits back to peers.

## Prerequisites
1. Access to a Corestore (recommended) or storage path for Hyperdrive metadata.
2. Knowledge of the target Hyperdrive key (for joining) or intent to create a new one.
3. Agreement on how Hyperdrive events map into FRP signals (e.g., `hyperdrive.file.changed`).

## Phase 1 – Initialise Hyperdrive
1. Require Hyperdrive: `const Hyperdrive = require('hyperdrive')`.
2. Construct the drive: `const drive = new Hyperdrive(store, key?, opts)` where `store` is a Corestore namespace or storage path.
3. Await `await drive.ready()` to ensure metadata availability.

## Phase 2 – Directory Mapping
1. Decide which virtual directory (path prefix) you care about, e.g., `/agents`.
2. List existing files: `await drive.readdir(prefix)` or use `drive.createReadStream(prefix)`.
3. Emit initial FRP events `hyperdrive.file.initial` for every file discovered.

## Phase 3 – File Content Retrieval
1. Fetch file bodies using `await drive.get(path)` (returns a buffer) or streaming APIs.
2. Decode using agreed codecs (JSON, binary) before forwarding to consumers.
3. Cache file hashes if you need change detection beyond metadata.

## Phase 4 – Watching for Changes
1. Hyperdrive files change when new blocks hit the underlying Hypercore. Use the drive’s `watch` API (`drive.watch(path, handler)`) if available.
2. Alternatively, subscribe to the internal Hypercore (e.g., `drive.core`) with an async generator and map block offsets to file paths via headers.
3. Emit events `hyperdrive.file.changed`, `hyperdrive.file.deleted`, etc., including metadata such as version and writer key.

## Phase 5 – Writing Updates
1. Ensure the drive is writable (`drive.writable === true`).
2. Write files with `await drive.put(path, bufferOrString)`.
3. Remove files via `await drive.del(path)`.
4. Optionally wrap operations in transactions if available.
5. Emit `hyperdrive.write` events to record the change.

## Phase 6 – Mirroring to Local FS
1. For agents needing local copies, iterate all files and write them to disk.
2. Subscribe to change events (Phase 4) to keep the local mirror current.
3. Use checksums to avoid redundant writes.

## Phase 7 – Replication
1. Share discovery key via Hyperswarm (`swarm.join(drive.discoveryKey)`).
2. On connection, call `drive.replicate(stream)` or rely on Corestore replication if the drive uses a namespace from Corestore.
3. Emit `hyperdrive.peer.connected`/`disconnected` events for monitoring.

## Phase 8 – Shutdown
1. Stop watchers, cancel async generators.
2. `await drive.close()` to release resources.
3. Notify subscribers with `hyperdrive.closed`.

## Prompt Snippets for Agents
- "Mount Hyperdrive at namespace `__docs__specs__`, emit change events for `/models`."
- "Upload JSON config to `/services/core.json` and confirm replication." 
- "Mirror `/snapshots` directory to local disk and keep it updated."

Refer to the [Hyperdrive API Reference](../reference/hyperdrive-api.md) for exact constructor signatures and options.

## Next Steps
- Prototype local workflows with the [localdrive API Reference](../reference/localdrive-api.md).
- Coordinate distribution with `../platforms/pear/sharing-pear-application.md`.
- Document FRP mappings in `../guides/frp-overview.md`.
