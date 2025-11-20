# Swarm ↔ Hypercore Interplay (Node‑first) — v6

**Scope**: Practical wiring between **Hyperswarm** and **Hypercore/Corestore**.  
**Non‑goals**: deep feature tours of Hyperdrive/Hyperbee/Autobase, NeonURI pointer semantics, or Plex RPC/pools — these appear only where they affect **swarm↔core** replication. If you need them, see the “Appendix pointers” at the end.

---

## 0) Mental model

```
[ HyperDHT (UDP hole‑punch + Noise) ] -> [ Hyperswarm ]
           | topic = 32‑byte Buffer                    -- emits -->  [Noise‑encrypted Duplex socket]
           v
    peers discover/join topics                                    |
                                                                   v
                                        replicate()  <— any duplex stream —>  replicate()

                        [ Corestore (ONE per process) ]
                           ├─ get()                     -> Hypercore
                           ├─ namespace('drive')        -> Hyperdrive
                           └─ namespace('base'/'bee')   -> Autobase / Hyperbee
```

- Hyperswarm hands you an **end‑to‑end Noise‑encrypted Duplex socket** in `swarm.on('connection')` — pipe it **directly** into `replicate(...)`. No extra wrapping. fileciteturn0file1  
- **Corestore** orchestrates many cores and offers **one replication stream** that **co‑replicates** all loaded cores (including ones opened later). Keep **exactly one Corestore per process** and isolate sub‑apps with `namespace()` or `session()`. fileciteturn0file5  
- Hypercore/drive/base all accept **“any duplex”** via their `replicate(...)` APIs. fileciteturn0file3turn0file2turn0file6

---

## 1) Discovery keys and topics

- Use a resource’s **discoveryKey** as your swarm topic (32 bytes). This preserves privacy vs. public keys and is standard for drives/cores/bases. fileciteturn0file2turn0file3
- Hyperswarm’s `join(topic, { server, client })` locates peers; `flush()/flushed()` gates announce/lookup cycles. fileciteturn0file1

---

## 2) Transport decision matrix (Node vs Browser)

| Runtime | Transport you have | Encryption state | Feed into `replicate(...)`? | Notes |
|---|---|---|---|---|
| **Node** | **Hyperswarm socket** | **Already Noise E2E** | **Yes — use as‑is** | Do **not** wrap again. fileciteturn0file1 |
| **Node** | Raw TCP/IPC/etc. | Plain | **Optional** (app‑choice) | If you need E2E akin to Hyperswarm’s Noise, wrap with your secure channel in Node, then pass the duplex to `replicate(...)`. fileciteturn0file3 |
| **Browser** | WebSocket/WebRTC to a relay | Plain/TLS | **No (replication)** | **Browsers cannot run Hyperswarm/HyperDHT** and **SecretStream is not available**; do **not** forward Corestore/Hypercore replication streams. Terminate replication in Node; relay only *application‑level* data (e.g., file reads) to the browser. fileciteturn0file0 |

> Browser reality: HyperDHT uses UDP + Noise handshakes/hole‑punching; these primitives are not exposed to webpages. Treat browser links as **content relays**, not replication transports. fileciteturn0file0

---

## 3) Corestore at the center (auto‑replication)

Once a Corestore is replicating over a duplex, **all cores/sessions derived from it will replicate**, including those created in the future:

```js
swarm.on('connection', socket => corestore.replicate(socket)) // one line to rule them all

new Hyperdrive(corestore.namespace('cool-drive'))   // replicated
new Hyperbee(corestore.get('db'))                   // replicated
corestore.get({ name: 'core' })                     // replicated
corestore.namespace('a').namespace('b').namespace('c')
  .get({ name: 'core' })                            // replicated
```
This matches Corestore’s “all‑to‑all + dynamic additions” replication semantics. Keep **one** Corestore per process; use `namespace()`/`session()` for isolation. fileciteturn0file5

---

## 4) Minimal, correct recipes

### A) Replicate Corestore by a root “anchor” core (Node)

