---
title: Debugging Pear Applications
summary: Practical tooling and workflows for diagnosing Pear runtime issues during development and staging.
tags: [pear, debugging, platform]
updated: 2025-10-18
audience: both
---

# Debugging Pear Applications

> **Context Card**
> - **Scope:** Diagnose Pear runtime issues across dev, staging, and production.
> - **Primary APIs:** `pear dev --verbose`, `pear logs`, Chrome DevTools, Bare inspectors.
> - **Protocols/Feeds:** Inspect Hyper replication channels, Autobase feeds, Protomux sidecars during debugging.
> - **Dependencies:** Pear CLI, runtime logs, platform-specific debug tools.
> - **Outputs:** Reproduction steps, captured logs, targeted fixes or TODOs.
> - **Next Hop:** [`troubleshooting.md`](troubleshooting.md)

Use this field guide to trace runtime issues, inspect logs, and reproduce bugs in Pear desktop or terminal applications. Pair the checklists below with app-specific instrumentation so both humans and LLM assistants can triage problems consistently.

## Prerequisites
- Install the latest `pear` CLI (`npm install -g pear`) and confirm `pear --version`.
- Ensure the staged application was built with sourcemaps or labelled builds where possible.
- Know the staging channel (`dev`, `production`, etc.) and the app link you are testing.

## Inspect Runtime Logs
1. Launch the app with verbose logging enabled:
   ```bash
   pear run --log-level=debug pear://<app-key>
   ```
2. Tailed logs surface Pear runtime events (stage warmup, hyperswarm connections, filesystem operations).
3. Capture the output to a file when sharing with other debuggers:
   ```bash
   pear run --log-level=debug pear://<app-key> 2>&1 | tee debug.log
   ```
4. Highlight relevant sections (errors, warnings) and reference them in bug reports or LLM prompts.

## Attach Developer Tools
1. Desktop apps expose Chromium DevTools. Launch with inspection flags:
   ```bash
   pear run --inspect pear://<app-key>
   ```
2. Use `chrome://inspect` in a Chromium browser to attach to the remote target.
3. Set breakpoints, examine storage via the Application tab, and capture console traces.
4. Remember to restage the app with sourcemaps enabled to improve stack traces.

## Validate Environment Assumptions
1. Confirm platform-specific modules exist by checking `pear.config.options.gui` in `package.json`.
2. For filesystem access problems, verify the app's `stage.ignore` list excludes large directories but keeps required assets.
3. On Linux, ensure `libatomic` and other native dependencies are installed (see [Getting Started](getting-started.md)).

## Reproduce Network Issues
1. Enable Hyperswarm diagnostics:
   ```bash
   PEAR_DEBUG=network pear run pear://<app-key>
   ```
2. Observe discovery announcements and connection events. Lack of peers implies missing staging or firewall interference.
3. If a peer cannot connect, swap to LAN-only testing by sharing the app over a local tunnel (`pear stage dev && pear run pear://... --prefer-lan`).

## Capture Crash Reports
1. Wrap the app entry point with a global exception handler:
   ```js
   process.on('uncaughtException', err => {
     console.error('[fatal]', err)
   })
   ```
2. Restage the app and reproduce the crash so the handler logs stack details.
3. For deterministic reproduction, export the environment:
   ```bash
   npx envinfo --system --binaries --npmPackages pear > env-report.txt
   ```
4. Attach `env-report.txt` and `debug.log` to support requests or ticket updates.

## Work with Remote Logs
1. If another peer experiences the bug, ask them to run `pear run --log-level=debug` and share the link-specific output.
2. Compare timestamps across logs to detect replication gaps or channel mismatches.
3. Encourage remote peers to provide their `package.json` fragment so configuration drift can be spotted quickly.

## Next Steps
- Review staging expectations in [Sharing a Pear Application](sharing-pear-application.md).
- Cross-check configuration settings with [Pear Application Configuration](app-config-and-package-json.md).
- When diagnosing runtime features, consult [Pear Runtime Essentials](pear-runtime.md) for API behavior.
