---
title: Pear Troubleshooting Guide
summary: Common issues encountered when developing or staging Pear apps and how to resolve them.
tags: [pear, troubleshooting, platform]
updated: 2025-10-18
audience: both
---

# Pear Troubleshooting Guide

> **Context Card**
> - **Scope:** Diagnose and resolve common Pear development, staging, and runtime failures.
> - **Primary APIs:** `pear doctor`, `pear logs`, staging/seed commands, environment variables.
> - **Protocols/Feeds:** Ensures Hyper networking, Autobase feeds, and storage mounts behave as expected.
> - **Dependencies:** Pear CLI/runtime, system packages, Hyper stack.
> - **Outputs:** Resolution steps, checklists, follow-up TODOs.
> - **Next Hop:** [`debugging-pear-app.md`](debugging-pear-app.md)

Use this guide to diagnose common failures during Pear development, staging, and runtime. Pair it with [Debugging Pear Applications](debugging-pear-app.md) for deeper investigations.

## Installation Issues
| Symptom | Fix |
| --- | --- |
| `pear` command not found | Ensure `npm install -g pear` succeeded and verify PATH. On Linux, consider installing via `nvm` or `nvs`. |
| `libatomic` missing (Linux) | Install the distro package (`sudo apt install libatomic1`, `sudo yum install libatomic`, etc.). |
| Permission denied when writing store | Run `pear run` from a directory the current user can write, or set `PEAR_HOME` to a writable path. |

## Staging Failures
- **`Error: unable to read package.json`** — confirm `package.json` exists and includes a `pear.name` or `name` field.
- **Warmup timeout** — large bundles can exceed defaults; increase `pear.stage.prefetch` to list critical assets and exclude unneeded directories in `pear.stage.ignore`.
- **`pear stage` stuck at diff** — remove large generated folders (`dist`, `tmp`) or add them to ignore lists before staging.

## Seeding & Replication
- **Peers cannot fetch the app**:
  1. Verify seeding machine is running `pear seed <channel>`.
  2. Ensure firewall allows outbound UDP/TCP required by Hyperswarm.
  3. Share the link exactly; typos in `pear://` links cause silent failures.
- **Reseed fails with `permission` error** — channel name does not match. Use `pear stage <channel>` first to derive the correct link.

## Runtime Problems
- **Window never appears (desktop)** — review logs with `pear run --log-level=debug`. Misconfigured GUI dimensions or missing assets can halt bootstrap.
- **Terminal app exits immediately** — check `Pear.config.args` handling; the app may be parsing expected arguments. Add fallback behaviour for empty args.
- **Deep links ignored** — ensure `Pear.updates()` handler is registered and the app opts in to routing by handling `config.linkData`.

## Bare Module Errors
- **`Cannot find module 'bare-tty'`** — install `bare-*` modules explicitly; they are not bundled with Pear runtime.
- **`Bare module requires experimental flag`** — upgrade Pear CLI to the latest version or add required environment variables documented in module README.

## Performance & Resource Use
- **High CPU after staging** — warmup is still running. Wait for the stage summary or rerun with `pear stage --dry-run` to inspect.
- **Large storage footprint** — prune dev dependencies (`npm prune --omit=dev`) and clear caches with `pear gc releases`.
-
- **Slow start on cold peers** — confirm warmup captured entry assets; run `pear stage production` to regenerate metadata then reseed.

## Crash & Error Collection
- Use process-level handlers:
  ```js
  process.on('uncaughtException', err => console.error('[fatal]', err))
  ```
- Capture environment details with:
  ```bash
  npx envinfo --system --binaries --npmPackages pear
  ```
- Attach logs to tickets or share with collaborating LLMs for context.

## Next Steps
- For structured debugging workflows, read [Debugging Pear Applications](debugging-pear-app.md).
- Review deployment hygiene in [Pear Application Best Practices](best-practices.md).
- Escalate persistent issues via Autobase governance feeds or team issue trackers.
