---
title: SvelteKit Essentials
summary: Routing, load handlers, actions, and deployment patterns for SvelteKit.
tags: [sveltekit, platform]
updated: 2025-10-18
audience: both
---

# SvelteKit – Essentials

> **Context Card**
> - **Scope:** Core SvelteKit concepts—routing, data loading, actions, deployment adapters.
> - **Primary APIs:** `+page.svelte`, `load` functions, form actions, adapters, hooks.
> - **Protocols/Feeds:** Provides scaffolding to consume Hyper services via loaders/actions.
> - **Dependencies:** SvelteKit, Vite, Node.js ≥18, chosen adapter (Node, Static, etc.).
> - **Outputs:** Routing plan, data-loading patterns, deployment configuration notes.
> - **Next Hop:** [`quickstart.md`](quickstart.md)

## What is SvelteKit?

SvelteKit is the full-stack app framework for Svelte: filesystem routing, SSR/CSR, loading data, form actions, adapters for deployment. ([Svelte][1])

## Project & routing model (filesystem-based)

* Routes live under `src/routes`.
* Each directory under `src/routes` becomes a URL; dynamic segments use `[param]`; catch-alls use `[...rest]`.
* Route files are identified by a `+` prefix. Core ones:

    * `+page.svelte` – the page UI
    * `+page.js` / `+page.server.js` – page `load` functions
    * `+layout.svelte` / `+layout.js` / `+layout.server.js` – layouts and their loaders
    * `+server.js` – endpoint (API) handlers for HTTP methods
    * Optional `+error.svelte` per route “scope”
      See full routing rules and file roles. ([Svelte][2])

## Loading data (the “load” API)

Two flavors:

* **Universal load** in `+page.js` / `+layout.js` runs on server (first render) **and** in browser (navigations).
* **Server-only load** in `+page.server.js` / `+layout.server.js` (use when you need secrets/DB).
  Loaders return serializable data consumed as the `data` prop in the Svelte component. ([Svelte][3])

**Minimal examples (ESM):**

```js
// src/routes/blog/[slug]/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
  const res = await fetch(`/api/posts/${params.slug}.json`);
  if (!res.ok) throw error(404, 'Not found');
  return { post: await res.json() };
}
```

```js
// src/routes/blog/[slug]/+page.server.js
/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  const post = await locals.db.posts.get(params.slug);
  return { post };
}
```

(When to pick which, and API details for params, cookies, headers, redirects, streaming, re-running, etc.) ([Svelte][3])

## Form actions (server side `<form>` handling)

* Define actions in `+page.server.js`:

    * `export const actions = { default: async (event) => { ... } }`
    * Or **named** actions (`create`, `delete`, …) and post to `/route?/**/create` using `?/` syntax.
* Works without JS; can be progressively enhanced with `$app/forms`. ([Svelte][4])

**Example:**

```js
// src/routes/contact/+page.server.js
/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    // ...persist...
    return { success: true };
  }
};
```

## API routes / endpoints (`+server.js`)

Create REST-like endpoints by exporting HTTP methods from `+server.js` in a route folder:

```js
// src/routes/api/roll/+server.js
export function GET() {
  return new Response(JSON.stringify({ n: Math.ceil(Math.random()*6) }));
}
export async function POST({ request }) {
  const payload = await request.json();
  return new Response(JSON.stringify({ ok: true, payload }), { status: 201 });
}
```

Supported methods: `GET, POST, PUT, PATCH, DELETE`. ([Svelte][5])

## Hooks (app-wide control points)

Create any of:

* `src/hooks.server.js` – server hooks (e.g., `handle`, `handleFetch`, `handleError`)
* `src/hooks.client.js` – client hooks
* `src/hooks.js` – universal hooks
  Use `handle` to set `event.locals`, inject headers, short-circuit responses, etc. ([Svelte][6])

**Sketch:**

```js
// src/hooks.server.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  event.locals.user = await getUserFromSession(event.cookies.get('sid'));
  return resolve(event);
}
```

## Environment & server-only modules

* Private env: `$env/static/private`, `$env/dynamic/private` — **server-only**.
* Public env: `$env/static/public`, `$env/dynamic/public` (keys must start with `PUBLIC_`).
* Server-exclusive utilities like `$app/server` (e.g., `read`) are restricted to server code. ([Svelte][7])

### Monorepo env loading
In a workspace/monorepo, point SvelteKit at the repo root `.env` by setting `kit.env.dir` in `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-node';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  kit: {
    adapter: adapter({ precompress: true }),
    env: { dir: resolve(__dirname, '..', '..', '..') } // repo root
  }
};
```

Use `$env/dynamic/private` for server-only variables at runtime, and `$env/static/private` for build-time constants. Only `PUBLIC_*` variables are exposed to the browser.

## Page options (SSR, prerender, SPA)

Per route/file exports can tune behavior, e.g.:

```js
// in +page.js or +layout.js
export const ssr = true;                 // or false
export const csr = true;                 // or false
export const prerender = 'auto' | true | false;
```

See page-level controls (hydration, prerender, link discovery hints, etc.). ([Svelte][8])

## Reference: key `$app/*` modules (just the basics)

* `$app/navigation` (`goto`, `beforeNavigate`, `afterNavigate`)
* `$app/forms` (progressive enhancement for actions)
* `$app/paths` (base path, assets)
* `$app/stores` (navigating, page)
  All are listed in the docs “Reference” sidebar. ([Svelte][2])

---

# Adapter: **@sveltejs/adapter-node** (Node servers)

## What it generates

