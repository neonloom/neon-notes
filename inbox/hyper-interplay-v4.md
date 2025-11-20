# Hyper Interplay — exact wiring with Corestore, Hyperswarm, SecretStream, Hyperbee/Hyperdrive/Autobase, plus NeonURI & Plex (v4)

> **Goal:** A tight, reliable map of how the Hyper stack composes in practice — with exact behavior for **`@neonloom/plex`** and **`@neonloom/neonuri`** called out explicitly. Where a choice exists, we show the “agent default” and note alternatives. If a detail below is based on an assumption, see **Assumptions & Open Items** at the end.

---

## 0) At‑a‑glance (what talks to what)

```
[ keypair ]
   │
   ├─(derive topic)──► discoveryKey
   │
   ├─ Hyperswarm ──► (Noise‑encrypted Duplex socket) ──► store.replicate(socket)
   │                                     ^ already encrypted; do NOT wrap again
   │
   └─ WebSocket/TCP/IPC ──► SecretStream ──► store.replicate(secureDuplex)

               [ Corestore — 1 per process ]
                    ├─ namespace('drive')  → Hyperdrive
                    ├─ namespace('bee')    → Hyperbee (KV on a core)
                    └─ namespace('base')   → Autobase (multi‑writer)
```

- **Hyperswarm sockets are end‑to‑end (Noise) encrypted** and arrive as Duplex streams on `swarm.on('connection', (socket, info) => ...)` — pass them **directly** to `replicate(...)`. fileciteturn0file1  
- **Corestore** provides `replicate(stream)`, `namespace(name)`, and `session()`; use **one Corestore per process** and give subsystems their **own namespaces**. fileciteturn0file5  
- Use **`@hyperswarm/secret-stream`** only when your transport is **not** Hyperswarm (e.g., WebSocket bridges or plex substreams over WS): wrap the raw duplex to regain E2E before `replicate(...)`. (Encryption model corroborated by HyperDHT/Hyperswarm docs — Noise streams). fileciteturn0file0turn0file1

---

## 1) Discovery, keys, and topics

- A **public key** identifies a resource (core/drive/bee). A **discovery key** is a privacy‑preserving topic derived from that public key and is intended for swarming. fileciteturn0file3  
- **Hyperdrive** exposes `drive.discoveryKey` and explicitly recommends using it as a **Hyperswarm topic**; `drive.replicate(stream)` accepts any Duplex. fileciteturn0file2  
- **Hypercore** likewise supports `core.replicate(isInitiatorOrStream)`; you can give it **any** duplex stream (Hyperswarm socket or an encrypted custom one). fileciteturn0file3

---

## 2) Corestore is the center piece (with strict rule: 1 per process)

- Treat **Corestore as the orchestrator**: it loads cores (`store.get(...)`), **replicates all loaded cores** over a single stream (`store.replicate(...)`), and **scopes** components with `namespace()` or `session()`. This keeps resource counts low and replication simple. fileciteturn0file5  
- Typical layout:
  ```js
  const store = new Corestore('./data')
  const driveStore = store.namespace('drive')
  const beeStore   = store.namespace('index')
  const baseStore  = store.namespace('chat')
  ```
  Each subsystem gets its own derived Corestore while still sharing the **same underlying replication** stream(s). fileciteturn0file5

---

## 3) Transport paths (and when to encrypt)

### 3.1 Hyperswarm → already E2E

```js
import Hyperswarm from 'hyperswarm'
import Corestore  from 'corestore'

const store = new Corestore('./data')
const anchor = store.get({ name: 'root' })
await anchor.ready()

const swarm = new Hyperswarm()
swarm.on('connection', (socket) => store.replicate(socket)) // E2E Noise
swarm.join(anchor.discoveryKey)
await swarm.flush()
```
- `swarm.join(topic[, opts])` manages discovery; `flush()/flushed()` help gate initial announce/lookup. fileciteturn0file1  
- The `socket` here is **already Noise‑encrypted**; do **not** wrap with SecretStream again. fileciteturn0file1

### 3.2 Non‑Hyperswarm (WebSocket/TCP/etc.) → wrap with SecretStream

