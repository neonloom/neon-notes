---
title: Swarm ↔ Hypercore Interplay
summary: Node-first wiring between Hyperswarm transports and Hypercore/Corestore/Autobase resources.
tags: [hyperswarm, hypercore, corestore, autobase, plex]
updated: 2025-10-21
audience: both
---

# Swarm ↔ Hypercore Interplay (Node-first) — v6

**Scope:** Practical wiring between Hyperswarm transports and Hypercore/Corestore (plus the common Hyperdrive/Hyperbee/Autobase stack).  
**Non-goals:** Exhaustive tours of Hyperdrive/Hyperbee/Autobase internals, NeonURI pointer semantics, or Plex pool management; those appear only where they influence swarm ↔ core replication. For ancillary topics, see the appendix pointers at the end.

---

## 0) Mental model

```
[ HyperDHT (UDP hole-punch + Noise) ] -> [ Hyperswarm ]
           | topic = 32-byte Buffer                    -- emits -->  [Noise-encrypted duplex socket]
           v
    peers discover/join topics                                    |
                                                                   v
                                        replicate()  <— any duplex stream —>  replicate()

                        [ Corestore (ONE per process) ]
                           ├─ get()                     -> Hypercore
                           ├─ namespace('drive')        -> Hyperdrive
                           └─ namespace('base'/'bee')   -> Autobase / Hyperbee
```

- Hyperswarm hands you an already Noise-encrypted duplex socket in `swarm.on('connection')`. Pipe it directly into `replicate(...)`—no extra wrapping.
- Corestore orchestrates many cores while exposing a single replication stream that co-replicates every loaded core (including ones opened later). Run exactly one Corestore per process; isolate sub-apps with `namespace()`/`session()`.
- Hypercore, Hyperdrive, Hyperbee, and Autobase all accept “any duplex” via their `replicate(...)` APIs.

---

## 1) Discovery keys and topics

- Use a resource’s `discoveryKey` as the swarm topic (32 bytes). This preserves privacy compared to public keys and is the default for drives/cores/bases.
- Hyperswarm’s `join(topic, { server, client })` locates peers; `flush()` or `flushed()` gates the announce/lookup cycle so you know when discovery is live.

---

## 2) Transport decision matrix (Node vs Browser)

| Runtime | Transport you have | Encryption state | Feed into `replicate(...)`? | Notes |
| --- | --- | --- | --- | --- |
| **Node** | Hyperswarm socket | Already Noise E2E | **Yes — use as-is** | Never re-wrap or double-encrypt these sockets. |
| **Node** | Raw TCP/IPC/etc. | Plain | Optional | If you need Hyperswarm-level E2E, wrap with your secure channel before calling `replicate(...)`. |
| **Browser** | WebSocket/WebRTC to a relay | Plain/TLS | **No** (for replication) | Browsers cannot run Hyperswarm/HyperDHT; SecretStream is unavailable. Terminate replication in Node and relay only application-level data to browsers. |

Browser reality: HyperDHT relies on UDP + Noise handshakes/hole-punching, which web runtimes do not expose. Treat browser links as content relays, not replication transports.

---

## 3) Corestore at the center (auto-replication)

Once a Corestore is replicating over a duplex, **all cores/sessions derived from it will replicate**, including those created later:

```js
swarm.on('connection', (socket) => corestore.replicate(socket)) // one line to rule them all

new Hyperdrive(corestore.namespace('cool-drive'))   // replicated
new Hyperbee(corestore.get('db'))                   // replicated
corestore.get({ name: 'core' })                     // replicated
corestore.namespace('a').namespace('b').namespace('c')
  .get({ name: 'core' })                            // replicated
```

This matches Corestore’s “all-to-all + dynamic additions” semantics. Keep one Corestore per process; use `namespace()` or `session()` for isolation.

---

## 4) Minimal, correct recipes

### A) Replicate Corestore via a root anchor core (Node)

