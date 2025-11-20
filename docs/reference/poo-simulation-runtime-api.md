---
title: PoO Simulation Runtime API
summary: Concept reference for the Preservation of Origin (PoO) field simulator, observer-driven resolution policies, and VR streaming surfaces.
tags: [poo, reference, api, vr]
updated: 2025-10-21
audience: both
---

# PoO Simulation Runtime API

> **Context Card**
> - **Scope:** Preservation of Origin (PoO) continuous field runtime, VR bindings, and agent-facing control/query surfaces.
> - **Primary APIs:** `init.create_world`, `sim.step`, `query.*`, `control.*`, `export.*`.
> - **Execution Model:** FRP/DAG memoization over EVFields with observer-directed LOD and deterministic envelopes.
> - **Dependencies:** Observer telemetry, GPU-capable meshing pipeline, VR bindings (OpenXR/WebXR/custom).
> - **Outputs:** Mesh chunks, frame stats, event streams, export handles.
> - **Next Hop:** [`../guides/frp-overview.md`](../guides/frp-overview.md)

This reference captures the conceptual API for simulating Preservation of Origin (PoO) worlds: continuous scalar fields where Emergent Contrast Tangles (ECTs) form, resolve, and render with observer-driven detail budgets.

## Core Principles
- **Field-first:** The world is a continuous EVField over ℝ³×t. Geometry emerges from iso-surfaces; nothing is pre-modeled.
- **Membrane priority:** ECTs expose membranes (iso-surfaces) for rendering and physics; internal detail resolves only when required.
- **Observer-directed reality:** Cameras/probes allocate compute via `ResolutionPolicy` budgets; level of detail increases near gaze and registered interests.
- **Deterministic envelopes:** All public APIs reply with `{ ok, err, data }` boring envelopes. IDs are opaque z32 strings.
- **FRP/DAG execution:** Sampling, detection, meshing, and streaming operate as memoized DAG nodes; recomputation occurs only on input change.
- **Composable I/O:** VR bindings, audio/haptics, and export surfaces are peers without special treatment.

## Domain Model
- **EV (float):** Field value at a point.
- **EVField:** Procedural scalar field composed of layered noises, flows, or reactions (Perlin/Simplex/Worley/Curl/R-D/Custom).
- **Nucleus:** Attractor influencing local spiral geometry; dominance and radius bias ECT typing (A–E).
- **ECT (A–E):** Axis-aligned spiral object with membrane iso, pitch, bounds, and nuclei set.
- **Membrane:** Iso-surface around an ECT; statistics include area, curvature, torsion bands.
- **Observer:** Camera/agent/probe with pose, FOV, interest tags, and resolution policy.
- **VRBinding:** Runtime adapter (OpenXR/WebXR/etc.).
- **MeshChunk:** Streamable GPU-ready triangular patch keyed by `(ect_id, lod)`.

## Canonical Data Shapes

IDs use z32 strings (`^[a-z2-7]{16,64}$`). JSON payloads follow these canonical shapes:

- **Vector & Pose Types**

```json
{ "x": 0, "y": 0, "z": 0 }
```

```json
{ "p": { "x": 0, "y": 1.6, "z": 0 }, "q": { "x": 0, "y": 0, "z": 0, "w": 1 } }
```

- **Field & Entity Specs**

```json
{
  "seed": 1337,
  "layers": [
    { "kind": "simplex", "weight": 0.7, "scale": 2.5, "offset": { "x": 0, "y": 0, "z": 0 } },
    { "kind": "curl", "weight": 0.3, "scale": 1.1, "params": { "octaves": 3 } }
  ],
  "thresholds": { "membrane_iso": 0.0, "ect_detect": 0.42 }
}
```

```json
{ "id": "ect123", "position": { "x": 0, "y": 0, "z": 0 }, "influence_radius": 4, "dominance": 0.7 }
```

```json
{
  "id": "ect123",
  "nuclei": [{ "id": "n1", "position": { "x": 0, "y": 0, "z": 0 }, "influence_radius": 4, "dominance": 0.7 }],
  "type": "A",
  "axis": "x",
  "pitch": 0.42,
  "membrane_iso": 0,
  "bounds": { "min": { "x": -4, "y": 0, "z": -3 }, "max": { "x": 4, "y": 3, "z": 3 } }
}
```

- **Observer & Runtime**

```json
{
  "id": "o9e3k1w4m2a7",
  "kind": "camera",
  "pose": { "p": { "x": 0, "y": 1.6, "z": 0 }, "q": { "x": 0, "y": 0, "z": 0, "w": 1 } },
  "fov_deg": 95,
  "interest_tags": ["membrane", "high_torsion"],
  "policy": {
    "base_lod": 1,
    "gaze_boost": 2,
    "distance_curve": "inverse",
    "max_budget_ms": 6,
    "hysteresis_ms": 150
  }
}
```