When you’re bridging over **WebSocket** (browser/node) or any custom Duplex, wrap the transport in an **E2E Noise stream** before calling `replicate(...)`:

```js
import Corestore     from 'corestore'
import SecretStream  from '@hyperswarm/secret-stream'
import websocket     from 'websocket-stream'

const store = new Corestore('./data')
const ws = websocket('wss://relay.example.org/bridge')
const secure = new SecretStream(true, ws) // E2E over the relay
store.replicate(secure)
```

- HyperDHT/Hyperswarm show the expected **Noise** model for connections; SecretStream is the general‑purpose Noise wrapper you apply to non‑Hyperswarm links. fileciteturn0file0turn0file1

### 3.3 Browser reality

- **Direct Hyperswarm/Hyperswarm‑backed Hypercore in a webpage isn’t feasible** in today’s environments (requires UDP/DHT + lower‑level crypto primitives). Use an **application‑level relay** (WS/WebRTC) and **re‑establish E2E** over it (SecretStream). This preserves content privacy; relays still see metadata. (Networking constraints implied by HyperDHT’s UDP/Noise design; confirmed in your research). fileciteturn0file0

---

## 4) Higher layers on top of Hypercore/Corestore

- **Hyperbee** is a sorted KV layer **on a Hypercore**; replication flows through the underlying feed’s `replicate(...)`. fileciteturn0file4  
- **Hyperdrive** is a versioned filesystem built on Hypercores; it **expects a Corestore**, exposes `drive.discoveryKey`, and supports `drive.replicate(stream)`. fileciteturn0file2  
- **Autobase** composes **multiple writer Hypercores** into a deterministic view (often a Hyperbee). It **replicates** via the same stream interface and provides lifecycle hooks (`open`, `apply`). fileciteturn0file6

**Agent default:** namespace the Corestore per tool (“drive”, “bee”, “base”) so each can manage internal cores independently while sharing replication plumbing. fileciteturn0file5

---

## 5) Exact behavior for `@neonloom/plex` (multiplexing)

**What Plex is:** a **Protomux channel helper** that yields **streamx `Duplex`** connections you can treat like sockets. It ships `listen/connect` channel wrappers, a **WebSocket → Duplex** adapter, and higher‑level helpers (peers, pools, RPC, services). fileciteturn0file8

**Canonical echo (TCP) example:**  
```js
import { listen, connect } from '@neonloom/plex'
import net from 'net'
import b4a from 'b4a'

const id = b4a.from([0x01, 0x02]) // channel id

const server = net.createServer((socket) => {
  const ch = listen({ stream: socket, id })
  ch.on('data', (buf) => ch.write(buf))   // echo
})
server.listen(4000)

const socket = net.connect(4000)
const client = connect({ stream: socket, id })
client.on('remote-open', () => client.write(b4a.from('hello')))
client.on('data', (buf) => console.log('echo:', buf.toString()))
```
**Key details to rely on:**  
- **Wait for `'remote-open'`** before sending to avoid dropping data.  
- Ships a **WebSocket stream wrapper** (`createWebSocketStream`) so browsers can participate in a multiplexed session. fileciteturn0file8

**Wiring to Hyper replication:**  
- If the **parent transport is Hyperswarm** (already E2E), you can replicate over **Plex substreams directly**:  
  ```js
  const ch = plex.open('drive') // yields a Duplex
  drive.replicate(ch)           // no extra wrap needed on Hyperswarm parents
  ```
- If the **parent transport is WS/TCP** (relay/untrusted), **wrap each Plex substream with SecretStream** to regain E2E per lane *before* calling `replicate(...)`.  
  This gives you **compartmentalized** encryption per logical channel. (Noise/E2E model per HyperDHT/Hyperswarm). fileciteturn0file8turn0file0turn0file1

**What Plex is not:** a crypto layer. It’s a **multiplexer**. Bring **SecretStream** when you’re not on Hyperswarm and you need E2E guarantees per channel. fileciteturn0file8

---

## 6) Exact behavior for `@neonloom/neonuri` (URIs & pointers)

**NeonURI** standardizes **URIs for Hyper resources** and gives you resolvers for **drive/bee/core**, including a **Hyperswarm resolver** and pointer‑key helpers for Hyperbee. fileciteturn0file7

