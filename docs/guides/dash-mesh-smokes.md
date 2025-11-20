---
title: Dash Mesh + Smokes Wiring
summary: How to hook the Deck Dash tabs into the existing HTTP/WebSocket surfaces (Mesh, EF lamps, Smokes triggers).
tags: [dash, mesh, smokes, websocket]
updated: 2025-02-14
audience: both
---

# Overview
The server already exposes `/mesh`, `/ef`, `/state`, `/receipts`, `/claims`, `/smokes`, plus a WebSocket fan-out. This guide shows how to wire the Deck Dash tabs so operators can see Mesh/EF lamps and trigger Smokes without writing custom plumbing.

## Data sources

| Feature | Endpoint / stream | Notes |
| --- | --- | --- |
| Mesh status | REST: `GET /mesh`, WS: `type="mesh/status"` | Returns peer/topic info from `lib/state/mesh-status.js`. |
| EF lamps | REST: `GET /ef`, WS: `type="ef/status"` | Batch height, hash, determinism lamp booleans. |
| HUD state | REST: `GET /state`, WS: `type="hud/state"` | HUD reducer output (state + artifacts). |
| Receipts | REST: `GET /receipts`, WS: `type="hud/receipts"` | Latest receipts list. |
| Claims | REST: `GET /claims`, WS: `type="hud/claims"` | Entire claims feed (for inspector views). |
| Smokes templates | REST: `GET /smokes/templates` | Returns `{ templates: [{ name, description, kind }] }`. Use to populate dropdowns. |
| Smokes trigger | REST: `POST /smokes` body `{ template, overrides?, count? }` | Server expands templates via `createClaimFromTemplate(...)`. |

WebSocket payload shape: `{ type, payload }`. Subscribe once per tab and route messages by `type`.

## Mesh tab wiring

1. **Bootstrap**: `fetch("/mesh")` when the tab mounts; store the response.
2. **Live updates**: On WS message `type === "mesh/status"`, merge into state.
3. **Display**: Minimal UI = table of peers (`id`, `topic`, `latency`, `connected`) + stats (queue depth). Extend later for topic toggles.
4. **Error handling**: If `/mesh` fails, show placeholder and retry with backoff; rely on WS to refill.

## EF tab wiring

1. `fetch("/ef")` for the initial lamp state (`batch`, `hash`, `determinism`).
2. Subscribe to `type === "ef/status"` updates.
3. Render: timeline gauge (batch height), hash string, green/red lamp based on `deterministic` boolean.

## Smokes tab

1. Provide dropdown of templates: `placement_ok`, `overlap_attack`, `no_quorum`, `bandwidth_squeeze`. The list comes from the generator template module; keep a mirror in the Dash.
2. Form posts to `/smokes` with JSON body `{ template, overrides?: { ... }, count?: number }`.
3. Show response `{ ok, ids }` and optionally log events in a table.
4. Advanced: allow uploading `smokes/*.json` to run sequences by calling `scripts/mock-claims-live.mjs` (CLI) or iterating client-side and hitting `/smokes` repeatedly. For now, keep UI simple: send small bursts (1–5 claims).

## Implementation sketch (Svelte/React agnostic)

```js
const ws = new WebSocket("ws://127.0.0.1:4173");
ws.addEventListener("message", (event) => {
  const { type, payload } = JSON.parse(event.data);
  if (type === "mesh/status") meshStore.set(payload);
  if (type === "ef/status") efStore.set(payload);
  if (type === "hud/state") hudStore.set(payload);
  if (type === "hud/receipts") receiptsStore.set(payload);
});

async function triggerSmoke(template, overrides = {}, count = 1) {
  const res = await fetch("/smokes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ template, overrides, count })
  });
  if (!res.ok) throw new Error("smoke failed");
  return res.json(); // { ok, ids }
}
```

## Profiles + Dash

Run `npm run up:demo` while developing the Dash. The profile script seeds fixtures, keeps `smokes/demo-placement.json` running in the background, and launches the server, so the Dash always sees live Mesh/EF/HUD traffic. Switch to `up:solo` for deterministic smoke-free debugging.

## Future hooks

- Add `/topics` endpoint when topic subscribe/unsubscribe controls land so the Mesh tab can mutate Hyperswarm joins.
- When Plex/SecretStream admin lanes exist, expose a corresponding `/mesh/admin` resource and new WS types for elevated feeds.
- Mirror template metadata by adding `GET /smokes/templates` that reads from `lib/state/mocks/claim-templates.js`, so the Dash doesn’t need a hardcoded list.

Until the Dash repo exists, this guide is the contract between backend and UI. Keep it synced with server changes (new endpoints, payload shapes) to avoid drift.
