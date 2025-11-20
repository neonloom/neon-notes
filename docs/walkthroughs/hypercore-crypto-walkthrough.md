---
title: Hypercore Crypto Walkthrough
summary: Checklist for generating keys, signing data, and coordinating Autobase writer governance with hypercore-crypto.
tags: [hypercore, crypto, walkthrough]
updated: 2025-10-18
audience: both
---

# Hypercore Crypto Walkthrough

> **Context Card**
> - **Scope:** Generate keys, sign messages, and share metadata using `hypercore-crypto`.
> - **Primary APIs:** `crypto.keyPair()`, `crypto.sign()`, `crypto.verify()`, `crypto.discoveryKey()`.
> - **Protocols/Feeds:** Autobase writer keys, Hypercore discovery keys, replication proofs.
> - **Dependencies:** Node.js ≥18, `hypercore-crypto`.
> - **Outputs:** Key pairs, signatures, verification routines, published metadata.
> - **Next Hop:** [`../reference/hypercore-crypto-api.md`](../reference/hypercore-crypto-api.md)

Use this guide to manage key material and cryptographic operations with `hypercore-crypto` inside the FRP-oriented Hyper ecosystem.

## Goal
Create deterministic key pairs, sign/verify data, and expose cryptographic metadata to agents managing Autobase writers.

## Prerequisites
1. Access to `hypercore-crypto` as `const Krypto = require('hypercore-crypto')`.
2. Understanding of which components need keys (Autobase writers, Hypercores, encryption).
3. Storage for private keys and a secure way to share public keys.

## Phase 1 – Key Generation
1. To create a random key pair: `const { publicKey, secretKey } = Krypto.keyPair()`.
2. For deterministic pairs, derive from seed: `Krypto.keyPair(seedBuffer)`.
3. Store the secret key securely; expose the public key via Hyperbee or configuration feeds.

## Phase 2 – Encoding Keys for Transport
1. Convert keys to z32 for textual transport: `const encoded = z32.encode(publicKey)`.
2. When distributing keys in docs or feeds, include metadata such as purpose (`writer`, `encryption`) and version.

## Phase 3 – Signing & Verification
1. To sign arbitrary payloads: `const signature = Krypto.sign(messageBuffer, secretKey)`.
2. Verify on receipt: `const ok = Krypto.verify(messageBuffer, signature, publicKey)`.
3. Emit FRP events (`crypto.signature.valid` / `crypto.signature.invalid`) so agents can respond accordingly.

## Phase 4 – Random Bytes for Seeds
1. Use `Krypto.randomBytes(length)` to produce entropy for seeds, encryption keys, or identifiers.
2. When registering Autobase seeds (see `Core._registerSeed`), store them in Hyperbee for deterministic retrieval.

## Phase 5 – Integrating with Autobase Writer Governance
1. When adding a new writer, generate or retrieve their public key.
2. Append a control event to the governance feed documenting the key and permissions.
3. Agents should validate signatures on writer announcements before trusting them.

## Phase 6 – Encryption Keys (if enabled)
1. Autbases can be configured with `encryptionKey`. Generate a symmetric key via `randomBytes(32)`.
2. Share the key securely out-of-band or via an encrypted channel.
3. Document encryption state so agents know whether to expect ciphertext.

## Phase 7 – Key Rotation Procedures
1. Create new key pairs, publish public keys alongside effective timestamps.
2. Update Autobase writer list (`remove` old key, `add` new key).
3. Inform all agents through a feed event `crypto.key.rotated` listing old/new identifiers.

## Phase 8 – Auditing & Storage
1. Store secrets in OS keychain or encrypted files; do not commit them to repo.
2. Periodically verify that public keys in Hyperbee match actual writer keys by comparing to Autobase metadata (`base.members`).
3. Emit audit events summarising checks so monitoring agents can alert on discrepancies.

## Prompt Snippets for Agents
- "Generate Hypercore writer key pair and publish public half to `core/services` record." 
- "Sign seed registration message and verify before accepting." 
- "Rotate encryption key and notify peers via governance feed."

Consult the [hypercore-crypto API Reference](../reference/hypercore-crypto-api.md) for lower-level function details.

## Next Steps
- Pair key governance with the [Autobase FRP Playbook](../guides/autobase-frp-playbook.md).
- Surface public key announcements through [Hyperbee State Walkthrough](hyperbee-state-walkthrough.md) patterns.
- Capture rotation policies in `../meta/authoring-guide.md`.
