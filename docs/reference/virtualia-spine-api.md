---
title: Virtualia Spine API & Plan
summary: Agent-facing specification for the Virtualia Spine, including pure transforms, adapters, FRP stream graphs, and rollout milestones.
tags: [virtualia, reference, api, planning]
updated: 2025-10-21
audience: both
---

# Virtualia Spine API & Plan

> **Context Card**
> - **Scope:** Virtualia core services (Operator, Forge, Vault, Hyperquill, AI Mesh, Ledger, Shell) and their shared protocols.
> - **Primary APIs:** Pure transform library, REST surfaces, WebSocket topics, Hyperbee ledger, capability issuance.
> - **Execution Model:** FRP-first with deterministic pure functions; adapters isolate all IO.
> - **Dependencies:** Hyperbee, Hyperswarm, HTTP/WS adapters, moderation AI pipelines, optional L2 anchoring.
> - **Outputs:** Caps, proofs, attestations, epochs, ledger anchors, diegetic shell feeds.
> - **Next Hop:** [`../guides/frp-overview.md`](../guides/frp-overview.md)

Comprehensive, implementation-agnostic directions for building the Virtualia Spine. Use this as the single spec across build, ops, content, and moderation agents.

## Glossary
- **Operator** — Identity and proof-of-work service that issues capabilities (Caps).
- **Forge** — Contribution service converting Proofs into Attestations and epoch payouts.
- **Vault** — CRED bank. Handles CRED purchases and CRED⇄GAS swaps (off-chain first).
- **Hyperquill** — Story/content surface requesting publish Caps.
- **AI Mesh** — Moderation, anomaly, and indexing agents (pure transforms plus adapters).
- **Ledger** — Hyperbee append-only store of attestations, balances, epochs.
- **Anchor** — Daily Merkle root posted to L2 (optional early on).
- **REP** — Non-transferable reputation token.
- **GAS** — Work token emitted per epoch.
- **CRED** — Purchase token.

## Core Invariants
- **Determinism:** Same inputs yield identical work units and payouts.
- **Idempotency:** Replaying any message never double-applies effects.
- **Bounded authority:** Caps are short-TTL, scoped, and subject-bound.
- **Auditability:** Every balance traces to Attestations → Proofs → Caps.
- **Reputation:** REP is derivative and soulbound; slashing lowers influence only.
- **Anchors:** Epoch `n+1` cannot anchor before `n`.

## Canonical Data Shapes

All IDs use z32 strings. Timestamps are ISO strings. Numbers are integers unless noted.

```js
/** Identity that accretes via time, telemetry, and vouches */
const Identity = {
  id: "z32", createdAt: "ts", ageDays: 0,
  rep: 0,
  score: 0, // time + telemetry + vouch composite
  claims: [/* optional proofs-of-personhood, PGP, socials */]
}

/** Scarce vouch; bonded & slashable; requires k-of-n witnesses */
const Vouch = {
  from: "z32", to: "z32",
  weight: 1, bondGAS: 0, ttlMs: 0, ts: "ts",
  witnesses: [{ by: "z32", sig: "hex" }],
  sig: "hex"
}

/** Short-lived capability grant (non-transferable) */
const Cap = {
  issuer: "z32", subject: "z32",
  scope: "publish|storage.read|storage.write|bandwidth|compute",
  limits: { rps: 0, bytes: 0, reads: 0, writes: 0 },
  until: "ts", nonce: "z32", sig: "hex"
}

/** Work evidence (deterministic fields only) */
const Proof = {
  kind: "storage|bandwidth|compute|creative|mod",
  taskId: "z32", workerId: "z32",
  inputsHash: "z32", outputsHash: null, // set for compute/creative
  metrics: {/* RTT, bytes, SLA, votes */},
  caps: [Cap], ts: "ts"
}

/** Scored & witnessed proof */
const Attestation = {
  proofHash: "z32",
  WU: 0,
  witnesses: [{ by: "z32", sig: "hex" }],
  workerSig: "hex",
  ts: "ts"
}

/** Periodic settlement */
const Epoch = {
  id: "z32", start: "ts", end: "ts",
  totalWU: 0,
  payouts: [{ id: "z32", GAS: 0 }],
  root: "z32"
}

/** Anchor record (optional) */
const Anchor = {
  epochId: "z32", merkleRoot: "z32",
  l2TxRef: null
}
```