- **Parse/validate/normalize**: `parseHyperUri`, `validateHyperUri`, `normalizeHyperUri`.  
- **Resolve** one or many pointers with telemetry: `resolveHyperUris(reference, { resolvers, autoSwarm, onAttempt, onResolution, ... })`.  
- **Default resolvers**: `createHyperResolvers({ storePath, swarmOptions, bootstrap, createSwarm })` → `{ drive, bee, core }`.  
- **Hyperswarm resolver**: `createHyperswarmResolver({ createSwarm, bootstrap, joinOptions, connectionTimeout, ... })`. fileciteturn0file7  
- **Pointer keys for Hyperbee**: `createPointerKeyEncoding()` injects a marker byte (`0xff`) so **pointer keys** can safely co‑exist with **data keys**. Use `~ptr/` for visible paths, and helpers like `encodePointerKey`, `isPointerPath`, `formatPointerPath`. fileciteturn0file7

**Pointer‑index pattern (sketch):**
```js
import Hyperbee from 'hyperbee'
import { formatPointerPath, createPointerKeyEncoding } from '@neonloom/neonuri'

const driveNs = store.namespace('drive')
const beeNs   = store.namespace('index')

const core = beeNs.get({ name: 'idx' })
const bee  = new Hyperbee(core, {
  keyEncoding: createPointerKeyEncoding('utf-8') // pointer‑aware
})

await bee.put(formatPointerPath('doc:alpha'),
  'drive://'+driveKey+'/docs/alpha.md') // store pointer
```
This gives you a stable **pointer graph** in Hyperbee while the underlying **Hyperdrive** holds the bytes. fileciteturn0file7

---

## 7) Common recipes (copy‑paste)

### 7.1 Replicate a **root Corestore** over Hyperswarm
```js
const swarm = new Hyperswarm()
swarm.on('connection', (socket) => store.replicate(socket))
swarm.join(anchor.discoveryKey)
await swarm.flush()
```
- Hyperswarm connections are **Noise‑encrypted Duplex** sockets. fileciteturn0file1

### 7.2 WS bridge (browser ↔ node) with E2E
```js
const ws = websocket('wss://relay.example.org/hyper')
const secure = new SecretStream(true, ws)  // E2E over the relay
store.replicate(secure)
```
- Rationale: Restore **E2E Noise** over a non‑Hyperswarm transport. fileciteturn0file0turn0file1

### 7.3 Multiplex with Plex (per‑lane isolation on WS)
```js
import { createWebSocketStream, connect } from '@neonloom/plex'
import SecretStream from '@hyperswarm/secret-stream'

const ws = new WebSocket('wss://relay.example.org/plex')
const parent = createWebSocketStream(ws)

const lane = connect({ stream: parent, id: toU8('drive') })
lane.on('remote-open', () => {
  const secureLane = new SecretStream(true, lane) // per‑lane E2E
  drive.replicate(secureLane)
})
```
- `createWebSocketStream` turns WS into a Duplex; `connect/listen` give you **per‑lane** Duplex streams. fileciteturn0file8

### 7.4 Hyperdrive quick sync
```js
const driveStore = store.namespace('drive')
const drive = new Hyperdrive(driveStore)
const done = drive.findingPeers()
swarm.on('connection', (s) => drive.replicate(s))
swarm.join(drive.discoveryKey)
swarm.flush().then(done, done)
```
- Hyperdrive exposes `discoveryKey`, `replicate(stream)`, and `findingPeers()`. fileciteturn0file2

### 7.5 Autobase — deterministic multiwriter
```js
const baseStore = store.namespace('chat')
const base = new Autobase(baseStore, /* bootstrap */, {
  open:  (s) => new Hyperbee(s.get('view')),
  apply: async (nodes, view) => { for (const n of nodes) await view.put(n.key, n.value) }
})
swarm.on('connection', (s) => base.replicate(s))
swarm.join(base.discoveryKey)
```
- Autobase composes writer cores into a deterministically applied **view**; it replicates via the same stream interface. fileciteturn0file6

---

## 8) Security notes (short list)

