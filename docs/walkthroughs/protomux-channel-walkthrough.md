---
title: Protomux Channel Walkthrough
summary: Guide for wiring Protomux channels onto Hyper streams, covering schema setup, messaging, and lifecycle events.
tags: [protomux, walkthrough, networking]
updated: 2025-10-18
audience: both
---

# Protomux Channel Walkthrough

> **Context Card**
> - **Scope:** Establish and orchestrate Protomux channels over Hyper replication streams.
> - **Primary APIs:** `new Protomux()`, `mux.addChannel()`, `channel.addMessage()`, `channel.open()`, `channel.close()`.
> - **Protocols/Feeds:** Protomux framed channels, compact-encoding message schemas, underlying replication stream.
> - **Dependencies:** Node.js ≥18, `protomux`, `compact-encoding`, transport stream (e.g., Hyperswarm).
> - **Outputs:** Channel handlers, encoded messages, lifecycle events tied to FRP bus.
> - **Next Hop:** [`../reference/protomux-api.md`](../reference/protomux-api.md)

Protomux multiplexes structured protocols over a single Hypercore replication stream. This walkthrough explains how to establish channels that complement Autobase and FRP flows.

## Goal
Create Protomux channels, define message types with compact-encoding, and integrate channel activity into the agent event bus.

## Prerequisites
1. Access to a replication stream (e.g., from Hyperswarm connection).
2. `const Protomux = require('protomux')` available.
3. Message codecs defined (use compact-encoding).

## Phase 1 – Attach Protomux to a Stream
1. When Hyperswarm provides a socket, wrap it: `const mux = new Protomux(socket)`.
2. Keep the mux instance scoped to the connection lifecycle.
3. Emit `protomux.attached` event including remote peer metadata.

## Phase 2 – Define Channel Schemas
1. For each logical protocol, prepare a channel descriptor:
   ```js
  const channelOpts = {
     protocol: 'app/agent-control',
     messageEncoding: myCodec,
     onmessage (msg) { ... },
     onopen () { ... },
     onclose () { ... }
   }
   ```
2. Document the protocol string and expected message schema so agents can interoperate.

## Phase 3 – Open Channels
1. `const channel = mux.createChannel(channelOpts)` (or `mux.open(channelOpts)` depending on API version).
2. Await channel readiness (`await channel.ready()` if provided).
3. Emit `protomux.channel.opened` with protocol name.

## Phase 4 – Sending Messages
1. Before sending, ensure channel is open and remote accepted it (`channel.opened === true`).
2. Call `channel.send(message)` (encoding handled automatically).
3. Emit FRP event `protomux.channel.sent` containing payload metadata.

## Phase 5 – Receiving Messages
1. Handle `onmessage` or `channel.on('message')` callbacks.
2. For each message, emit event `protomux.channel.received` with decoded payload and protocol tag.
3. Route the event to appropriate Autobase/Hyperbee writers if the message requests data changes.

## Phase 6 – Flow Control & Ack
1. If the protocol expects acknowledgements, send confirmations through the channel.
2. Track outstanding requests in FRP state so retries can be triggered on timeout.

## Phase 7 – Channel Closure
1. When either side closes the channel, respond to `onclose` by cleaning up state.
2. Emit `protomux.channel.closed` with reason code if available.
3. Consider reopening automatically if the protocol is critical (loop back to Phase 3).

## Phase 8 – Multiplexing Strategy
1. Use separate channels for control, metrics, and bulk data to prevent priority inversion.
2. Document protocol versions and upgrade paths so agents negotiate correctly.

## Phase 9 – Shutdown
1. When the underlying connection ends, destroy the mux (`mux.destroy()`). This closes all channels automatically.
2. Emit `protomux.destroyed` so dependent subsystems know to pause communications.

## Prompt Snippets for Agents
- "Open `app/writer-sync` channel on new Hyperswarm connections and share Autobase writer roster." 
- "Send health ping every 10 seconds through `app/health` channel, expect pong replies." 
- "Close channels gracefully when replication stream ends."

See the [Protomux API Reference](../reference/protomux-api.md) for detailed function reference.

## Next Steps
- Align schema definitions with the [hyperschema API Reference](../reference/hyperschema-api.md).
- Coordinate channel creation with the [Hyperswarm Discovery Walkthrough](hyperswarm-discovery-walkthrough.md).
- Capture messaging prompts in `../templates/doc-template.md` for agent reuse.
