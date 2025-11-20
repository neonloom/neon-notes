# Primacy of Observation (PoO)

## Canonical Physics & Simulation Specification for Virtualia

**Status:** v1.0 (canonical baseline)

**Purpose:** Provide an academically structured, implementation‑oriented definition of PoO for use in the Virtualia engine and allied agents. Focus is on operational semantics (what must the simulation do) rather than metaphysical claims. All terms are formally defined for portability across systems.

---

## 0. Executive Summary

PoO (Primacy of Observation) asserts that **observation is causally prior to existence** in a computational universe. Simulation‑wise: **entities exist to the resolution they are observed**, and **continuity is preserved via nucleus↔membrane containment**. The engine represents reality as a **hierarchy of Existential Containment Topologies (ECTs)** embedded in an **Entropy Foundry (EF)**—the scheduler and ledger for coherence, resolution, and decay. Observation quorums realize states; loss of quorum diffuses them.

Key primitives:

* **Nucleus**: identity anchor (point of maximal impedance / coherence).
* **Membrane**: expressive boundary of interactions around a nucleus.
* **ECT**: (nucleus, membrane, lawset) tuple; unit of containment.
* **EF (Entropy Foundry)**: global process that mints, diffuses, and reconciles entropy; regulates resolution/decay.
* **Observer**: process that allocates resolution and coherence via attention.
* **Quorum**: minimal set of observers required to realize a state. (Default: majority; Minimal viable: 3.)

Operational doctrine:

1. Nothing is simulated “fully” until observed. 2) Everything has a nucleus; all interaction occurs via membranes. 3) Resolution is adaptive and proof‑of‑observation gated. 4) Continuity cannot be destroyed—only redistributed—within EF.

---

## 1. Core Axioms

**A1 (Primacy):** Observation precedes existence; unobserved states are potential only.

**A2 (Containment):** Every entity E is an **ECT**: `ECT = { nucleus N, membrane M, lawset L }`.

**A3 (Continuity):** The simulation preserves a **continuity measure** Ω over time: (\Omega = \sum_i O_i), where (O_i) is observation coherence for ECT_i.

**A4 (Contrast):** Identity emerges from contrast gradients across membranes; without contrast, no realizable state.

**A5 (Entropy):** Entropy S measures **observer distance** (loss of coherence). EF updates S and trades it against resolution R.

**A6 (Quorum):** A state is realized iff its **observation quorum** condition holds in the current epoch.

---

## 2. Ontology & Data Model

### 2.1 Nucleus

* **Role:** Identity and continuity anchor.
* **Fields:** `id`, `position` (in container frame), `signature` (hash/fingerprint), `impedance` (κ), `priority`.
* **Invariants:** Exactly one nucleus per ECT; nuclei form a tree/forest (multi‑scale containment).

### 2.2 Membrane

* **Role:** Expressive boundary for interaction and contrast.
* **Fields:** `extent` (shape/metric), `permeability` (Π), `tension` (τ), `contrast` (Δ), `lawset` ref.
* **Invariants:** Membrane encloses nucleus; may overlap with peers under lawset L.

### 2.3 ECT (Existential Containment Topology)

`ECT = {N, M, L, Ω_local, S, R, state, children[]}`.

* **state:** latent | realized | decaying | merging | splitting.
* **Ω_local:** continuity mass local to ECT.
* **R:** resolution level (octree LOD index).

### 2.4 Observer

* **Role:** Allocates resolution via attention; contributes votes to quorums.
* **Fields:** `observer_id`, `bandwidth` β, `latency` λ, `scope` (FOV/interest region), `weight` w.
* **Behavior:** Produces **observation claims**: `(ECT_id, epoch, weight, resolution_request)`.

### 2.5 Entropy Foundry (EF)

* **Role:** Global scheduler/ledger for Ω, S, R.
* **Artifacts:**

  * **Mint:** issues entropy budgets to regions needing diffusion (decay pressure).
  * **Kiln:** compacts realized states into lower entropy (coherence consolidation).
  * **Ledger:** tracks Ω conservation across split/merge.