```json
{
  "ect_id": "e5x2a",
  "lod": 3,
  "triangles": 240000,
  "bounds": { "min": { "x": -4, "y": 0, "z": -3 }, "max": { "x": 4, "y": 3, "z": 3 } },
  "gpu_handle": "buf:0xA9F1"
}
```

- **Envelope Contract**

```json
{ "ok": true, "err": null, "data": { } }
```

On error:

```json
{
  "ok": false,
  "err": { "code": "E.BUDGET", "message": "Frame budget exceeded", "details": {} },
  "data": null
}
```

## Runtime Loop

1. **Input ingest:** Collect poses, controller intents, and `dt`.
2. **Region of interest:** Derive ROI volumes from observer cones and proximity.
3. **Field sampling:** Compute EV/∇EV/torsion within ROI tiles.
4. **ECT lifecycle:** Detect, update topology, retire vanished tangles.
5. **Resolution selection:** Choose LOD per policy and budget ceilings.
6. **Meshing/streaming:** Run marching/dual contouring into `MeshChunk[]`.
7. **Physics callbacks (optional):** Provide membrane collisions and proximity hooks.
8. **VR submit:** Feed layers, haptics, audio grains to runtime bindings.
9. **Emit telemetry:** Return `FrameStats` plus ordered `Event[]`.

### Key Events
- `ect.detected|updated|vanished`
- `resolution.changed` with reason `gaze|distance|budget`
- `performance.budget_exceeded`
- `observer.entered|exited` (AABB overlap)
- `haptics.pulse`, `audio.emit`

## Public API Surface

### World & Observers
- `init.create_world(field: FieldSpec, observers: Observer[], vr?: VRBinding)` → `{ world_id, ects }`
- `world.add_observer(world_id, observer)`
- `world.update_observer(world_id, observer_id, patch)`
- `world.remove_observer(world_id, observer_id)`
- `world.set_field(world_id, field_patch)`
- `world.configure_vr(world_id, vr_binding)`

### Simulation Loop
- `sim.step(world_id, dt, inputs)` → `{ frame_stats, visible_ects, mesh_chunks, events }`
- `sim.pause(world_id)`
- `sim.resume(world_id)`
- `sim.shutdown(world_id)`

### Query Interfaces
- `query.field(world_id, positions[])` → `EVSample[]`
- `query.ect(world_id, ect_id)` → `ECTSpec`
- `query.ect_bounds(world_id, ect_id)` → `AABB`
- `query.events(world_id, since_ts)` → `Event[]`

### Control Surfaces
- `control.set_resolution(world_id, observer_id, policy_patch)`
- `control.focus(world_id, observer_id, ect_id)`
- `control.tag_interest(world_id, observer_id, tags[])`
- `control.haptics(world_id, observer_id, pattern)` (enveloped, may degrade if limits hit)

### Export Surfaces
- `export.mesh(world_id, format, params)` → `MeshChunkStream`
- `export.snapshot(world_id, region)` → `uri`
- `export.frame(world_id, observer_id, format)` → `uri`

## Observers & Resolution

`ResolutionPolicy` orchestrates compute budgets:

```json
{
  "base_lod": 1,
  "gaze_boost": 2,
  "distance_curve": "inverse",
  "max_budget_ms": 6,
  "hysteresis_ms": 150
}
```

- **Budget ceiling:** Max CPU/GPU time per frame per observer.
- **Gaze boost:** Temporary LOD uplift when interest varies.
- **Distance curve:** Map from observer distance to LOD (`linear|quadratic|inverse|custom`).
- **Hysteresis:** Delay before downshifting LOD to avoid flicker.

## Implementation Boundaries
- **Sampling nodes:** Deterministic EV/torsion sampling with memoized tiles.
- **Detection nodes:** Spiral detection keyed by nuclei influence and thresholds.
- **Meshing nodes:** Marching or dual contouring with deterministic triangle ordering.
- **Streaming nodes:** GPU handle allocator, envelope-wrapped streaming responses.
- **VR adapters:** Input ingestion, frame submission, audio/haptics connectors.
- **Storage (optional):** Snapshot `FieldSpec`, observer set, RNG state for resumable sessions.

## Error Codes
- `E.BAD_ID` — unknown `world_id|observer_id|ect_id`
- `E.VALIDATION` — schema mismatch
- `E.BUDGET` — frame compute budget exceeded
- `E.VR_BINDING` — device missing/unsupported
- `E.EXPORT` — writer failure or format unavailable
- `E.TIMEOUT` — step exceeded guard time