## Pure Transforms

Implement as ESM functions with zero side effects so agents can unit-/property-test them.

```js
// identity
scoreIdentity(identity, telemetry, vouches) -> { rep, score }
issueCap(identity, policy, req) -> Cap | Error

// work
scoreProof(proof) -> { WU, proofHash }
witness(attestationDraft, witnesses[]) -> Attestation
applyAttestation(state, attestation) -> state'  // updates balances + logs

// epochs
settleEpoch(state, epochWindow) -> { epoch, state' }  // mints GAS pro-rata by WU
hashEpoch(epoch, attestations[]) -> merkleRoot

// reputation
deriveRep(identity, outcomes) -> rep
slashRep(identity, reason, delta) -> rep'
```

Policy configuration stays deterministic and version-controlled:

```js
const POLICY = {
  vouch: { maxPerMonth: 3, minBondGAS: 10, kOfN: [2, 5], ttlDays: 30 },
  caps:  { ttlSec: 300, maxRps: 10, maxBytes: 5e6 },
  epoch: { durationMin: 1440, emissionGAS: 100000 },
  rep:   { basePerAgeDay: 0.01, maxBoost: 0.15, slashFactor: 1.0 }
}
```

## Adapters

Adapters isolate side effects and stay replaceable without touching the pure transforms:
- `/adapters/http/*` — REST ingress/egress.
- `/adapters/ws/*` — Realtime streams.
- `/adapters/swarm/*` — Hyperswarm replication.
- `/adapters/ledger/*` — Hyperbee read/write.
- `/adapters/wallet/*` — External wallet or account-abstracted paymaster.
- `/adapters/anchor-evm/*` — Optional L2 anchoring.
- `/adapters/agents/*` — AI Mesh model calls.

## FRP Stream Graphs

### Operator (Identity, PoW, Vouch, Caps)

```
pow$ → claims$ → vouch$ → score$
score$ → capIssuer$
```

Events: `pow.submitted`, `pow.accepted`, `vouch.submitted`, `vouch.accepted|slashed`, `cap.issued`, `cap.denied`.

### Forge (Work → Attest → Ledger)

```
tasks$ → useCap$ → run$ → proofs$
proofs$ → validate$ → scoreWU$ → witness$ → attest$
attest$ → ledger$
```

Events: `task.assigned`, `proof.accepted|rejected`, `attest.appended`.

### Vault (CRED Buys & Swaps)

```
wallet$ → intent$ → quote$ → confirm$ → settle$ → receipt$
```

Events: `vault.quote`, `vault.settle`, `vault.receipt`.

### Hyperquill (Story Publish)

```
edit$ → publishIntent$ → requestCap$ → commit$
```

Events: `publish.request`, `publish.accepted|denied`.

### AI Mesh (Moderation & Anomaly)

```
reports$ → heuristics$ → classify$ → decision$ → action$
attestations$ → anomaly$ → flags$
```

Events: `mod.shadow|quarantine|allow`, `anomaly.flag`.

## REST API (Minimal v1)

Prefix routes with `/api/v1`.

### Operator
- `POST /identity/pow` → `{ nonce, diff, ts, device }` → `{ powToken, expires }`
- `GET /identity/:id` → `Identity`
- `POST /identity/vouch` → `Vouch` → `{ status }`
- `POST /cap/issue` → `{ scope, limits }` → `Cap`

### Forge
- `POST /task/submit-proof` → `Proof` → `{ status, proofHash }`
- `POST /attest` → `{ proofHash, witnesses[] }` → `Attestation`
- `GET /balance/:id` → `{ GAS, REP, history: [Attestation...] }`

### Epochs & Ledger
- `GET /epoch/current` → `Epoch`
- `POST /epoch/settle` (internal/admin) → `Epoch`
- `GET /attest/:hash` → `Attestation`
- `GET /audit/:id` → `{ balance, path: [...] }`

