# NeonURI Roadmap

This roadmap captures planned work as we move toward a stable 1.0 release.
Timelines are indicative; contributions are welcome.

## v0.2.0 (Stabilization)

- [ ] Publish canary builds consumed by mesh-toolbelt staging environments.
- [ ] Add end-to-end tests against real Hyperdrive/Hyperbee fixtures.
- [ ] Extend telemetry hooks with optional tracing IDs (e.g., `traceId`, `spanId`).
- [ ] Harden error payloads for catalog parsing failures (include selection path).

## v0.3.0 (Ecosystem Integration)

- [ ] Deliver official TypeScript declarations and JSDoc coverage.
- [ ] Provide a `createInMemoryResolvers` helper for browser/testing usage.
- [ ] Document resolver patterns for CDN caching and signed URIs.
- [ ] Ship a CLI utility for ad-hoc URI validation and resolution.

## v1.0.0 (General Availability)

- [ ] Lock protocol registry, public API signatures, and telemetry payloads.
- [ ] Confirm compatibility with Node.js LTS (currently 18.x, 20.x, 22.x).
- [ ] Achieve benchmark SLOs: < 0.2 ms avg catalog resolution, < 1 failure per 100k requests.
- [ ] Produce migration guide from mesh-toolbelt v0 implementations (blog + docs).

## Nice-to-Have Enhancements

- [ ] Optional caching layer for resolved bytes with pluggable stores.
- [ ] Integrations with popular observability stacks (OpenTelemetry exporter).
- [ ] Example projects demonstrating resolver usage in SSR contexts.

## Tracking & Feedback

- File roadmap-related issues using the `enhancement` label.
- Join discussions in GitHub Discussions for prioritization and design RFCs.
- CI benchmark artifacts (`bench-report-<run_id>`) serve as regression history.
