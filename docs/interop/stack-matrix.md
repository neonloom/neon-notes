# Stack Matrix — Virtualia Workspace

Recommended baseline so all four projects run against the same runtime and Hyper stack versions.

| Component | Economy | HyperQuill | RTS | Toolbelt | Notes |
|-----------|---------|------------|-----|----------|-------|
| Node.js | ≥ 20.10 (tested with 20.x) | ≥ 20.10 | ≥ 20.10 | ≥ 20.10 (`package.json` engine `>=18.17`, but align on 20.x) | Use `nvm use 20` or `.nvmrc` (pending). |
| Pear CLI | `pear@^2` (desktop) | `pear@^2` | `pear@^2` | n/a | Install once per workspace via `npm i -g pear`. |
| Autobase | `^7.21.1` | bundled via Toolbelt packages | `^7.21.1` | `^7.21.1` | Keep pinned to 7.21.x until all reducer changes clear QA. |
| Hypercore | `^11.18.4` | via dependencies | `^11.6.0` | `^11.18.3` | Minimum shared featureset: 11.6.0; prefer 11.18.x — RTS upgrade planned. |
| Hyperbee | `^2.26.5` | `*` (resolve to 2.26.x) | `^2.26.5` | `^2.26.5` | Lock to 2.26.x for deterministic encoding. |
| Hyperswarm | `^4.5.6` | `^4.14.2` | `^4.5.0` | `^4.14.2` | Standardize on `^4.14.2` once Economy/RTS verify compatibility. |
| Corestore | `^7.5.0` | `*` → 7.5.x | `^7.5.0` | `^7.5.0` | Shared namespace `virtualia.mesh`. |
| Neonuri / Plex | n/a | `@neonloom/neonuri@^0.1.4`, `@neonloom/plex@^0.1.4` | same | same | Keep CLI/libs aligned; Toolbelt provides canonical version. |
| Sodium Native | n/a | `*` → 5.x | `^5.0.9` | `^5.0.9` | Ensure system has build tooling (`libtool`, `python3`). |
| Test Runner | `node --test` | `bare` + `node --test` | `node --test` | `node --test` | Consolidate on `node --test` where possible. |

## Environment Expectations
- `VIRTUALIA_CORESTORE_NAMESPACE=virtualia.mesh`
- `VIRTUALIA_LEDGER_TOPIC=virtualia.economy.v1`
- `VIRTUALIA_REGISTRY_PATH=.virtualia/registry.json`
- `PEAR_DEVTOOLS=true` during local development.

## Next Actions
- [ ] Add `.nvmrc` with `v20.10.0`.
- [ ] Confirm Hyperswarm upgrade path (Economy + RTS) before bumping versions.
- [ ] Document OS-level prerequisites (build-essential, libssl, etc.) in a follow-up appendix.