- **Don’t double‑wrap Hyperswarm.** Those sockets are already Noise‑encrypted. fileciteturn0file1  
- **Wrap non‑Hyperswarm** links (WS/TCP/plex-over-WS) with **SecretStream** to regain **E2E**. (Noise model per HyperDHT/Hyperswarm.) fileciteturn0file0turn0file1  
- **Compartmentalize** with `namespace()` and **per‑lane** SecretStreams when multiplexing over relays. fileciteturn0file5turn0file8

---

## 9) Quick glossary

- **Hypercore** — append‑only, signed Merkle log; `core.replicate(stream)` accepts any duplex; `discoveryKey` derived from `key`. fileciteturn0file3  
- **Corestore** — factory/orchestrator for many Hypercores; `namespace()`, `session()`, `replicate(stream)`. **One per process**. fileciteturn0file5  
- **Hyperswarm** — DHT‑backed discovery by **topic**; emits **Noise‑encrypted Duplex** sockets; `join()`, `flush()/flushed()`. fileciteturn0file1  
- **Hyperbee** — sorted KV on a Hypercore. fileciteturn0file4  
- **Hyperdrive** — versioned filesystem on Hypercores; `discoveryKey`, `replicate()`, `findingPeers()`. fileciteturn0file2  
- **Autobase** — deterministic multiwriter log → view (often Hyperbee); `replicate()`, `open/apply` hooks. fileciteturn0file6  
- **HyperDHT** — the lower‑level DHT (UDP, hole punching, Noise streams) under Hyperswarm. fileciteturn0file0  
- **NeonURI** — URI grammar + resolvers for Hyper resources; pointer‑key helpers for Hyperbee. fileciteturn0file7  
- **Plex** — Protomux channel helper producing Duplex substreams; WS adapter; pools/RPC/services. fileciteturn0file8

---

## Assumptions & Open Items

1) **SecretStream usage on non‑Hyperswarm transports.** The docs you provided establish the **Noise/E2E** model for Hyperswarm/HyperDHT; I assume `@hyperswarm/secret-stream` is the canonical userland wrapper to reproduce that model over WS/TCP. If you standardize a different wrapper, we can swap it 1:1. fileciteturn0file0turn0file1  
2) **Per‑lane E2E on Plex over WS.** Plex is a pure multiplexer; I recommend **wrapping each Plex channel with SecretStream** when the parent transport is a relay. This gives compartmentalized E2E and key‑pinning per lane. If you prefer a **single SecretStream at the parent** (and plaintext lanes), one wrap at the parent is also viable but changes failure isolation. fileciteturn0file8  
3) **Browser stance.** Based on HyperDHT’s UDP/Noise design and your own research, the doc states that a **native** browser stack is not feasible today without relaying. If you adopt a WebRTC‑based relay, this section will gain concrete dialers and STUN/TURN guidance. fileciteturn0file0  
4) **NeonURI resolver defaults.** I mapped the primary flows using the functions listed (`createHyperResolvers`, `createHyperswarmResolver`, pointer encodings). If you have different defaults (timeouts, bootstrap, codec), I’ll incorporate those into the examples. fileciteturn0file7  
5) **Drive mirroring & “port proxy” examples.** Mirroring is shown at a high level; if you want the exact mirror primitive (`drive.mirror(...)`) wired in, I can expand that snippet. For port tunneling, if you want a first‑class recipe we can add one using a small TCP proxy over a replicated stream. fileciteturn0file2

---

### Appendix: Where each claim comes from
- Hyperswarm sockets are **Noise‑encrypted Duplex**; `join/flush` & connection model. fileciteturn0file1  
- Corestore namespace/session/replicate; “many cores, one stream”. fileciteturn0file5  
- Hyperdrive `discoveryKey`, `replicate(stream)`, `findingPeers()`. fileciteturn0file2  
- Hypercore `replicate(isInitiatorOrStream)`. fileciteturn0file3  
- Hyperbee on Hypercore; replicate via feed. fileciteturn0file4  
- Autobase multiwriter + replicate hooks. fileciteturn0file6  
- HyperDHT: UDP + Noise streams. fileciteturn0file0  
- NeonURI API and pointer helpers. fileciteturn0file7  
- Plex: channel Duplex, `'remote-open'`, WS adapter, pools/RPC/services. fileciteturn0file8
