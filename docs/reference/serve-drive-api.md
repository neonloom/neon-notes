---
title: Serve Drive API Reference
summary: HTTP server for exposing Hyperdrive and Localdrive content with dynamic drive selection.
tags: [serve-drive, http, reference]
updated: 2025-10-21
audience: both
---

# Serve Drive

> **Context Card**
> - **Scope:** Node.js HTTP server that proxies Hyperdrive or Localdrive file trees over plain HTTP.
> - **Primary APIs:** `new ServeDrive()`, `serve.getLink()`, `serve.ready()`, `serve.suspend()`, `serve.resume()`.
> - **Protocols/Feeds:** Underlying Hyperdrive or Localdrive storage, Hypercore feeds when using Hyperdrive.
> - **Dependencies:** Node.js ≥18, `serve-drive`, optional `hyperdrive`, `localdrive`, `corestore`.
> - **Outputs:** HTTP responses per request path, signed URLs via `serve.getLink()`.
> - **Next Hop:** [`hyperdrive-api.md`](hyperdrive-api.md), [`localdrive-api.md`](localdrive-api.md)

Serve Drive wraps existing Hyperdrive or Localdrive instances in an HTTP server. It inspects the file extension to return content types, and it can switch between multiple drives at request time through a user-provided `get` handler.

## Install

```bash
npm install serve-drive
```

## Basic Usage

```js
const ServeDrive = require('serve-drive')
const Localdrive = require('localdrive')

const drive = new Localdrive('./my-folder')
await drive.put('/index.html', Buffer.from('hi'))

const serve = new ServeDrive({
  async get ({ key, filename, version }) {
    return drive
  }
})

await serve.ready()
console.log('Listening on http://localhost:' + serve.address().port)
```

Each request delegates to the asynchronous `get` function. Return the drive that should back the request; return `null` to produce a `404`.

## Serving Multiple Drives

Use the `get` hook to route requests to different drives by key or other metadata.

```js
const Localdrive = require('localdrive')
const Hyperdrive = require('hyperdrive')
const Corestore = require('corestore')

const drive1 = new Localdrive('./my-folder-a')
const drive2 = new Hyperdrive(new Corestore('./store1'))

await drive1.put('/index.html', Buffer.from('a'))
await drive2.put('/index.html', Buffer.from('b'))

const serve = new ServeDrive({
  async get ({ key }) {
    if (key === null) return drive1 // default drive when no ?key= is supplied
    if (key.equals(drive2.key)) return drive2
    return null
  },
  async release ({ drive }) {
    // Optionally clean up resources after each request
  }
})

await serve.ready()
console.log('Listening on http://localhost:' + serve.address().port)
```

When clients append `?key=<id-or-key>` or `?version=<n>` to the URL, Serve Drive forwards those values to the `get` hook so the handler can select a drive and/or checkout a historic version.

## Constructor

#### `const serve = new ServeDrive([options])`

Creates an HTTP server that serves entries from a Hyperdrive or Localdrive instance.

```js
const serve = new ServeDrive({
  async get ({ key, filename, version }) { /* return drive or null */ },
  async release ({ key, drive }) { /* optional cleanup */ },
  port: 49833,
  host: '0.0.0.0',
  anyPort: true,
  server: null
})
```

- `get` (required): asynchronous function that returns the drive to use for the current request. It receives `{ key, filename, version }`.
- `release` (optional): called after each request. Use it to release pooled drives or close resources.
- `port`, `host`, `anyPort`: standard network binding options. When `anyPort` is `true`, Serve Drive will retry with random ports on bind failure.
- `server`: supply an existing `http.Server` instance to reuse sockets or integrate with custom TLS handling.

## Methods

#### `await serve.ready()`

Waits for the underlying HTTP server to start listening. Call this before logging the address or accepting requests in tests.

#### `serve.address()`

Returns the listening address object (port, address, family) from Node.js `http.Server`.

#### `serve.getLink(filename, [options])`

Constructs an HTTP URL that points at `filename`. Useful for generating shareable links without rebuilding query strings.

```js
serve.getLink('/index.html', {
  https: false,
  host: 'drive.example.com:8080',
  key: drive2.key.toString('hex'),
  version: 0
})
```

- `https`: set to `true` to emit an `https://` URL.
- `host`: override the host/port segment (defaults to the local listener address).
- `key`: supply a drive identifier so the consumer does not need to append a query string manually.
- `version`: checkout a historic drive version before serving the file.

#### `await serve.suspend()`

Signals that the process is about to suspend and lets Serve Drive adjust internal resources (close listeners, persist state, etc.).

#### `await serve.resume()`

Reverses `suspend()` by rebinding the underlying HTTP server and preparing drives for fresh requests.

## HTTP Query Parameters

- `key`: selects which drive to use, e.g. `/filename?key=<id-or-key>`.
- `version`: checkouts a specific drive version, e.g. `/filename?version=<v>`.

## Next Steps

- Review the storage backends in [`hyperdrive-api.md`](hyperdrive-api.md) and [`localdrive-api.md`](localdrive-api.md).
- Combine Serve Drive with replication flows in [`../walkthroughs/hyperdrive-sync-walkthrough.md`](../walkthroughs/hyperdrive-sync-walkthrough.md).
