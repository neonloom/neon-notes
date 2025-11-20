title: Svelte UI Quickstart
summary: Scaffold, run, and test a SvelteKit project that can integrate with Hyper services.
tags: [svelte, platform, quickstart]
updated: 2025-10-18
audience: both
---

# Svelte UI Quickstart

> **Context Card**
> - **Scope:** Scaffold and integrate a SvelteKit app with Hyper services.
> - **Primary APIs:** `npm create svelte@latest`, SvelteKit loaders/actions, Hyper client helpers.
> - **Protocols/Feeds:** Sets up communication with Hyper RPCs, Autobase feeds, or Protomux channels.
> - **Dependencies:** Node.js ≥18, SvelteKit toolchain, Hyper client libraries.
> - **Outputs:** Running SvelteKit project, Hyper-aware client module, test hooks.
> - **Next Hop:** [`sveltekit-essentials.md`](sveltekit-essentials.md)

Spin up a clean SvelteKit application, wire it to Hyper-facing APIs, and prepare it for local development. These steps stay vendor-neutral so you can adapt them to any project.

## 1. Create a project

```bash
npm create svelte@latest hyper-viewer
cd hyper-viewer
npm install
```

Pick the skeleton app to minimise defaults, or add TypeScript/Playwright/Vitest during the setup prompts as your project requires.

## 2. Configure Hyper API access

Expose environment variables that your Hyper clients expect (for example peer keys, RPC endpoints, or tokens). Place development defaults in `.env`:

```bash
HYPER_RPC_URL=http://localhost:4977
HYPER_API_TOKEN=dev-token
```

Load them in SvelteKit via `$env/static/private` or `$env/static/public` depending on exposure needs.

## 3. Build a lightweight data client

Create a utility module (e.g. `src/lib/hyper/client.ts`) that wraps your Hyper workflows—fetching a feed, publishing commands, or subscribing to Autobase updates.

```ts
import { corestore } from '@hyper-sdk/corestore';

export async function listFeeds() {
  const store = corestore(process.env.HYPER_RPC_URL);
  // ...
}
```

## 4. Run in development

```bash
npm run dev -- --open
```

Use `npm run check` and `npm run lint` to keep TypeScript and ESLint aligned with Hyper-side type definitions.

## 5. Test critical flows

- Write integration tests with Vitest or Playwright that stand up any required Hyper fixtures.
- When a UI action appends to a feed or record, assert the new state via the client helper you created.
- Mock network gaps with dependency injection so Svelte components stay deterministic.

## Next steps

- Fold in routing, loaders, and form actions using `sveltekit-essentials.md`.
- Capture project-specific adapters or CLI scripts in separate docs so this quickstart remains reusable.
- Log reusable UI conventions in a project-specific supplement once those standards are ready.