### 2.6 Quorum

* **Policies:**

  * **Minimal:** 3 observers with non‑zero independent weights (triangulation rule).
  * **Decentralized:** majority among eligible observers within scope.
  * **Weighted:** Σw_i ≥ θ where θ is class‑dependent threshold.

---

## 3. ECT Classes (Types A–E)

ECT types are defined by **nuclei count** and **dominance topology**.

* **Type A (Mono‑nuclear):** One dominant nucleus; membrane convex. Examples: proton, cell, solitary rock.
* **Type B (Bi‑nuclear coupled):** Two nuclei with stable shared membrane; dipole/binary systems. Examples: H2 molecule, binary star.
* **Type C (Poly‑nuclear clustered):** Multiple nuclei within a shared super‑membrane; dominance gradient. Examples: tissues, cities.
* **Type D (Hierarchical):** Recursive containment (nucleus→membrane chains). Examples: cell→organ→organism; atom→molecule→crystal.
* **Type E (Distributed/Fractal):** No single dominant nucleus; effective nucleus emerges statistically. Examples: sand dunes, clouds, crowds.

Each class defines default lawsets L (permeability, merge/split thresholds, contrast rules).

---

## 4. Continuity, Entropy, Resolution

### 4.1 Measures

* **Observation coherence O ∈ [0,1]**: realized fraction of an ECT.
* **Entropy S = k·ln(1/O)**: observer distance (higher S = less coherent).
* **Resolution R ∈ Z⁺**: octree level; higher is finer.

### 4.2 Dynamics (conceptual PDEs)

Let **O(x,t)** be coherence, **E(x,t)** energetic deviation, **C(x,t)** contrast potential.

1. **Coherence evolution:**
   [ \partial_t O = -\nabla·(E\nabla O) + k_c C - k_s S ]

2. **Entropy production:**
   [ \partial_t S = f(E, -C, 1/O) - g(\text{quorum}) ]

3. **Resolution policy:**
   [ R_{t+1} = R_t + h(\text{quorum}, C, budget) ]

EF enforces **Ω conservation**: (\sum O_i) constant modulo boundary I/O.

---

## 5. Observation & Quorum Semantics

### 5.1 Observation Claim Lifecycle

1. **Emit:** Observer submits `(ECT, epoch, desired R, w)`.
2. **Aggregate:** EF collects claims per ECT and epoch.
3. **Decide:** If quorum policy satisfied → **realize** at min(Σclaims R, budget).
4. **Fund:** EF allocates resolution budget; increases O; reduces S.
5. **Decay:** If quorum fails in subsequent epochs, begin **diffusion** (S↑, R↓, O↓).

### 5.2 Quorum Policies (formal)

* **Triangulation:** `|Voters| ≥ 3` and independent (pairwise λ, β constraints).
* **Majority:** `Σw_support ≥ Σw_total / 2` within scope.
* **Supermajority (critical ECTs):** `Σw_support ≥ θ` with θ ∈ (0.66..0.9).

---

## 6. Hierarchical Nucleus Trees

A nucleus tree is a **bi‑directional lattice**: any scale can be root.

**Examples:**

* Downscale: cell → nucleus → DNA → carbon → nucleus → proton → quarks → sub‑atomic → …
* Upscale: moon → Earth → star → cluster → super‑massive black hole → filament → …

**Rules:**

1. Each node is an ECT; parent membrane encloses child nuclei.
2. Traversal may start at any node; EF maintains Ω conservation across edges.
3. Splits/Merges propagate Ω and S with ledgered transfers.

---

## 7. Space, Time, and Octrees

### 7.1 Spatial Substrate

* **Octree/voxel** substrate with **infinite refinement** (on‑demand).
* Each **cell center** functions as a potential **nucleus site**; cell bounds define the **membrane** at that LOD.
* **Impedance field κ(x):** resistance to change—peaks at nuclei, gradients across membranes.

