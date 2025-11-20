---
title: HyperDHT Testnet Helper
summary: Spin up an isolated HyperDHT swarm for Hyperswarm integration tests, with support for ephemeral peers.
tags: [hyperdht, hyperswarm, testing, reference]
updated: 2025-03-06
audience: both
---

# HyperDHT Testnet Helper

> **Context Card**
> - **Scope:** Local DHT bootstrapping for Hyperswarm test suites.
> - **Primary APIs:** `createTestnet(size, opts?)`, `testnet.createNode(opts?)`, `testnet.destroy()`.
> - **Protocols/Feeds:** UDP/TCP HyperDHT discovery, Noise-encrypted Hyperswarm replication.
> - **Dependencies:** Node.js ≥18, `hyperdht`, optional `hyperswarm`.
> - **Next Hop:** [`../reference/hyperswarm-api.md`](hyperswarm-api.md), [`../reference/hyperdht-api.md`](hyperdht-api.md)

The helper below assembles a fully connected HyperDHT swarm for local testing. It creates a cluster of long-lived bootstrap nodes, then exposes helpers for attaching ephemeral peers — the mode Hyperswarm uses for short-lived clients. Copy the snippet into your test utilities (for example `test/support/testnet-helper.cjs`) and require it from your suites.

```js
// test/support/testnet-helper.cjs
const DHT = require('hyperdht') // or require('.') when vendoring inside the HyperDHT repo

module.exports = async function createTestnet(size = 10, opts = {}) {
  const swarm = []
  const teardown =
    typeof opts === 'function' ? opts : opts.teardown ? opts.teardown.bind(opts) : noop
  const host = opts.host || '127.0.0.1'
  const port = opts.port || 0
  const bootstrap = opts.bootstrap ? [...opts.bootstrap] : []
  const bindHost = host === '127.0.0.1' ? '127.0.0.1' : '0.0.0.0'

  if (size === 0) return new Testnet(swarm)

  const first = new DHT({
    ephemeral: false,
    firewalled: false,
    bootstrap,
    port,
    host: bindHost
  })

  await first.fullyBootstrapped()

  if (bootstrap.length === 0) bootstrap.push({ host, port: first.address().port })

  swarm.push(first)

  while (swarm.length < size) {
    const node = new DHT({
      ephemeral: false,
      firewalled: false,
      bootstrap,
      host: bindHost
    })

    await node.fullyBootstrapped()
    swarm.push(node)
  }

  const testnet = new Testnet(swarm, bootstrap)

  teardown(() => testnet.destroy(), { order: Infinity })

  return testnet
}

class Testnet {
  constructor(nodes, bootstrap = []) {
    this.nodes = nodes
    this.bootstrap = bootstrap
  }

  createNode(opts = {}) {
    const node = new DHT({
      ephemeral: true,
      bootstrap: this.bootstrap,
      host: '127.0.0.1',
      ...opts
    })

    this.nodes.push(node)

    return node
  }

  async destroy() {
    for (const node of this.nodes) {
      for (const server of node.listening) await server.close()
    }

    for (let i = this.nodes.length - 1; i >= 0; i--) {
      await this.nodes[i].destroy()
    }
  }

  [Symbol.iterator]() {
    return this.nodes[Symbol.iterator]()
  }
}

function noop() {}
```

## API Overview

```js
const createTestnet = require('./test/support/testnet-helper.cjs')

const testnet = await createTestnet(size?, opts?)
```

| Argument | Description |
| --- | --- |
| `size` | Number of non-ephemeral bootstrap nodes to start immediately (`default: 10`). |
| `opts.bootstrap` | Pre-populated bootstrap list; if omitted the helper seeds it with the first node’s address. |
| `opts.host` / `opts.port` | Bind address for bootstrap nodes (`default host: 127.0.0.1`, `default port: 0` -> random free port). |
| `opts.teardown(fn, meta?)` | Optional hook compatible with `t.teardown`/`test.after`; the helper registers `testnet.destroy()` with `order: Infinity`. |

When `size === 0`, you still receive a `Testnet` container, allowing test code to opt into manual node creation.

### `Testnet` helpers

* `testnet.nodes` – Array of DHT instances (persistent bootstrap nodes followed by any created peers).
* `testnet.bootstrap` – Bootstrap array you can feed into new DHT or Hyperswarm instances.
* `testnet.createNode(opts?)` – Spawns a new **ephemeral** DHT node bound to `127.0.0.1` and sharing the bootstrap list; pass overrides (e.g., `keyPair`, `ephemeral: false`) as needed.
* `await testnet.destroy()` – Closes listening sockets and tears down nodes in reverse order.
* `[...testnet]` – Iteration yields every DHT node in the swarm.

Ephemeral nodes do not announce themselves as potential bootstrap peers after they disconnect; they are ideal for simulating clients that appear during a test and vanish afterwards. The persistent nodes created via `size` stay online to guarantee stable routing.

## Type=Module Example

The helper is published as CommonJS, so `type: "module"` projects can load it via `createRequire` while still authoring the rest of the test in ESM. The example below spins up three bootstrap nodes, provisions an ephemeral DHT for Hyperswarm, and demonstrates topic discovery across two swarms.

```js
// test/hyperswarm-testnet.mjs
import { createRequire } from 'node:module'
import { once } from 'node:events'
import crypto from 'node:crypto'
import Hyperswarm from 'hyperswarm'

const require = createRequire(import.meta.url)
const createTestnet = require('../support/testnet-helper.cjs')

const testnet = await createTestnet(3, {
  teardown(addCleanup) {
    addCleanup(async () => {
      await testnet.destroy()
    })
  }
})

const topic = crypto.randomBytes(32)

// Attach an ephemeral DHT instance to each swarm so they share the isolated network.
const serverSwarm = new Hyperswarm({ dht: testnet.createNode() })
const clientSwarm = new Hyperswarm({ dht: testnet.createNode() })

serverSwarm.join(topic, { server: true, client: false })
await serverSwarm.flush()

clientSwarm.join(topic, { client: true, server: false })

const [socket] = await once(clientSwarm, 'connection')
console.log('Ephemeral peer connected via testnet', socket.remotePublicKey.toString('hex'))

// Clean up
socket.end()
await clientSwarm.destroy()
await serverSwarm.destroy()
await testnet.destroy()
```

Key points:

- **Ephemeral DHT instances** returned by `testnet.createNode()` mimic short-lived clients but still leverage the locally bootstrapped network.
- **Shared bootstrap** is automatic; you do not need to pass `bootstrap` or `host` unless customising bind behaviour.
- **Teardown orchestration** keeps the helper compatible with `brittle`, `ava`, `tap`, or any runner that accepts a `(fn, meta?)` signature.

## Usage Notes

- Prefer at least one non-ephemeral node (`size >= 1`) so the helper can seed the bootstrap list automatically.
- To observe routing behaviour, iterate through `[...testnet]` and inspect each node’s `address()` result.
- If tests run in parallel, give each suite its own helper instance — nodes bind to random ports unless you deliberately fix `opts.port`.

## Next Steps

- Revisit the [`HyperDHT API`](hyperdht-api.md) for low-level node controls.
- Combine with the [`Hyperswarm API`](hyperswarm-api.md) to layer topic discovery on top of the isolated test network.