### Vault (Simulation First)
- `POST /vault/quote` → `{ pair: "CRED/GAS", amount }` → `{ price, fee }`
- `POST /vault/settle` → `{ pair, amount, walletSig }` → `{ txId | receipt }`

### Moderation
- `POST /mod/report` → `{ subjectId, reason, refs[] }` → `{ reportId }`
- `GET /mod/decision/:reportId` → `{ state, action, rationale }`

All responses include `requestId` and `sig` when relevant. Return `429` on rate limit, `403` for invalid/expired Cap, `409` on idempotency collisions.

## WebSocket Topics

- `ws://…/streams/operator/:id` → `identity.update`, `cap.issued`, `vouch.result`
- `ws://…/streams/forge/:id` → `task.assigned`, `proof.accepted`, `attest.appended`
- `ws://…/streams/epoch` → `epoch.tick`, `epoch.settled`, `anchor.posted`
- `ws://…/streams/mod` → `mod.action`, `anomaly.flag`

Payloads reuse the canonical shapes.

## Policies
- **Vouches:** Max three per month per `from`; `bondGAS ≥ POLICY.vouch.minBondGAS`; enforce k-of-n witness diversity; slashing burns bond and reduces REP.
- **Caps:** TTL ≤5 minutes; enforce limits per request; bind to subject and device key; replay-protected.
- **Epochs:** Fixed `emissionGAS`; distribute pro-rata by WU; REP boosts capped at `POLICY.rep.maxBoost`.
- **Moderation:** Start with `allow|shadow|quarantine`; actions reversible with logged rationale.
- **Privacy:** Collect coarse telemetry only; publish “What we log” doc; claims optional.

## Feature Flags
- `SAFE_MODE` — Static pages, read-only ledger, no Caps issued.
- `POW_ON` — Require fresh PoW before first Cap.
- `P2P_ON` — Enable Hyperswarm reads (race CDN).
- `AGENTS_ON` — Turn on AI Mesh moderation/anomaly flows.
- `ANCHOR_ON` — Post Merkle root to L2 daily.
- `VAULT_SIM_ON` — Off-chain CRED/GAS quotes and receipts.

## Metrics

**North stars:**
- A1 first Cap issued; A2 first unlock consumed.
- D1/D7 retention; completion percentage for one 3-beat loop.
- Median PoW time and abandon rate.
- Moderation median decision time; false positive/negative samples.
- P2P hit rate; ledger replay parity (target 100%).
- Anchor success rate (when enabled).

**Per-app:**
- Operator — Caps issued/denied, vouch success/slash, score distribution.
- Forge — Proof acceptance, WU per kind, witness diversity.
- Vault — Quotes, settlements, average fee, error rate.
- AI Mesh — Action histogram, appeal success.

## Milestones
- **M0 Kernel:** Shapes frozen; property tests pass; transforms implemented.
- **M1 Site + Hyperquill:** Tease→Reveal→Payoff loop; `publish` Cap flow; SEO/OG; SAFE_MODE fallback.
- **M2 AI Mesh v0:** Moderation and anomaly handling; diegetic daily briefings.
- **M3 Forge + Ledger:** Proof → Attestation → Epoch settle; replay tool; audit viewer.
- **M4 Spine:** Caps for `publish|storage.*|bandwidth`; bonded vouch; REP derivation; treasury/emissions constants locked.
- **M5 2.5D Shell:** Grid console (map/timeline, faction heat, operator profiles, live unlocks).

Acceptance bars:
- M1→M2: ≥60% complete one 3-beat loop; zero hard gates.
- M2→M3: Moderation median ≤3m; zero false mints under tests.
- M3→M4: Replay parity 100%; zero double mints.
- M4→M5: Cap TTL/limits enforced; REP slashing proven.

## 2.5D Shell Feeds