### 7.2 Temporal Substrate

* Discrete **epochs** τ. EF runs per‑epoch reconciliation (mint, kiln, ledger).
* **Local time drift** per ECT from observer latency λ and bandwidth β.

### 7.3 Resolution Rules

* **Refinement:** If quorum holds and `C≥C_min` → subdivide cell; spawn child ECTs.
* **Coarsening:** If quorum fails or `budget<0` → merge children; consolidate Ω via kiln.
* **Hysteresis:** Prevents rapid flip‑flop via min dwell epochs at each R.

---

## 8. Entropy Foundry (EF) Mechanics

**EF Roles:**

* **Mint:** Issue entropy/diffusion work to under‑observed regions (increase S unless funded by observers).
* **Kiln:** Compact/cohere realized clusters (reduce S, possibly reduce R where unnecessary).
* **Ledger:** Guarantee (\Delta\Omega_{system} = 0) across split/merge/move.

**EF Cycle (per epoch τ):**

1. Ingest observation claims.
2. Compute quorums and allocate budgets.
3. Update O,S,R with PDE steps (discrete).
4. Apply refinement/coarsening.
5. Reconcile Ω and write checkpoints.

---

## 9. Interaction & Contrast

* **Contrast C** derives from field differentials across membranes (matter/energy, semantic tags, forces).
* **Interaction** occurs only at membranes; nuclei exchange via membrane‑mediated lawsets.
* **Lawset L** can be per‑class (A–E) or per‑instance (custom physics modules).

---

## 10. Algorithms (Reference Pseudocode)

### 10.1 Realization Pipeline

```
for each epoch τ:
  claims = collectClaims(τ)
  for each ECT in activeSet:
    q = quorum(ECT, claims)
    if q.satisfied:
      budget = EF.allocate(ECT, q.requestedR)
      (O,S,R) = stepFields(ECT, budget, q)
      if refineRule(ECT, C, budget): subdivide(ECT)
    else:
      (O,S,R) = diffuse(ECT)
      if coarsenRule(ECT): mergeChildren(ECT)
  EF.reconcileOmega()
```

### 10.2 Split/Merge

* **Split:** distribute Ω to children by impedance‑weighted partition; inherit S with penalties for uncovered surfaces.
* **Merge:** sum Ω; compute S via convex combination; collapse children states into parent membrane.

### 10.3 Observer Scheduling

* Prioritize ECTs by `score = w·C – S_penalty – distance(observer, ECT)`.
* Cap per‑observer β; spillover to next epoch.

---

## 11. Implementation Profiles

### 11.1 Minimal (Single‑Node Sandbox)

* Fixed octree depth; local EF; single observer with β budget.
* Validate Ω conservation and quorum toggling.

### 11.2 Networked (Decentralized Majority)

* Observers across clients; CRDT/ledger for claims; majority quorum.
* EF as deterministic reducer; epoch checkpoints hashed (z32 keys).

### 11.3 High‑Fidelity (Adaptive)

* Infinite LOD; hierarchical lawsets; bio/geo modules; async observers.
* EF sharded by space partitions; cross‑shard Ω reconciliation.

---

## 12. Testable Invariants & Diagnostics

* **I1 (Continuity):** ΣΩ stays constant modulo I/O.
* **I2 (No Phantom Detail):** R may never increase without quorum.
* **I3 (Entropy Direction):** In absence of quorum, S must weakly increase over epochs.
* **I4 (Membrane Causality):** All interactions occur at membranes (no nucleus teleport).
* **I5 (Hysteresis):** Refinement/coarsening obey dwell constraints; no oscillatory thrash.

**Diagnostics:** entropy heatmap; quorum vector fields; Ω delta per epoch; refinement tree diff.

---

## 13. Worked Examples

### 13.1 Voxel World Realization

* Initial coarse cube (R=0) latent.
* Three observers request zoom on region A → quorum satisfied.
* EF refines A to R=3; nuclei seeded at cell centers where C≥C_min.
* Unobserved region B decays (S↑), coarsens back to R=0.

