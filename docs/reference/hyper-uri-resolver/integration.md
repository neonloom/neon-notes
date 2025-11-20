# Consumer Integration Guide

This guide outlines how downstream services can adopt NeonURI, migrate away
from in-repo helpers, and configure runtime dependencies such as Hyperswarm and
Corestore.

## Package Adoption Checklist

- [ ] Install `@neonloom/neonuri`.
- [ ] Audit existing Hyper* helpers and remove duplicated parsing/validation.
- [ ] Replace bespoke catalog traversal with `resolveHyperUris`.
- [ ] Configure telemetry (`onAttempt` / `onResolution`) to feed observability.
- [ ] Run `npm run bench` (with `ITERATIONS=1000`) before and after integration.

## Mesh Toolbelt Migration

1. Import the public surface from `@neonloom/neonuri`.
2. Replace references to legacy `src/lib/hyperUri*` modules with package exports.
3. Wire `createHyperResolvers` and `createHyperswarmResolver` into existing
   dependency injection points. Pass shared Corestore instances via the
   `createSwarm` / `storePath` options if you need reuse across modules.
4. Propagate telemetry callbacks to the host application’s logging/metrics
   pipeline. Capture attempt durations and failure counts for dashboards.
5. Remove redundant schema validation and rely on `validateHyperUri`.

## Resolver Configuration

- **Corestore path:** Override `storePath` when running multiple resolvers on
  the same host to avoid redundant replication.
- **Hyperswarm bootstrap:** Supply `bootstrap` URLs when operating outside the
  default discovery network.
- **Timeouts:** Adjust `connectionTimeout` (default 30s) for deployments with
  stricter latency requirements.
- **Plex enforcement:** Provide `layers` metadata on pointers to ensure Plex
  channels auto-wire correctly.

## Environment & Deployment

- Require Node.js ≥ 18.17 for native ESM support and the Brittle CLI (`brittle-node` / `brittle-bare`).
- Ensure Hyperdrive/Hyperbee resolvers run with writable storage if replication
  should persist across process restarts.
- Disable `SMOKE_TRACE` in production to avoid logging sensitive URIs.
- Run the GitHub Actions workflow (or locally via `npm run release`) before
  promoting changes.

## Observability

- Forward `onAttempt` events to tracing systems (Grafana, Honeycomb, etc.) to
  monitor fallback rates and latency.
- Track the benchmark artifacts uploaded by CI to spot regressions after merges.
- Consider emitting custom metrics for unexpected catalog depth overruns or
  hash mismatches.