```js
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'

const store = new Corestore('./data')
const anchor = store.get({ name: 'root' })
await anchor.ready()

const swarm = new Hyperswarm()
swarm.on('connection', (conn) => store.replicate(conn)) // Noise E2E already
swarm.join(anchor.discoveryKey)  // topic = 32-byte discovery key
await swarm.flush()
```

Hyperswarm emits encrypted duplex sockets; Corestore co-replicates everything loaded.

### B) Hyperdrive swarming pattern

```js
import Hyperdrive from 'hyperdrive'

const drive = new Hyperdrive(store.namespace('drive'))
const done = drive.findingPeers()
swarm.on('connection', (socket) => drive.replicate(socket))
swarm.join(drive.discoveryKey)
swarm.flush().then(done, done)
```

Hyperdrive exposes `discoveryKey` and accepts any duplex for replication.

### C) Autobase with Hyperbee view + writer management

```js
import c from 'compact-encoding'
import Autobase from 'autobase'
import Hyperbee from 'hyperbee'

const json = c.json
const utf8 = c.utf8

const base = new Autobase(store.namespace('chat'), /* bootstrap */ null, {
  open: (s) => new Hyperbee(s.get('view'), {
    extension: false,
    valueEncoding: json,
    keyEncoding: utf8
  }),
  apply: async (nodes, view, host) => {
    for (const { value } of nodes) {
      if (value?.addWriter) {
        await host.addWriter(value.addWriter, { indexer: true })
        continue
      }
      if (value?.key != null) await view.put(value.key, value)
    }
  },
  valueEncoding: json
})

await base.ready()

swarm.on('connection', (socket) => base.replicate(socket))
swarm.join(base.discoveryKey)
await swarm.flush()
```

Autobase uses `open(store)` and `apply(nodes, view, host)`; manage writers via `host.addWriter/removeWriter/ackWriter`. Replication still expects any duplex transport.

---

## 5) Browser patterns that keep the model intact

- **Do:** Keep replication inside Node. From the Node peer, stream **content** to browsers (for example, `drive.createReadStream('/file')`) or multiplex **app-level** lanes using Plex over WebSocket.
- **Do not:** Proxy Corestore/Hypercore replication streams into a webpage. SecretStream is unavailable, and forwarding unencrypted replication is discouraged except between trusted endpoints you fully control (for example, TLS/WebRTC with explicit policy).

**Tiny Plex sketch (content lane over WS):**

```js
import { createWebSocketStream, connect } from '@neonloom/plex/ws'
import { toU8, utf8 } from '@neonloom/plex/encoding'

const ws = new WebSocket('wss://relay.example/plex')
const parent = createWebSocketStream(ws)

const lane = connect({ stream: parent, id: toU8('files') })
lane.on('remote-open', () => {
  lane.write(utf8.encode(JSON.stringify({ op: 'get', path: '/readme.md' })))
})

// Node side: read message, call drive.createReadStream(path), pipe chunks back over `lane`
```

Plex is a multiplexer (not crypto). Always wait for `'remote-open'` before writing.

---

## 6) Operational cues (for agents)

- **Wire once:** `swarm.on('connection', (socket) => store.replicate(socket))`. Open whatever cores/namespaces you need; they’ll piggyback.
- **Topics:** Use each resource’s `discoveryKey`. Gate with `flush()`/`flushed()` when you need deterministic “connected now” points.
- **No double crypto:** Hyperswarm sockets are already Noise E2E; do not wrap them again.
- **Browser stance:** treat browsers as viewers/actors on content, not replication peers.

---

## Appendix pointers

- **Hypercore reference:** append/get/streams plus `core.replicate(isInitiator|stream)` semantics.
- **Hyperbee reference:** KV atop a single core; replication follows the underlying feed.
- **Autobase reference:** multiwriter lifecycle, `host.*` writer controls, optimistic blocks, acknowledgements.
- **NeonURI:** parsing/validating Hyper URIs and resolving pointers through Corestore/Hyperswarm.

Keep this sheet close (or include it in assistant prompts) whenever you need to reason about Hyperswarm ↔ Hypercore/Corestore interplay.
