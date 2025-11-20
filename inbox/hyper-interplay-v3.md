# Hyper Interplay — the concise, agent‑friendly guide (v3)

This document explains how **Hypercore**, **Corestore**, **Hyperswarm**, **SecretStream**, and higher‑level modules (**Hyperbee**, **Hyperdrive**, **Autobase**) fit together. It reflects the current constraints: **Hyperswarm/Hypercore aren’t directly feasible in the browser without a relay**, and **Hyperswarm sockets are already SecretStream‑encrypted** (do **not** double‑wrap them).

---

## 0) Mental model (what talks to what)

```
[ Hyperswarm (DHT + hole‑punching) ]  -> emits ->  [encrypted duplex socket]
          |  topic = discoveryKey
          v
  replicate() <= any duplex stream => replicate()

        [ Corestore (1 per process) ]
           ├─ namespace('drive')  -> Hyperdrive
           ├─ namespace('bee')    -> Hyperbee (KV on a core)
           └─ namespace('base')   -> Autobase (multi‑writer)
```

**Identity & discovery**
- **Public key** = dataset identity / verification.
- **Discovery key** = swarm topic (privacy‑preserving; derived from public key).

---

## 1) Invariants & best practices

1. **Hypercore is the centerpiece.** Everything rides on Hypercore. You *can* instantiate `new Hypercore(storage)` for ultra‑light, one‑shot use; in most apps you obtain cores from a **Corestore**.
2. **Exactly one Corestore per process.** Use `store.namespace(name)` / `store.session()` to isolate subsystems (drive, indexes, chat, etc.) while keeping a single replication pipeline.
3. **Replication is “just a stream.”** `core.replicate(...)`, `store.replicate(...)`, and higher‑level modules accept any **duplex** stream.
4. **Topic selection.** Use the resource’s **discoveryKey** as your Hyperswarm topic (peers that have this topic will find each other).

---

## 2) Transport & encryption (correct)

- **Hyperswarm sockets → replicate directly.**  
  The `connection` from `swarm.on('connection', (conn) => ...)` is already a **Noise‑encrypted** duplex stream. **Do not wrap it with SecretStream again.**

- **Non‑Hyperswarm transports (WebSocket/TCP/UDX/IPC) → wrap with SecretStream → replicate.**  
  When you build your own transport (e.g., a WebSocket bridge for browsers), wrap the raw duplex with `@hyperswarm/secret-stream` to get E2E encryption, then pass that to `store.replicate(secure)` or `core.replicate(secure)`.

- **Multiplexing with `@neonloom/plex` (or Protomux).**  
  Treat each substream like its own duplex. Optionally wrap **each substream** with SecretStream for isolation and key‑pinning.

---

## 3) Higher layers (built on Hypercore/Corestore)

- **Hyperbee**: sorted KV index on a single Hypercore — great for pointer/index tables.
- **Hyperdrive**: filesystem abstraction backed by Hypercores (metadata + blobs). Expects a **Corestore**, usually given a **namespace** so it can manage internal cores cleanly.
- **Autobase**: deterministic multiwriter combining multiple Hypercores. Also expects a **Corestore** (often namespaced).

**Practical pattern:** replicate a **root Corestore** over the swarm; the remote discovers it using the **topic = discoveryKey** and then replicates the loaded cores under that store.

---

## 4) Minimal recipes

### A) Corestore over Hyperswarm (already encrypted)
```js
import Hyperswarm from 'hyperswarm'
import Corestore  from 'corestore'

const store = new Corestore('./data')
const anchor = store.get({ name: 'root' })
await anchor.ready()

const swarm = new Hyperswarm()
swarm.on('connection', (conn) => {
  // conn is already Noise‑encrypted (SecretStream inside Hyperswarm)
  store.replicate(conn) // ✅ no extra wrapping needed
})

swarm.join(anchor.discoveryKey)
await swarm.flush()
```

### B) WebSocket bridge + SecretStream (non‑Hyperswarm)
```js
import Corestore     from 'corestore'
import SecretStream  from '@hyperswarm/secret-stream'
import websocket     from 'websocket-stream'  // or any duplex WS

const store = new Corestore('./data')
const ws = websocket('wss://relay.example.org/bridge') // duplex WS
const secure = new SecretStream(true, ws)               // E2E Noise
store.replicate(secure)
```

### C) Multiplexed substreams (e.g., `@neonloom/plex`)
```js
import Corestore from 'corestore'
import SecretStream from '@hyperswarm/secret-stream'
import { createPlex } from '@neonloom/plex'   // conceptual API

const store = new Corestore('./data')

function wire(parentSocket) {
  const plex = createPlex(parentSocket)
  const lane = plex.open('hyper/drive/1')     // a substream (duplex)

  // optional but recommended: per‑lane SecretStream for isolation
  const secureLane = new SecretStream(true, lane)
  store.replicate(secureLane)
}
```

**Tip:** Namespace stores per subsystem so Hyperdrive / Autobase can manage their internal cores without name collisions:
```js
import Hyperdrive from 'hyperdrive'
const driveStore = store.namespace('drive')
const drive = new Hyperdrive(driveStore)
```

---

## 5) Browser reality (and how to proceed)

- **Why it doesn’t run natively:** Hyperswarm relies on a DHT and a custom UDP transport (UDX) with hole‑punching; browsers don’t expose raw UDP/DHT or Node’s networking. SecretStream also assumes crypto primitives not universally available in the Web runtime.
- **Workable path:** run a **relay** (WebSocket/WebRTC) between the browser and a Node peer. Then **wrap the WS/WebRTC duplex with SecretStream end‑to‑end**. This keeps content private from the relay (it still sees metadata and can DoS).

**Security checklist for relays**
- Pin expected **remote public keys** and reject unknown peers.
- Prefer per‑substream SecretStreams when multiplexing to compartmentalize failures.
- Treat the relay as an untrusted transport; log and rate‑limit aggressively.

---

## 6) Your utilities

- **`@neonloom/neonuri`**: a uniform URI layer for Hyper resources (great for storing *pointers* in Hyperbee and dereferencing on demand).
- **`@neonloom/plex`**: multiplex a single socket into substreams (“threads”). Wrap lanes with SecretStream as needed and replicate different cores/drives independently.

---

## 7) Quick cues for agents

- **Open a root core** from the process‑wide Corestore, swarm on its `discoveryKey`, then replicate on each connection.
- **Namespace** the Corestore per subsystem (`'drive'`, `'bee'`, `'base'`).
- **Hyperswarm?** replicate the socket directly. **Not Hyperswarm?** SecretStream‑wrap first.
- **Browser?** bridge via WS/WebRTC + SecretStream; document the changed threat model.

---

## 8) Glossary

- **Hypercore**: append‑only, signed Merkle log; foundation for everything.
- **Corestore**: factory/manager for many Hypercores, with replication fan‑in.
- **Hyperswarm**: peer discovery + encrypted transports via HyperDHT/UDX.
- **SecretStream**: duplex Noise + libsodium — use standalone for non‑Hyperswarm streams.
- **Discovery key**: 32‑byte topic derived from a core’s public key; used for swarming.
- **Namespace/Session**: ways to safely reuse one Corestore across subsystems.

---

### Appendix: Why “1 Corestore per process”?
It reduces open files, simplifies replication (single stream handles all loaded cores), and lets you isolate modules with `namespace()` while still co‑replicating through the same pipeline.