```js
worldNodes$ = [{ id, kind: "arc|site|event", pos: { x, y }, state: "locked|open|cleared" }]
factionHeat$ = [{ faction: "Nexus|Archaio|Eidolon", intensity: 0..1, region: "id" }]
operator$ = { id, ageDays, rep, score }
unlocks$ = [{ nodeId, ts, artifactPtr }] // media/page pointers
```

Rendering stays reactive only—no writes from the shell.

## Example Flows

### Publish a Story Page (Hyperquill)
1. `POST /cap/issue { scope: "publish", limits: { writes: 1 } }` → `Cap`
2. `POST /task/submit-proof` with `kind: "storage"`, `caps: [Cap]` → `{ proofHash }`
3. `POST /attest { proofHash, witnesses }` → `Attestation`
4. Ledger updates; shell receives `unlocks$`.

### Provide Bandwidth (Forge)
1. Assign task; peer delivers chunk; requester emits signed receipt.
2. Forge posts `Proof`; receives `proofHash`.
3. Witnesses co-sign; `Attestation` appended.
4. On epoch settle, provider balance gains GAS.

### Vouch & Cap Issuance (Operator)
1. `POST /identity/vouch` with bonded GAS and k-of-n witnesses.
2. Identity `score` rises; subsequent `issueCap` grants larger limits within TTL.

## Testing Protocols
- **Property tests:** Determinism/idempotency for `scoreProof`, `applyAttestation`, `settleEpoch`.
- **Golden datasets:** Fixed inputs → expected epoch payouts (check into repo).
- **Fuzzing:** Random Cap TTL/limits, permuted event orderings; assert invariants.
- **Replay:** Rebuild balances from genesis; assert parity with live balances.
- **Abuse simulations:** Cap replay attempts, colluding vouches, duplicated `outputsHash`, witness monoculture.

## Security & Abuse Guardrails
- Short-TTL Caps with per-cap rate limits and replay protection.
- Vouch anti-sybil: bonds, per-month limits, witness diversity.
- Creative/compute plagiarism defenses: similarity checks, watermarking, golden tasks.
- Moderation is reversible with logged rationale and appeal lane.
- Disaster plan: periodic Hyperbee snapshots, dual anchors, `SAFE_MODE`.

## Rollout Order
1. **Operator v0** — PoW, vouch, caps.
2. **Forge v0** — Storage/bandwidth proofs → attest.
3. **AI Mesh v0** — Moderation and anomaly pipelines.
4. **Ledger + Replay + Audit Viewer.**
5. **Anchoring v0** — Optional.
6. **Vault v0 (sim).**
7. **2.5D Shell** — Visualize spine.

## Agent Work Orders
- **Lib-Core Agent:** Implement pure transforms (§Pure Transforms) with tests and `POLICY` constants.
- **Operator API Agent:** Build REST (§REST API) and WS topics (§WebSocket Topics); wire FRP graph (§FRP Stream Graphs).
- **Forge Agent:** Implement Proof validators, WU scoring, witness logic, attestation append; expose submit/attest/balance endpoints.
- **Ledger/Replay Agent:** Define Hyperbee schema, replay tool, audit path endpoint.
- **AI Mesh Agent:** Heuristic → LLM classify → action pipeline; anomaly flags on attestations.
- **Vault Agent (Sim):** Quote/settle receipts off-chain; prep adapter boundary for AA/paymaster.
- **Shell Agent:** Subscribe to feeds (§2.5D Shell Feeds); render grid/timeline; zero writes.

## Diegetic UX Notes
- In-world voice only (Cipher briefings, Shinobi logs).
- “No black-ICE” policy doubles as Code of Conduct.
- Unlock artifacts deliver wallpaper/QR glyph, OST sting, short clip.
- Error states remain diegetic: “Grid interference,” “Cap expired,” “Safe Mode engaged.”

## Next Steps
- Freeze these shapes alongside `docs/reference/poo-simulation-runtime-api.md` before handing tasks to build agents.
- Align policy constants with actual telemetry once pilot data arrives; log deltas in `docs/meta/retrieval-playbook.md`.
- Maintain the inbox checklist (`inbox/README.md`) for future Virtualia updates before landing them here.
