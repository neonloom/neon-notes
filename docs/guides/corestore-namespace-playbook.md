---
title: Corestore Namespace Playbook
summary: Convention for deterministic namespace trees (human-readable + hashed concern segments) and the helper functions that implement it.
tags: [corestore, namespaces, virtualia]
updated: 2025-02-14
audience: both
---

# Why this exists
Virtualia leans on a single Corestore per process. Without guardrails, assistants may create ad-hoc namespaces (`store.namespace("demo")`) that collide, leak state between concerns, or become impossible to reason about once hundreds of feeds exist. This playbook locks in a deterministic scheme that combines:

1. **Human-readable lanes** (`virtualia`, `autobase`, `bee/local`, etc.) so we can scan the tree, and
2. **Hashed concern segments** (32-byte Buffers) for dense or secret scopes (coordinates, economy buckets, per-admin lanes).

Use the helper functions in `lib/storage/namespaces.js` to build every namespace path so collision risk disappears and future tooling can introspect paths reliably.

---

## Building paths

1. Start with a shared root (e.g., `virtualia`).
2. Append service / lane segments (`autobase`, `hud`, `bee/local`, ...).
3. When the concern is structured (coordinates, city id, policy id), hash it into a fixed 32-byte Buffer:
   ```js
   import { namespacePath, hashNamespaceSegment } from "../lib/storage/namespaces.js"

   const scope = namespacePath(
     "virtualia",
     "autobase",
     "economy",
     hashNamespaceSegment("z32:city-main", { type: "policy", id: 7 }),
     hashNamespaceSegment({ coords: [10, 20] })
   )
   ```
4. Pass that path to `createScopedNamespaceNode(corestoreNode, scope)` (Dagify) or `applyNamespacePath(store, scope)` (imperative environments) to obtain the derived Corestore session.

All helper outputs are frozen arrays of Buffers, so they are safe to cache and share between prefabs.

---

## Helper quick reference

| Helper | What it does |
| --- | --- |
| `namespacePath(...segments)` | Normalizes strings/Buffers/Uint8Arrays/numbers into a path array (segments are stacked in order). |
| `hashNamespaceSegment(...values)` | Returns a 32-byte Buffer by hashing the concatenated encoded values via `hypercore-crypto`. Use this for coordinates, city ids, or any content that should be opaque. |
| `createScopedNamespaceNode(corestoreNode, path)` | Dagify node that walks the path and yields the derived Corestore namespace. |
| `applyNamespacePath(store, path)` | Imperative helper that reduces the path on a Corestore instance (use outside Dagify). |

See `lib/storage/namespaces.js` for the implementation.

---

## Patterns

### Human-readable tree
```
virtualia/
  autobase/
    hud-state
    claims
  bee/
    local
    remote
```
Call `namespacePath("virtualia", "bee", "local")` and reuse the resulting Buffer array across every prefab that needs local Hyperbee storage.

### Hashed concerns
```
virtualia/
  autobase/
    economy/
      <hash("z32:city-main")>/
        <hash({ coords: [10,20] })>
```
Any agent that knows the same structured data will derive the same namespace automatically; no collisions, no guesswork.

### Private/admin lanes via Plex
Pair hashed segments with the Plex mux pattern from `scratch/corestore-namespace-plex.js`. You can splice Hyperswarm sockets into Plex lanes, wrap them in SecretStream, and feed only the namespaces reserved for elevated roles over that channel while public topics carry the general feeds.

---

## Next steps for contributors
1. Import and use `namespacePath` / `hashNamespaceSegment` whenever you create a new Corestore namespace.
2. Avoid raw string literals in prefabs; pass the path to `createScopedNamespaceNode` instead.
3. When proposing new concerns, document the path in `docs/guides/corestore-namespace-playbook.md` so future work stays aligned.
4. If a namespace tree must be shared with browsers or other runtimes, encode the path segments (Base32/Z32) rather than leaking raw binary.

With this convention, the entire mesh can reason about storage layout, and collisions become deliberate (humans have to opt into them). Detached assistants also gain a single vocabulary to refer to lanes (e.g., “Virtualia Autobase Economy Scope hash = `z32:...`”) and can wire prefab nodes safely.