```json
{
  "ok": false,
  "err": {
    "code": "E.VALIDATION",
    "message": "membrane_iso missing",
    "details": { "path": "thresholds.membrane_iso" }
  },
  "data": null
}
```

## Security & Determinism
- **Opaque IDs:** Never encode counters or timestamps inside IDs.
- **Sandboxed exports:** `uri` references sandbox handles, not arbitrary filesystem paths.
- **Deterministic seeds:** Identical `FieldSpec.seed` plus step sequence yields reproducible high-level ECT layout.

## Example Flows

### Boot → Render
1. `init.create_world(FieldSpec, [Observer(camera)], VRBinding)`
2. Loop `sim.step(dt, { head_pose, hands, controller_intents })`
3. If `performance.budget_exceeded`, reduce `base_lod` or pause exports.
4. On `resolution.changed`, call `query.ect` to inspect and optionally `control.haptics`.

### Probe Area & Export Geometry
1. `query.sample_field(world_id, grid_positions)` to locate high torsion bands.
2. Pin camera and boost `gaze_boost` via `world.update_observer`.
3. When stable, `export.mesh(world_id, "gltf", { region: aabb, max_lod: 3 })`.

## Agent Contracts
- Always request membranes via `sim.step` + `export.mesh`; assume no pre-existing geometry.
- Drive focus by moving observers or boosting `gaze_boost` temporarily.
- Respect budgets. After two consecutive `E.BUDGET` or `performance.budget_exceeded`, lower LOD or pause exports.
- Use events as triggers rather than polling loops.

## Glossary
- **EV:** Entropy/Experience Value at a point.
- **ECT:** Emergent Contrast Tangle (types A–E).
- **Membrane:** Iso-surface used for rendering/physics.
- **ResolutionPolicy:** Rules for observer compute spend.
- **Torsion:** Local twist metric for spiral continuity.
- **ROI:** Region of interest derived from observers.

## Example Payloads

### `init.create_world` (request)

```json
{
  "field": {
    "seed": 1337,
    "layers": [
      { "kind": "simplex", "weight": 0.7, "scale": 2.5, "offset": { "x": 0, "y": 0, "z": 0 } },
      { "kind": "curl", "weight": 0.3, "scale": 1.1, "params": { "octaves": 3 } }
    ],
    "thresholds": { "membrane_iso": 0.0, "ect_detect": 0.42 }
  },
  "observers": [
    {
      "id": "o9e3k1w4m2a7",
      "kind": "camera",
      "pose": { "p": { "x": 0, "y": 1.6, "z": 0 }, "q": { "x": 0, "y": 0, "z": 0, "w": 1 } },
      "fov_deg": 95,
      "interest_tags": ["membrane", "high_torsion"],
      "policy": {
        "base_lod": 1,
        "gaze_boost": 2,
        "distance_curve": "inverse",
        "max_budget_ms": 6,
        "hysteresis_ms": 150
      }
    }
  ],
  "vr": {
    "id": "vrb1",
    "device": "openxr",
    "render_scale": 1.0,
    "hand_tracking": true,
    "haptics": true,
    "late_latching": true,
    "motion_smoothing": true,
    "audio_spatialization": true
  }
}
```

### `sim.step` (response)

```json
{
  "ok": true,
  "err": null,
  "data": {
    "frame_stats": {
      "frame": 128,
      "dt": 0.011,
      "cpu_ms": 5.2,
      "gpu_ms": 5.6,
      "lod_changes": 2,
      "ect_active": 6,
      "mem_mb": 412,
      "dropped": false
    },
    "visible_ects": ["e5x2a", "e7n9b"],
    "mesh_chunks": [
      {
        "ect_id": "e5x2a",
        "lod": 3,
        "triangles": 240000,
        "bounds": { "min": { "x": -4, "y": 0, "z": -3 }, "max": { "x": 4, "y": 3, "z": 3 } },
        "gpu_handle": "buf:0xA9F1"
      }
    ],
    "events": [
      { "ts": 12.34, "kind": "resolution.changed", "data": { "reason": "gaze" } },
      { "ts": 12.35, "kind": "audio.emit", "data": { "ect_id": "e5x2a", "grain": "contrastwave", "amp": 0.4 } }
    ]
  }
}
```

## Roadmap Notes
- **Physics hooks:** Membrane contact tangential flows.
- **Networked observers:** Shared ECT cache across clients.
- **Adaptive iso:** Feedback from haptics/audio drives iso drift.

## Next Steps
- Prototype the FRP node graph with deterministic envelopes before coding GPU bindings.
- Pair this API with the [FRP Overview](../guides/frp-overview.md) to align observer policy handling.
- Log follow-up questions in `docs/meta/authoring-guide.md` **Next Steps** if additional schema formalization is required.
