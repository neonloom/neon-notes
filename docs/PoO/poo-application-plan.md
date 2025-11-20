# Application Plan (PoO → Virtualia)

## 1) Minimal Viable Loop (single node)

**Goal:** prove Ω conservation, quorum-gated detail, and entropy-driven decay.

* **Data**

  * `ECT`: `{id, N, M, L, O∈[0,1], S, R, state, children[]}`
  * `Observer`: `{id, β, λ, w, scope}`
  * `Claim`: `{observer_id, ect_id, epoch, desiredR, w}`

* **Runtime**

  * **EF tick (epoch τ):** collect claims → compute quorum → allocate budget → update (O,S,R) → refine/coarsen → reconcile Ω.
  * **LOD substrate:** infinite octree “on demand”; cell center = nucleus; cell bounds = membrane.
  * **Diagnostics:** entropy heatmap, Ω delta, quorum vectors, refinement tree diff.

* **Acceptance tests**

  * No detail appears without quorum (I2).
  * ΣΩ constant (I1) within numerical tolerance.
  * Unobserved regions coarsen & fade (I3).
  * Membrane-only interactions (I4).
  * Dwell hysteresis respected (I5).

## 2) Networked quorum (decentralized majority)

**Goal:** multiple clients/agents realize the same region via majority.

* **Consensus**

  * Each claim is signed (z32 key).
  * Per-epoch **Claim CRDT** (append-only).
  * **EF reducer** is deterministic; epoch state hashed.
  * Fork choice = majority weight + Ω-continuity preference.

* **Bounded reality**

  * Observer `scope` (spatial + semantic filters).
  * Budget enforcement by β (bandwidth) and global EF tokens (your Gas).

## 3) Rendering & UX (2.5D first)

**Goal:** show PoO working without heavy assets.

* **Top-down 2.5D**

  * Hex/quad tiles mapped to octree cells.
  * Cell border = membrane highlight; center dot = nucleus intensity (O).
  * LOD ring shows R; fade shader maps S.
* **Interaction**

  * Mouse/viewport = Observer; wheel/zoom emits claims.
  * Multi-client: each client = independent observer; watch quorum snap regions into higher R.

## 4) Reactive graph coupling (Dagify)

**Goal:** ECT state is a graph; EF ticks are pure transforms.

* **Nodes**

  * `ect$`: state stream per ECT.
  * `claims$`: merged signed claims.
  * `efStep$`: `(claims$, ect$) -> ect$'` deterministic reducer.
  * `refine$ / coarsen$`: structural ops with Ω ledger hooks.
* **Benefits**

  * Time-travel/debug: replay epochs.
  * Hot-swap lawsets (L) as pure functions.

## 5) Lawsets (plug-ins)

**Start with three:**

* **Matter-L**: elastic membranes, low Π, high τ.
* **Fluid-L**: high Π, shear-tension coupling.
* **Semantic-L**: non-spatial overlays (e.g., faction territories) that still obey PoO (quorum & Ω).

> Design L as `(state, inputs) => deltas`, no globals; allows deterministic EF.

## 6) Observer economics

**Make attention a scarce resource.**

* **β (bandwidth)** = max cells/epoch you can lift.
* **Cost** scales with requested `ΔR` and current S.
* **Tokens**: pay EF to pin regions (kill decay), or stake for prolonged realization.

This gives you an organic “crowd renders reality” economy that matches your Gas/Reputation/Prestige story.

## 7) Persistence & sharding

* **Epoch journal:** append-only, content-addressed, per region (Hyperbee partition per octree prefix).
* **Cross-shard Ω reconciliation:** periodic “Ω receipts” that must net to zero.
* **Snapshots:** compact every N epochs; clients fast-sync to nearest snapshot.

## 8) Dev ergonomics

* **Fixture world:** 32×32 base, R∈[0..4], seeded nuclei at landmarks.
* **Golden tests:** run EF on recorded claim traces → compare state hashes.
* **Chaos mode:** drop claims randomly; verify invariants hold.

## 9) Rollout phases (6–8 week arc with AI assist)

1. **Week 1–2:** Single-node EF + octree + diagnostics (Sections 1 & 4).
2. **Week 3:** Renderer & interaction; observer claims.
3. **Week 4:** Networked claims (CRDT), deterministic EF reducer, epoch hashing.
4. **Week 5:** Lawset plug-in API (Matter/Fluid/Semantic v0).
5. **Week 6:** Sharded persistence + snapshotting; metrics & dashboards.
6. **Optional Weeks 7–8:** Economy hooks (β markets, staking, pinning), narrative semantic layers.

## 10) What not to build (yet)

* No global physics solver; everything goes through membranes/lawsets.
* No eager refinement; always quorum-gated.
* No TS migration; keep to JS + FRP nodes as you prefer.
* No asset-heavy 3D; 2.5D proves the thesis faster.

## 11) Success metrics

* **Perf:** EF tick ≤ 16ms for 10k active cells on single node.
* **Net:** consensus finality ≤ 3 epochs with 5 observers.
* **Stability:** Ω error < 1e-6/epoch; <1% LOD thrash with dwell=3.
* **UX:** perceived “pop-in” only where quorum forms (intended).

