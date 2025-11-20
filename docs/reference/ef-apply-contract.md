---
title: EF.apply() Contract
summary: Deterministic reducer interface shared by HUD, Dash, Autobase replay, and proof tooling.
tags: [ef, determinism, receipts, dag]
updated: 2025-10-21
audience: both
---

# EF.apply() Contract

This note pins down the minimum interface surfaced in `plan.md §2` so engineers + agents can replace the stub state endpoint without renegotiating expectations. Treat this as the canonical handshake between deterministic reducers, HUD/Dash consumers, Autobase replayers, and the DPT proof layer.

---

## 0) Deterministic boundary

- **Pure function**: `EF.apply()` may not perform I/O, read clocks, or call random sources. Given identical inputs, every machine must emit identical outputs byte-for-byte.
- **Canonical ordering**: Callers sort input claims by `(epoch, ts, claim_id)` before invoking `EF.apply()`. The reducer should assume that order and never mutate or resort it.
- **Reproducible context**: All tunables (city id, tick, feature flags, budgets) arrive through the `context` object so replay environments and online peers can pass the same values.

---

## 1) Function signature

```ts
type ApplyArgs = {
  stateSnapshot: StateTree              // last committed state (or a projection)
  claims: CanonicalClaim[]              // already sorted, immutable
  context: {
    prev_state_root: string             // hex string, 0x-prefixed
    prev_receipts_root: string          // hex string, 0x-prefixed
    tick: number
    city: string
    entropy: {
      budget: number
      decay_rate: number
    }
    flags: Record<string, boolean>      // reducers feature switches
  }
}

type ApplyResult = {
  nextState: StateTree
  next_state_root: string
  receipts: Receipt[]
  receipts_root: string
  artifacts: {
    hudSignals?: HudArtifacts
    economySignals?: EconomyArtifacts
    meshSignals?: MeshArtifacts
  }
  transcript: DeterministicTranscript
}

async function EF_apply({ stateSnapshot, claims, context }: ApplyArgs): Promise<ApplyResult>
```

> **Note:** the stub HTTP endpoint can keep serving `nextState`, `receipts`, and `artifacts` directly while Autobase/DPT consumers rely on the root commitments and transcript hashes.

---

## 2) Output expectations

1. **`nextState`** — Fully materialized view (tree/map) that callers can diff or publish. For V1 this powers `/state`; longer-term it seeds Merkleized storage.
2. **`next_state_root`** — Cryptographic hash (e.g., Blake3/Merkle root) covering `nextState`. Must be reproducible from the output, and peers should recompute it immediately after calling `EF.apply()`.
3. **`receipts`** — One entry per processed claim. Include status (`accepted`, `rejected`, etc.), gas burn/mint, entropy deltas, attribution metadata, and any references to resulting artifacts.
4. **`receipts_root`** — Hash commitment over the ordered `receipts` array; same encoding used by Autobase replay + ledger indexing.
5. **`artifacts`** — Derived signals for HUD/Dash (entropy charts, quorum lamps, neighbor overlays). Anything the UI needs must be computed here so that even headless peers can verify UI feeds.
6. **`transcript`** — Deterministic proof bundle containing the step-by-step reducer trace (e.g., rolling hash over `(claim_id, prev_root, next_root)`, or a compact log used by DPT). Consumers should be able to re-run the transcript alone to detect drift vs. a golden trace.

---

## 3) Required invariants (throw on violation)

| Check | Why it matters |
| --- | --- |
| `prev_state_root`/`prev_receipts_root` recompute from `stateSnapshot` + stored receipts | Guarantees we’re extending the expected chain. |
| `receipts.length === claims.length` | Keeps ledger, payouts, and DPT aligned. |
| Conservation (entropy budget, token sums, attribution splits) | Spots reducers that leak value. |
| Collision/overlap constraints obeyed | Keeps placement logic honest before HUD visualizes placements. |
| Transcript hash matches `compactEncoding(transcript)` | DPT + Autobase replays can diff a single digest to detect divergence. |

Violations should surface via thrown errors so upstream callers can light the “determinism lamp” in the Deck.

---

## 4) Integration notes

- **Stub compatibility**: `lib/state/stub.js` should mirror the structure above (even if fields are zeroed) so HUD/Dash work doesn’t need refactors later.
- **Claims mocking**: Local demos can use JSONL traces with `(claims[], prev_roots, expectations)` to feed `EF.apply()`; the replay harness simply compares `next_state_root`/`receipts_root` + transcript hashes.
- **Dagify nodes**: Reducer outputs flow into Dagify graphs (HUD panels, Mesh tab). When adding new nodes, keep inputs/outputs typed like these contracts so agents can wire graphs without extra glue.

---

## 5) Next steps

1. Align the HTTP `/state` stub with this schema.
2. Wire Autobase prefab nodes to emit canonical claim batches + compare `EF.apply()` outputs to golden traces.
3. Extend prefab Dagify nodes (Swarm/Protomux/Autobase) with reducer and HUD adapters so assistants can assemble flows with zero custom config.