```js
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'

const store = new Corestore('./data')
const anchor = store.get({ name: 'root' })
await anchor.ready()

const swarm = new Hyperswarm()
swarm.on('connection', (conn) => store.replicate(conn)) // Noise E2E already
swarm.join(anchor.discoveryKey)  // topic = 32‑byte discovery key
await swarm.flush()
```
Hyperswarm emits encrypted Duplex sockets; Corestore co‑replicates everything loaded. fileciteturn0file1turn0file5

### B) Hyperdrive swarming pattern (just the bits that touch swarm/core)

```js
import Hyperdrive from 'hyperdrive'

const drive = new Hyperdrive(store.namespace('drive'))
const done = drive.findingPeers()
swarm.on('connection', (s) => drive.replicate(s))
swarm.join(drive.discoveryKey)
swarm.flush().then(done, done)
```
Drive exposes `discoveryKey` and accepts any Duplex for replication. fileciteturn0file2

### C) Autobase (corrected) — view on Hyperbee + writer management

```js
import c from 'compact-encoding'
import Autobase from 'autobase'
import Hyperbee from 'hyperbee'

const json = c.json, utf8 = c.utf8
const base = new Autobase(store.namespace('chat'), /* bootstrap */ null, {
  open: (s) => new Hyperbee(s.get('view'), {
    extension: false, valueEncoding: json, keyEncoding: utf8
  }),
  apply: async (nodes, view, host) => {
    for (const { value } of nodes) {
      if (value?.addWriter) { await host.addWriter(value.addWriter, { indexer: true }); continue }
      if (value?.key != null) await view.put(value.key, value)
    }
  },
  valueEncoding: json
})
await base.ready()

swarm.on('connection', (s) => base.replicate(s))
swarm.join(base.discoveryKey)
await swarm.flush()
```
Autobase uses `open(store)` and `apply(nodes, view, host)`; manage writers via `host.addWriter/removeWriter/ackWriter`. Replication is the same duplex model. fileciteturn0file6

---

## 5) Browser patterns that **do not** break the model

- **Do**: Keep replication on Node. From Node, stream **content** to the browser (e.g., `drive.createReadStream('/file')`) or multiplex **app‑level** lanes using Plex over WS. fileciteturn0file2turn0file8  
- **Do not**: Proxy Corestore/Hypercore replication to a webpage. SecretStream is not browser‑available; forwarding unencrypted replication is discouraged (only between **trusted endpoints** like TLS/WebRTC with explicit policy). fileciteturn0file0

**Tiny Plex sketch (content lane over WS):**
```js
import { createWebSocketStream, connect } from '@neonloom/plex/ws'
const ws = new WebSocket('wss://relay.example/plex')
const parent = createWebSocketStream(ws)

const lane = connect({ stream: parent, id: toU8('files') })
lane.on('remote-open', () => lane.write(utf8.encode(JSON.stringify({ op: 'get', path: '/readme.md' }))))
// Node side: read message, do drive.createReadStream(path), pipe chunks back over `lane`
```
Plex is a **multiplexer** (not crypto). Always wait for `'remote-open'` before writing. fileciteturn0file8

---

## 6) Operational cues (for agents)

- **Wire once**: `swarm.on('connection', s => store.replicate(s))`. Open whatever cores/namespaces you need; they’ll piggyback. fileciteturn0file5  
- **Topics**: Use each resource’s `discoveryKey`. Gate with `flush()/flushed()` when you need deterministic “connected now” points. fileciteturn0file1turn0file2  
- **No double crypto** on Hyperswarm sockets. They’re already Noise E2E. fileciteturn0file1  
- **Browser**: treat as a **viewer/actor** on content, not a replication peer. fileciteturn0file0

---

## Appendix pointers (off‑topic here, but useful later)

- **Hypercore details**: append/get/streams; `core.replicate(isInitiatorOrStream)` takes any duplex. fileciteturn0file3  
- **Hyperbee reference**: KV on a single core; replication via the underlying feed. fileciteturn0file4  
- **Autobase reference**: multiwriter lifecycle, `host.*` writer controls, optimistic blocks, acks. fileciteturn0file6  
- **NeonURI**: parsing/validating Hyper URIs, resolvers (Corestore/Hyperswarm), pointer‑key encoding helpers (`~ptr/`). fileciteturn0file7