`npm i -D @sveltejs/adapter-node` and configure `svelte.config.js`. The adapter builds a Node server to `build/` with:

* `build/index.js` – start a production server (`node build`)
* `build/handler.js` – a request handler you can mount in your own server (Express/Polka/Connect/`http.createServer`) ([Svelte][9])

**Config options (svelte.config.js):**

```js
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    adapter: adapter({
      out: 'build',         // default
      precompress: true,    // gzip+brotli assets/prerendered pages
      envPrefix: ''         // custom prefix for HOST/PORT/ORIGIN etc
    })
  }
};
```

Option semantics (`out`, `precompress`, `envPrefix`) are documented here. ([Svelte][9])

## Running the server

* Make sure prod deps are present; then:

  ```bash
  node build
  ```
* For `.env` in production: either `node -r dotenv/config build` or with Node ≥20.6 use `node --env-file=.env build`. ([Svelte][9])

## Important environment variables

* **HOST / PORT** – bind address and port (`HOST=127.0.0.1 PORT=4000 node build`)
* **SOCKET\_PATH** – alternative to HOST/PORT (UNIX socket)
* **ORIGIN** – canonical origin (e.g. `https://my.site`) to help SvelteKit resolve absolute URLs (esp. forms/redirects)
* **PROTOCOL\_HEADER / HOST\_HEADER \[/ PORT\_HEADER]** – if behind a trusted reverse proxy (e.g. `x-forwarded-proto`, `x-forwarded-host`, `x-forwarded-port`)
* **ADDRESS\_HEADER / XFF\_DEPTH** – for `event.getClientAddress()` behind proxies
* **BODY\_SIZE\_LIMIT** – max request body (e.g. `512K`, `1M`, `Infinity`)
* **SHUTDOWN\_TIMEOUT** – seconds to force-close lingering conns after SIGTERM/SIGINT
* **IDLE\_TIMEOUT** – for systemd socket activation to auto-sleep when idle
  All defined in the adapter-node docs. ([Svelte][9])

## Graceful shutdown & lifecycle

* Adapter emits a `sveltekit:shutdown` process event after the HTTP server closes all connections — you can `await` async cleanup (DB, queues) there. ([Svelte][10])

## Custom server usage

If you need to add your own routes/middleware (health checks, Socket servers, etc.), use `handler.js`:

```js
// my-server.js
import express from 'express';
import { handler } from './build/handler.js';

const app = express();

// your own route
app.get('/healthcheck', (_, res) => res.end('ok'));

// let SvelteKit handle the rest (static, endpoints, pages)
app.use(handler);

app.listen(3000);
```

Works with Express, Connect, Polka, or Node’s `http`. ([Svelte][9])

## Compression note

If you add compression yourself in a custom server, the docs recommend `@polka/compression` because SvelteKit streams responses; the popular `compression` middleware can break streaming. Prefer doing compression at the proxy (NGINX/Cloudflare) if you have one. ([Svelte][9])

## Systemd socket activation (optional)

Adapter supports systemd socket activation with `LISTEN_PID`/`LISTEN_FDS`; see the docs for units, enabling the socket, and `IDLE_TIMEOUT`. ([Svelte][9])

---

# Tiny “starter” checklist for an agent

1. **Create app**

```bash
npm create svelte@latest myapp
cd myapp && npm i
```

2. **Add Node adapter**

```bash
npm i -D @sveltejs/adapter-node
# configure svelte.config.js -> kit.adapter = adapter({ precompress: true })
```

Docs list and adapter overview. ([Svelte][11])

3. **Make a page, loader, action, and API:**

```svelte
<!-- src/routes/+page.svelte -->
<h1>Welcome</h1>
<form method="POST">
  <input name="email" placeholder="you@example.com">
  <button>Subscribe</button>
</form>
```

```js
// src/routes/+page.server.js
export const actions = {
  default: async ({ request }) => {
    const email = (await request.formData()).get('email');
    // save...
    return { ok: true, email };
  }
};
```

```js
// src/routes/api/ping/+server.js
export const GET = () => new Response('pong');
```

(Placement & semantics for loaders, actions, endpoints.) ([Svelte][3])

4. **Build & run**

```bash
npm run build
node build
# or custom server mounting build/handler.js
```

(Environment options/ORIGIN/headers when behind a proxy.) ([Svelte][9])

---

[1]: https://svelte.dev/docs/kit?utm_source=chatgpt.com "Introduction • Docs"
[2]: https://svelte.dev/docs/kit/routing "Routing • Docs • Svelte"
[3]: https://svelte.dev/docs/kit/load "Loading data • Docs • Svelte"
[4]: https://svelte.dev/docs/kit/form-actions?utm_source=chatgpt.com "Form actions • Docs"
[5]: https://svelte.dev/tutorial/kit/get-handlers?utm_source=chatgpt.com "API routes / GET handlers • Svelte Tutorial"
[6]: https://svelte.dev/docs/kit/hooks "Hooks • Docs • Svelte"
[7]: https://svelte.dev/docs/kit/server-only-modules?utm_source=chatgpt.com "Server-only modules • Docs"
[8]: https://svelte.dev/docs/kit/page-options?utm_source=chatgpt.com "Page options • Docs"
[9]: https://svelte.dev/docs/kit/adapter-node "Node servers • Docs • Svelte"
[10]: https://svelte.dev/docs/kit/adapter-node?utm_source=chatgpt.com "Node servers • Docs"
[11]: https://svelte.dev/docs/kit/adapters?utm_source=chatgpt.com "Adapters • Docs"
