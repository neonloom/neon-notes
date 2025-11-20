---
title: Marking a Pear Release
summary: Checklist for promoting a staged Pear build to a release channel and communicating availability to peers.
tags: [pear, release, platform]
updated: 2025-10-18
audience: both
---

# Marking a Pear Release

> **Context Card**
> - **Scope:** Promote staged Pear builds to release channels with reproducible steps.
> - **Primary APIs:** `pear stage`, `pear seed`, channel promotion commands, release tagging.
> - **Protocols/Feeds:** Publishes Hyper drive feeds and Autobase data to production peers.
> - **Dependencies:** Pear CLI, staged build artifacts, release notes.
> - **Outputs:** Production channel seed, release announcement, updated metadata.
> - **Next Hop:** [`sharing-pear-application.md`](sharing-pear-application.md)

Once a Pear application has been staged and tested, use this release checklist to promote it from development channels (`dev`, `beta`) to a production channel. The steps emphasise reproducibility so both people and LLMs can follow them accurately.

## Prerequisites
- The application is already staged in a non-production channel and passes smoke/regression tests.
- All workspaces referenced in `package.json` are tarballed or published.
- Release notes have been drafted with highlights, known issues, and migration steps.

## Step 1 – Freeze the Build
1. Regenerate dependencies to avoid drift:
   ```bash
   npm ci
   ```
2. Build any workspace bundles referenced by the Pear app.
3. Record the commit hash and tarball checksums in `docs/platforms/pear/releases/<YYYY-MM-DD>.md` (create if needed).

## Step 2 – Stage to Production Channel
1. From the project directory, run:
   ```bash
   NODE_ENV=production pear stage production
   ```
2. Capture the output link (`pear://…`) and store it in release notes along with the channel name.
3. Verify the warmup summary to confirm critical assets were prefetched.

## Step 3 – Verify the Release Build
1. Launch the staged build locally:
   ```bash
   pear run pear://<production-link>
   ```
2. Run automated smoke tests or manual checklists.
3. Confirm that configuration files reference the correct services (no `dev` endpoints).

## Step 4 – Seed the Release
1. Seed from at least one stable peer:
   ```bash
   pear seed production
   ```
2. Keep the seeding peer online until multiple mirrors confirm replication.
3. Optionally pin the release on additional machines using the same command.

## Step 5 – Publish Release Notes
1. Update your changelog or release notes channel with:
   - Channel (`production`)
   - Pear link
   - Commit hash / version metadata
   - Summary of changes and known issues
2. Include rollback instructions (the previous production link) so operators can downgrade quickly if needed.

## Step 6 – Notify Integrations
1. Update monitoring dashboards or orchestration configs with the new link.
2. Ping teams or automations subscribed to release events (e.g., via Autobase governance feed).
3. If required, update documentation references under `docs/platforms/pear/` to point to the new release link.

## Step 7 – Post-Release Validation
1. Tail logs using the guidance in [Debugging Pear Applications](debugging-pear-app.md) for the first session.
2. Confirm replication metrics with `pear status production`.
3. If incidents occur, document them in the release log and decide whether to roll back.

## Next Steps
- Share deployment artefacts through [Sharing a Pear Application](sharing-pear-application.md) for new mirrors.
- Review [Pear Application Best Practices](best-practices.md) to keep bundles lean.
- Capture follow-up tasks in team issue trackers or `docs/meta/authoring-guide.md`.
