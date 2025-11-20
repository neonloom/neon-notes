---
title: Pear Runtime Essentials
summary: Overview of the Pear runtime architecture, storage primitives, and execution environment.
tags: [pear, runtime, platform]
updated: 2025-10-18
audience: both
---

# Pear Runtime Essentials

> **Context Card**
> - **Scope:** Pear runtime architecture, storage model, and execution environment.
> - **Primary APIs:** `pear.config`, `Pear.connect()`, stage/seed workflows, Bare/Electron runtimes.
> - **Protocols/Feeds:** Corestore-backed app storage, Protomux sidecar channels, Hyper replication.
> - **Dependencies:** Pear runtime, Bare runtime (terminal), Electron shell (desktop), Corestore.
> - **Outputs:** Runtime boot sequence, storage layout, integration touchpoints.
> - **Next Hop:** [`app-config-and-package-json.md`](app-config-and-package-json.md)

Understand how the Pear runtime boots applications, manages storage, and exposes native capabilities. Use this reference when designing app architecture or debugging runtime behaviour.

## Runtime Architecture
- **Application Storage**: Stage outputs and replicated assets live under the runtime's Corestore. Each app/channel pair maps to a Hypercore-backed dataset.
- **Stage Warmup**: During `pear stage`, the runtime traces critical path assets and records them in a Hypercore so future launches stream required files first.
- **Sidecar Services**: Native components (e.g., system tray, auto-updater) run alongside the app and communicate via Protomux channels exposed through `Pear.connect`.
- **Bare Runtime**: Terminal apps execute on Bare, a lightweight JS runtime with minimal built-ins. Desktop apps run via Pear Electron which embeds Chromium.

## Key Concepts for Apps
- **Config Surface**: `pear.config.options` reflects the merged `package.json` pear block and runtime defaults. Use it to branch by platform or feature flag.
- **Lifecycle Hooks**:
  - `Pear.updates(cb)` — subscribe to runtime events (deep links, env changes).
  - `Pear.teardown(cb)` — register cleanup handlers before process exit.
  - `Pear.exit()` — request application shutdown.
- **Link Handling**: When launched via `pear run pear://...`, `Pear.config.linkData` exposes the path component of the link so apps can route sessions.

## Storage and Files
- `Pear.dataDir` (desktop) or `Pear.paths.storage` (terminal) point to the sandboxed storage root scoped to the app.
- Use `pear stage --ignore` to exclude development-only folders but keep runtime dependencies.
- Logs and crash dumps default to the runtime storage directory; rotate or upload them as part of support tooling.

## Networking
- Hyperswarm peers are managed by the runtime; apps interact via provided APIs (`Pear.swarm`, `Pear.connect`).
- Apps can prefer LAN peers by setting `pear.network.preferLAN = true` in configuration, falling back to DHT discovery when unavailable.
- For private deployments, override bootstrap nodes through environment variables or config policies maintained in Autobase governance feeds.

## Security Considerations
- HTTP(S) requests are blocked by default. Grant explicit permissions through modal prompts or pre-approved policy files (for internal tooling).
- Avoid loading remote code at runtime; stage all JS/CSS assets with the app bundle.
- Use `Pear.permissions.request()` to prompt users for filesystem or clipboard access.

## Observability
- Enable verbose logging with `pear run --log-level=debug` (desktop/terminal).
- Inspect runtime metrics via `pear status` and `pear data apps`.
- Emit structured diagnostics to a Hyperbee record so other peers (or automations) can monitor health.

## Integration Tips
- When embedding Hyperswarm or Autobase workflows, reuse the shared Corestore provided by the runtime to avoid duplicate storage.
- For multi-app suites, publish shared modules as tarballs and install them during staging (see [Pear Application Best Practices](best-practices.md)).
- Capture runtime-driven events (updates, network transitions) into Autobase feeds so clients can react consistently across sessions.

## Next Steps
- Configure per-app options using [Pear Application Configuration](app-config-and-package-json.md).
- Review CLI commands in [Pear CLI Reference](pear-cli.md) for staging and diagnostics.
- Troubleshoot runtime issues with [Debugging Pear Applications](debugging-pear-app.md).
