---
title: Compact-Encoding Walkthrough
summary: Step-by-step process for defining, evolving, and testing compact-encoding codecs used across Hyper resources.
tags: [compact-encoding, schema, walkthrough]
updated: 2025-10-18
audience: both
---

# Compact-Encoding Walkthrough

> **Context Card**
> - **Scope:** Define and exercise compact-encoding codecs for Hyper data flows.
> - **Primary APIs:** `c.struct()`, `c.array()`, `c.encode()`, `c.decode()`.
> - **Protocols/Feeds:** Autobase records, Hyperschema namespaces, replication payloads.
> - **Dependencies:** Node.js ≥18, `compact-encoding`, optional `hyperschema`.
> - **Outputs:** Codec definitions, encoded buffers, schema metadata notes.
> - **Next Hop:** [`../reference/compact-encoding-api.md`](../reference/compact-encoding-api.md)

This guide explains how to describe payload schemas with `compact-encoding` so agents can encode/decode Hyper logs consistently.

## Goal
Define codecs, apply them to Autobase/Hypercore operations, and document schema metadata for FRP consumers.

## Prerequisites
1. The `compact-encoding` module imported as `c`.
2. Awareness of the data structures being stored (objects, buffers, arrays).
3. Agreement among participants on codec names and versions.

## Phase 1 – Choose Base Codecs
1. Identify primitive types required: `c.uint8`, `c.uint32`, `c.bool`, `c.string`, `c.buffer`, etc.
2. For JSON-like blobs, prefer `c.json` or `c.raw.json` (preserves Buffers as binary data).
3. For hyper-specific keys, use Z32 strings or raw buffers as appropriate.

## Phase 2 – Compose Struct Codecs
1. Build object codecs with `c.object` or `c.struct`. Example:
   ```js
   const agentStatus = c.object({
     agentId: c.string,
     status: c.string,
     observedAt: c.uint64
   })
   ```
2. For arrays, use `c.array(elementCodec)`.
3. For tagged unions, use `c.union` with discriminators.

## Phase 3 – Document Codec Contracts
1. Store codecs in a shared module (for example, `lib/agents/.../lib/ACTIVATION_TYPES.js`).
2. Record version strings or checksum values so consumers can detect schema drift.
3. Describe expected fields in documentation to help FRP agents validate payloads before acting.

## Phase 4 – Integrate with Storage
1. When initialising Autobase, set `autobaseConfig.valueEncoding = feedBaseEncoding(agentStatus)` (or other codec) so appends are decoded automatically.
2. For Hyperbee, set `valueEncoding` and `keyEncoding` options to the matching codecs.
3. When calling `core.get(seq, { valueEncoding })`, pass the same codec to avoid manual decoding.

## Phase 5 – Encoding at Write Time
1. Validate data against schema (optional but recommended). Agents can check required fields before encoding.
2. Call `const encoded = agentStatus.encode(value)` if manual encoding is needed; otherwise rely on Autobase to encode automatically when `valueEncoding` is set.
3. Append or store encoded payloads in the relevant log.

## Phase 6 – Decoding at Read Time
1. When consuming data, either rely on the storage layer’s automatic decoding or call `agentStatus.decode(buffer)` yourself.
2. Emit FRP events with both raw and decoded forms if downstream consumers require them.
3. Handle schema version mismatches by branching on metadata fields.

## Phase 7 – Schema Evolution
1. Introduce new versions by creating a successor codec (for example `agentStatusV2`).
2. Update documentation to note compatibility details.
3. During migration, write events with version tags so consumers can decode correctly.

## Phase 8 – Testing Codecs
1. Generate fixtures covering typical and edge cases.
2. Round-trip each fixture through `encode` then `decode`, asserting the output matches the input.
3. For agents, expose commands like "validate codec agentStatus" to ensure data integrity before deployment.

## Prompt Snippets for Agents
- "Encode agent status payload using `agentStatus` codec and append to feed." 
- "Decode incoming buffer with `mlpConfigHeaderEncoding` and verify activation types." 
- "Advertise schema version `StatusEvent@1` in stream metadata."

Refer to [compact-encoding API Reference](../reference/compact-encoding-api.md) for comprehensive API descriptions.

## Next Steps
- Capture schema diffs in `../reference/hyperschema-api.md` for version tracking.
- Exercise codecs end-to-end in the [Autobase Feed Walkthrough](autobase-feed-walkthrough.md).
- Keep prompts aligned with `../guides/autobase-frp-playbook.md` when instructing agents.