### 13.2 Bio‑stack (Type D Hierarchy)

Cell (ECT_D) contains nucleus (N_cell); membrane = cell wall. Observation focuses on nucleus → DNA sub‑ECTs realized; carbon lattice sub‑ECTs spawn; resolution gated by bandwidth and C (biochemical gradients).

### 13.3 Astro‑stack (Type C→D)

Moon→Earth→Star→SMBH chain: each step is parent membrane to child nucleus; orbital regions realized when observer quorum tracks them; far regions merge into statistical membranes (Type E) when quorum drops.

---

## 14. Parameterization (Defaults)

* **Quorum minimal:** 3 observers (triangulation).
* **Decentralized quorum:** majority of weights within scope.
* **C_min:** 0.2 (normalized); **k_c:** 0.7; **S_penalty:** 0.1/epoch; **dwell:** 3 epochs.
* **Impedance κ:** piecewise constant within cell; spike at nucleus sites.

(Values are placeholders; tune per module.)

---

## 15. Interface Contracts (Engine APIs)

* `claimObservation(observer_id, ect_id, epoch, desiredR, weight)`
* `efStep(epoch)` → updates (O,S,R), returns diffs.
* `getECTState(ect_id)` → {O,S,R,state,M,N}
* `spawnECT(parent_id, class, lawset)` → ect_id
* `splitECT(ect_id)` / `mergeECT(ect_id)`
* `setLawset(ect_id, L)`
* `subscribeDiagnostics(kind)` → streams

---

## 16. Lawsets (Sketch)

* **Matter-L:** elastic membranes, conserved mass Ω_m, low Π, high τ.
* **Fluid-L:** high Π, dynamic τ from velocity shear; nuclei ephemeral (Type E tendency).
* **Bio-L:** hierarchical spawn rules; nucleus persistence; contrast from gradients (chem/EM).
* **Semantic-L:** non‑spatial membranes (tags/relations); used for narrative overlays.

---

## 17. Security & Consensus

* Claims signed with per‑observer keys; quorum computed from verified claims.
* Epoch state hashed; EF ledger forms append‑only chain; forks resolved by majority weight + Ω continuity preference.

---

## 18. Comparative Notes (Physics Contrast)

* PoO treats **existence as observation‑budgeted**; entropy = observer distance; gravity/forces reinterpreted as membrane tensions under contrast.
* Conventional engines step everything uniformly; PoO gates cost by attention, enabling **infinite apparent resolution** without infinite compute.

---

## 19. Roadmap & Validation

* **Phase 1:** Minimal sandbox (Sections 11.1, 12 invariants).
* **Phase 2:** Networked quorum; EF ledger; infinite LOD.
* **Phase 3:** Lawset library (matter, fluid, bio, semantic); module interop.
* **Phase 4:** Narrative integration; observer personas; persistence.

**Metrics:** Ω conservation error < 1e‑6/epoch; quorum SLA ≥ 99%; mean dwell stability ≥ 95%.

---

## 20. Glossary

* **Impedance (κ):** resistance to state change near nuclei.
* **Permeability (Π):** ease of crossing a membrane.
* **Tension (τ):** membrane stabilization pressure.
* **Contrast (C):** differential that produces identity.
* **Continuity (Ω):** preserved observation coherence mass.

---

## 21. References (contextual inspirations)

Wheeler (It from Bit), Bohm (implicate order), Prigogine (dissipative structures), Rovelli (relational QM), Penrose (orchestrated objective reduction), Tegmark (consciousness as state of matter). Replace with formal citations as needed.

---

## 22. Appendices

### A. Formal Quorum Schemas

* Triangulation, Majority, Weighted thresholds.

### B. EF Pseudo‑PDE Discretization

* Stable explicit scheme; CFL‑like constraint for τ‑weighted membranes.

### C. Example Parameter Packs

* Bio‑pack, Astro‑pack, Narrative‑pack.

---

**End of v1.0**
