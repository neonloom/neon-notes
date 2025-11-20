---
title: Pear Application Best Practices
summary: Operational guidance for building reliable Pear apps across storage, networking, and staging.
tags: [pear, best-practices, platform]
updated: 2025-10-18
audience: both
---

# Best Practices

> **Context Card**
> - **Scope:** Operational patterns for building resilient Pear applications.
> - **Primary APIs:** Corestore management, Pear staging/seeding, Hyperswarm integration tips.
> - **Protocols/Feeds:** Guides how app subsystems interact with Hyper feeds and Pear runtime services.
> - **Dependencies:** Pear runtime/CLI, Hyper stack modules.
> - **Outputs:** Recommended architecture patterns, checklists, troubleshooting cues.
> - **Next Hop:** [`troubleshooting.md`](troubleshooting.md)

This article covers useful patterns that one should follow in most cases when developing Pear applications.

## Use One Corestore Instance Per Application

Corestores are meant to manage many cores and their sessions efficiently. Having multiple Corestore instances can cause issues such as file locking errors when using the same storage and duplicate core storage if the same core is used by two Corestores with different storages.

A single Corestore instance will:

* Reduces open file handles.
* Reduces storage space by deduping hypercore storage.
* Requires only one replication stream per peer.

If using `name`d cores that collide across different components of an app is an issue, use namespaces (`store.namepace('a')`) to create a namespaced version of a Corestore. Note that retrieving cores by `key` are unaffected by namespacing.

## Use One Hyperswarm Instance Per Application

Hyperswarm supports joining multiple topics on the same instance and will dedup peer connections shared between them. Having only one swarm instance will speed up connections by reducing records in the DHT for the topic and simplify managing the max number of connections an app makes.

## Never Load Javascript Over HTTP(S)

Just like in web development, running code from an external source is dangerous. Running external code opens an application up to being exploited if the external source is nefarious or compromised. This is why http and https traffic is blocked by default in Pear applications, preventing unintentional loading of code that would make your application vulnerable to supply chain attacks. This is especially dangerous for applications, like Pear applications, that have access to native functionality (eg. the file system).

## Exclude Development Dependencies when staging applications

When staging an application, all files in the root directory that are not explicitly ignored will be included in the application bundle. Development dependencies are not required at runtime and should therefore be excluded to reduce bundle size and improve performance. To remove them before staging, run:

```
npm prune --omit=dev
```

This ensures that only the necessary production dependencies are included in the final bundle.

## Package workspace dependencies before staging

When a Pear app imports internal workspaces (for example `@neonloom/core` or the runtime client libraries) the Pear runtime cannot resolve them from npm. Before staging the app, build those workspaces and install them from local tarballs:

1. Generate tarballs for all shared workspaces:
   ```bash
   node scripts/build-pear-packages.mjs
   ```
   This writes `.tgz` files and a `manifest.json` to `tmp/pear-packs/`.
2. In each Pear app, run the shared staging script which rewrites `dist/pear/package.json` to point at those tarballs and installs them:
   ```bash
   node ./scripts/prepare-stage-dir.mjs
   ```

The staging script installs tarballs in dependency order and falls back to npm only for true external packages. Keep `scripts/pear-packages.config.json` up to date so new workspaces are packed automatically.

## Exclude the .git Directory

The `.git` directory is excluded by default. However, if a custom `ignore` field is defined in the application's `stage` configuration, this overrides the default ignore rules. In such cases, you must explicitly include `.git` in the ignore list to ensure it remains excluded.

## Next Steps
- Review staging mechanics in [Sharing a Pear Application](sharing-pear-application.md).
- Align runtime expectations with [Pear Runtime Essentials](pear-runtime.md).
- Reference `../best-practices` updates when publishing new guides in `../meta/authoring-guide.md`.
