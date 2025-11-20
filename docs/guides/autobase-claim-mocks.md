---
title: Autobase Claim Mock Strategy
summary: Decision record + implementation sketch for mocking Autobase claims in Virtualia demos.
tags: [virtualia, autobase, testing, fixtures]
updated: 2025-02-14
audience: both
---

# Overview
Phase 0 demos (`plan.md:173-215`) require visible claims flowing through the HUD before real Autobase writers exist. The open question in `todo.md` was whether to fake claims with canned fixtures or generate them on the fly. This note captures the decision, the criteria behind it, and the wiring seams agents should implement next.

## Requirements pulled from plan.md
- **Deterministic replays** drive CI + lane reviews (`plan.md:139-149`). Any mock path must feed the same Autobase/log stack the reducers use.
- **Smokes** during Dash development need quick, parameterizable traffic (mesh tab + HUD) without editing fixtures.
- **Single source of truth**: Deck profiles should swap between “recorded” and “live-ish” mocks using the same HTTP/Autobase plumbing so EF.apply + HUD reducers remain untouched.

## Decision
| Mode | Use it when | Source of truth | Notes |
| --- | --- | --- | --- |
| **Fixture-first (default)** | Tests, `up:replay`, `up:solo` demos where determinism matters. | `fixtures/traces/<scenario>/claims.jsonl` + `metadata.json`. | Guarantees byte-identical Autobase ordering (implemented via `hud-claims` Autobase log) and doubles as golden traces referenced in CI. |
| **Generator overlay (optional)** | `up:demo` or manual operator sessions that need variance (smokes, neighbor floods). | Structured claim templates fed by Dagify/CLI. | Runs through the same append path but is disposable; never used for tests/CI. |

**Bottom line:** ship the fixture replayer as the canonical mock, and mount a generator that *sends claims into the same feed* for ad-hoc smoke traffic. This keeps determinism while still offering interactivity.

## Fixture mode contract
1. **Layout**:  
   ```
   fixtures/
     traces/
       tv1-placement-ok/
         claims.jsonl      # canonical order
         summary.json      # counts, roots, expected receipts
       tv2-overlap-reject/
   ```
2. **Loader** (`scripts/mock-claims.mjs`): Streams `claims.jsonl`, decodes JSON lines, and POSTs each claim to `/claims` (default) so the server’s HTTP surface stays the authority. When `--transport=core`, it falls back to calling `appendClaim` directly for offline seeding. Flags: `--scenario`, `--interval`, `--loops | --loop`, `--server`, `--transport`.
3. **Deck integration**: Profiles call `node scripts/mock-claims.mjs --scenario tv1-placement-ok` *before* booting Dash/RTS so HUD sees data immediately. The script now appends via the Autobase log, so every mock run drives the canonical reducer path.
4. **Tests/CI**: `npm test` seeds a temp Corestore via the same script, then replays the scenario to verify determinism. Use `npm run replay:fixture -- --scenario=tv2-overlap-reject` locally to diff a single trace.

## Generator overlay contract
1. **Templates** live in `lib/state/mocks/claim-templates.js` (pure data). Example templates: `placement_ok`, `overlap_attack`, `bandwidth_squeeze`.
2. **Emitter** (`scripts/mock-claims-live.mjs`): Accepts CLI flags or consumes a JSON sequence (`smokes/*.json`, see `smokes/demo-placement.json`). Generates claim values (new ids/timestamps) via `createClaimFromTemplate(...)` and POSTs to `/claims` (or `--transport=core` for offline). Flags: `--template`, `--count`, `--interval`, `--server`, `--transport`, `--config=<path>`, `--loop/--loops=<n>`.
3. **Dash hooks**: Smokes tab can either POST claim bodies directly to `/claims` (client-side template expansion) or hit the new `/smokes` helper with `{ template, overrides, count }`. The server reuses `createClaimFromTemplate` and `appendClaim`, so all lanes converge on the same feed.
4. **Guardrail**: Generator mode never writes fixture files; it is for local visuals only. Dash should surface a banner (“generator traffic active”) when `VIRTUALIA_CLAIM_MODE=generator`.

## Implementation notes for agents
- Extend `config/local` to carry `claimMock.mode = "fixture" | "generator"` and `claimMock.scenario`. Deck profiles set these explicitly.
- Wrap the two scripts above with Dagify nodes so assistants can reuse them inside prefab pipelines (e.g., `mockClaimsNode({ mode, scenario })` that outputs a stream of appended claim ids).
- Ensure both modes use the same `encodeClaim` / `appendClaim` helpers so HUD reducers + WebSocket broadcasts remain untouched.
- Document fixture creation steps inside `docs/walkthroughs/autobase-feed-walkthrough.md` once the script exists.

## Next steps
1. Add `fixtures/traces/tv2|tv3` directories with canonical JSONL files and metadata.
2. Update Deck profile scripts (`package.json` or future `deck.yaml`) to run the fixture mock before starting the Dash.
3. Teach Dash Smokes tab to toggle generator mode and POST template-triggered claims via `/claims`.
4. Wire tests so CI replays fixture scenarios via the mock script and fails on any diff.

With this decision, we unblock both the “Immediate” backlog item in `todo.md` and the follow-on Deck/Dash wiring outlined in `plan.md:284-289`.
