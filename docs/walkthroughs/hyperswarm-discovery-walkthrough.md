---
title: Hyperswarm Discovery Walkthrough
summary: Steps for joining topics, replicating resources, and surfacing connection lifecycle events with Hyperswarm.
tags: [hyperswarm, networking, walkthrough]
updated: 2025-10-18
audience: both
---

# Hyperswarm Discovery Walkthrough

> **Context Card**
> - **Scope:** Join Hyperswarm topics, accept connections, and stream lifecycle events.
> - **Primary APIs:** `new Hyperswarm()`, `swarm.join()`, `swarm.on('connection')`, `swarm.flush()`, `swarm.replicate()`.
> - **Protocols/Feeds:** HyperDHT topics (32-byte buffers), Noise-encrypted duplex streams.
> - **Dependencies:** Node.js ≥18, `hyperswarm`, optional `hyperdht`, `corestore`.
> - **Outputs:** Connection events, replication streams, peer lifecycle notifications.
> - **Next Hop:** [`../reference/hyperswarm-api.md`](../reference/hyperswarm-api.md)

Hyperswarm handles peer discovery and connection management. This guide explains how to wire it into the Hyper FRP toolkit.

## Goal
Join topics, accept incoming connections, replicate Corestores/Hypercores, and expose connection lifecycle events to agents.

## Prerequisites
1. `const Hyperswarm = require('hyperswarm')` available.
2. Topics (discovery keys) to join.
3. Callback or async generator infrastructure to broadcast connection events.

## Phase 1 – Create the Swarm
1. Instantiate: `const swarm = new Hyperswarm(opts?)`.
2. Optionally configure bootstrap servers or DHT options depending on deployment.

## Phase 2 – Join Topics
1. For each discovery key, call `const discovery = swarm.join(key, { lookup: true, announce: true })`.
2. `await discovery.flushed()` to ensure the topic is announced.
3. Emit FRP event `hyperswarm.topic.joined` with the topic identifier.

## Phase 3 – Handle Connections
1. `swarm.on('connection', (socket, info) => { ... })`.
2. Inside handler:
   - Pipe socket to Corestore replication: `store.replicate(socket)`.
   - Emit `hyperswarm.peer.connected` with remote public key, client/server flag, and timestamp.
3. Monitor socket events (`'close'`, `'error'`) and broadcast corresponding FRP notifications.

## Phase 4 – Outgoing Connections
1. If you know peer keys ahead of time, call `await swarm.connect(key)` to initiate direct connections.
2. Apply the same replication wiring and event emissions as in Phase 3.

## Phase 5 – Connection Metadata
1. Access `info.peer` for remote key pairs, `info.client` to know who dialed.
2. Include this metadata in events so agents can reason about trust and roles.
3. Track connection counts per topic for observability.

## Phase 6 – Rate Limiting & Backoff
1. Hyperswarm handles reconnection automatically. Agents can subscribe to `hyperswarm.peer.disconnected` events to trigger fallback logic.
2. If too many connections spawn, throttle by pausing new replications or leaving topics selectively.

## Phase 7 – Leaving Topics & Shutdown
1. To stop announcing a topic: `swarm.leave(key)`.
2. Before process exit, iterate joined topics, call `await discovery.drain()` if required.
3. `await swarm.destroy()` to close sockets and timers.
4. Emit `hyperswarm.destroyed` so dependents know network communication ended.

## Phase 8 – Security Considerations
1. Validate peer keys before trusting them; cross-check against Hypercore/Autobase writer lists.
2. Consider running Hyperswarm in an isolated network environment for internal deployments.

## Prompt Snippets for Agents
- "Join core discovery key and replicate all namespaces via Corestore." 
- "Monitor connections, emit heartbeats if no peers remain for 30s." 
- "Gracefully leave topics after migration completes."

Detailed API surface is summarised in the [hyperswarm API Reference](../reference/hyperswarm-api.md).

## Next Steps
- Tune bootstrap policies with the [HyperDHT API Reference](../reference/hyperdht-api.md).
- Emit downstream events into the [Autobase Feed Walkthrough](autobase-feed-walkthrough.md) pipelines.
- Capture deployment topologies in `../platforms/bare/overview.md`.
