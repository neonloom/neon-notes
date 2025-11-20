# Hyperswarm: LLM‑Ready Playbook (No Infinite Waits)

**Audience:** LLM coding agents (JavaScript, no TypeScript). **Runtime:** ESM (`"type":"module"` in `package.json`).
**Goal:** Prevent infinite waits by enforcing deterministic connect/exit behavior with Hyperswarm/HyperDHT. Use lightweight deps (`sodium-native`, `b4a`, optional `hyperswarm-crypto`) and avoid Node core crypto/Buffer.

---

## 0) Golden Rules (must follow)

1. **Never wait indefinitely.** Every network await is timeout‑gated (topic announce, swarm flush *if used*, first connection, handshakes).
2. **Correct order:** `swarm.join(topic,{server,client})` → if `server` then `await discovery.flushed()` → (optional) `await swarm.flush()` when you explicitly want to wait for pending connects/announces (useful in tests). **There is no `swarm.ready()`.**
3. **Roles (v3+):** Use **`server`/`client`** (formerly announce/lookup). At least one **server** must exist for each topic.
4. **Topic is 32 bytes.** Hash a string with **BLAKE2b‑256** via `sodium-native` (or `hyperswarm-crypto`).
5. **No peers is valid.** If no connection arrives within the deadline, return `{status:'no-peers'}` or exit 0 with a clear message—**never spin**.
6. **Assume network prereqs are satisfied** unless explicitly asked to diagnose NAT/VPN/UDP. Don’t speculate.
7. **Log inputs** (mode, topic preimage, bootstrap list) and **destroy on exit** (`swarm.destroy()`; tear down streams; trap SIGINT/SIGTERM).

---

## 1) One‑shot "connect or finish" (deterministic)

> ESM + `sodium-native` + `b4a`. Uses `discovery.flushed()` when `server`; `swarm.flush()` is optional (handy in tests). Implements app‑level idle timer (Hyperswarm streams are not `net.Socket`).

```js
// minimal-once.mjs
import Hyperswarm from 'hyperswarm'
import sodium from 'sodium-native'
import b4a from 'b4a'

const TOPIC_STR  = process.env.TOPIC   ?? 'cpc:neonloom:default'
const MODE       = process.env.MODE    ?? 'both'   // 'server' | 'client' | 'both'
const TIMEOUT_MS = Number.parseInt(process.env.TIMEOUT ?? '15000', 10)
const HOLD_MS    = Number.parseInt(process.env.HOLD    ?? '1000', 10)
const BOOTSTRAP  = (process.env.BOOTSTRAP ?? '').split(',').map(s => s.trim()).filter(Boolean)

function topicFromString (str){ const out=b4a.alloc(32); sodium.crypto_generichash(out,b4a.from(str)); return out }
const topic = topicFromString(TOPIC_STR)
const swarm = new Hyperswarm({ bootstrap: BOOTSTRAP.length ? BOOTSTRAP : undefined })
const failAfter = (ms,label)=> new Promise((_,rej)=>setTimeout(()=>rej(new Error(`${label} timeout ${ms}ms`)),ms))

async function joinOnce({server,client}){
  const discovery = swarm.join(topic,{server,client})
  if (server) await Promise.race([discovery.flushed(), failAfter(TIMEOUT_MS,'discovery.flushed()')])
  // Optional in prod, useful in tests:
  // await Promise.race([swarm.flush(), failAfter(TIMEOUT_MS,'swarm.flush()')])
}

function installSignals(cleanup){ process.on('SIGINT',()=>cleanup(0)); process.on('SIGTERM',()=>cleanup(0)) }

async function main(){
  const server = MODE==='server'||MODE==='both'
  const client = MODE==='client'||MODE==='both'
  const streams = new Set()
  let idle=null; const reset=()=>{ if(idle) clearTimeout(idle); idle=setTimeout(()=>{ for(const s of streams) try{s.destroy()}catch{} }, TIMEOUT_MS) }
  const cleanup=(code=0)=>{ if(idle) clearTimeout(idle); for(const s of streams){ try{s.destroy()}catch{} } swarm.destroy().then(()=>process.exit(code)) }
  installSignals(cleanup)

  swarm.on('connection',(stream)=>{ streams.add(stream); reset(); stream.on('data',reset); stream.on('close',()=>streams.delete(stream)); try{ stream.write(b4a.from('hello')) }catch{} })

  try{ await joinOnce({server,client}) } catch(e){ console.error('[fatal]',e.message); return cleanup(1) }

  Promise.race([
    new Promise(res=>swarm.once('connection',()=>res('connected'))),
    failAfter(TIMEOUT_MS,'no-peers')
  ]).then(async status=>{ if(status==='connected'){ await new Promise(r=>setTimeout(r,HOLD_MS)); console.log('[result] connected') } else { console.log('[result] no-peers') } cleanup(0) })
}

main()
```

---

## 2) Long‑running multi‑peer manager (pool)

> Keeps running, tracks many peers, prunes idle ones, and never hangs: all waits are bounded. Good default for agents/services.

**Behavior:**

* Joins once, awaits `discovery.flushed()` if `server`.
* Maintains a **peer pool** (`Map<peerId, stream>`), bounded by `MAX_PEERS`.
* Sends periodic **pings** every `PING_MS`; if no data seen for `PEER_IDLE_MS`, the stream is closed.
* Emits structured status logs: `join`, `peer:add`, `peer:drop`, `pool:size`, `tick`.

```js
// swarm-pool.mjs
import Hyperswarm from 'hyperswarm'
import sodium from 'sodium-native'
import b4a from 'b4a'

const TOPIC_STR   = process.env.TOPIC     ?? 'cpc:neonloom:pool'
const MODE        = process.env.MODE      ?? 'both'   // 'server' | 'client' | 'both'
const MAX_PEERS   = Number.parseInt(process.env.MAX_PEERS  ?? '64', 10)
const PING_MS     = Number.parseInt(process.env.PING_MS    ?? '15000', 10)
const PEER_IDLE_MS= Number.parseInt(process.env.PEER_IDLE  ?? '60000', 10)
const BOOTSTRAP   = (process.env.BOOTSTRAP ?? '').split(',').map(s=>s.trim()).filter(Boolean)
const TIMEOUT_MS  = Number.parseInt(process.env.TIMEOUT    ?? '15000', 10)

function topicFromString (str){ const out=b4a.alloc(32); sodium.crypto_generichash(out,b4a.from(str)); return out }
const topic = topicFromString(TOPIC_STR)
const swarm = new Hyperswarm({ bootstrap: BOOTSTRAP.length ? BOOTSTRAP : undefined })
const failAfter=(ms,label)=>new Promise((_,rej)=>setTimeout(()=>rej(new Error(`${label} timeout ${ms}ms`)),ms))

async function joinPool({server,client}){
  console.log('[join]',{MODE,TOPIC_STR,MAX_PEERS,PING_MS,PEER_IDLE_MS})
  const discovery = swarm.join(topic,{server,client})
  if (server) await Promise.race([discovery.flushed(), failAfter(TIMEOUT_MS,'discovery.flushed()')])
}

const peers = new Map() // id -> { stream, lastSeen }
const makeId = (s)=> (s.remotePublicKey ? b4a.toString(s.remotePublicKey,'hex').slice(0,12) : Math.random().toString(16).slice(2,10))

function addPeer(stream){
  if (peers.size >= MAX_PEERS) { stream.destroy(); return }
  const id = makeId(stream)
  peers.set(id,{ stream, lastSeen: Date.now() })
  console.log('[peer:add]',id,'size=',peers.size)
  stream.on('data',()=>{ const p=peers.get(id); if(p){ p.lastSeen=Date.now() } })
  stream.on('close',()=>{ peers.delete(id); console.log('[peer:drop]',id,'size=',peers.size) })
  try{ stream.write(b4a.from('hello')) }catch{}
}

swarm.on('connection', addPeer)

// Ping/GC loop (single interval; no unbounded timers)
setInterval(()=>{
  const now=Date.now()
  for (const [id,p] of peers){
    if (now - p.lastSeen > PEER_IDLE_MS) {
      try{ p.stream.destroy() }catch{}
      peers.delete(id)
      console.log('[peer:idle-drop]',id,'size=',peers.size)
      continue
    }
    try{ p.stream.write(b4a.from('ping')) }catch{}
  }
  console.log('[tick] pool:size',peers.size)
}, PING_MS).unref()

// Entry
;(async () => {
  const server = MODE==='server'||MODE==='both'
  const client = MODE==='client'||MODE==='both'
  try{ await joinPool({server,client}) } catch(e){ console.error('[fatal]',e.message); process.exit(1) }
})()

process.on('SIGINT', ()=> swarm.destroy().then(()=>process.exit(0)))
process.on('SIGTERM',()=> swarm.destroy().then(()=>process.exit(0)))
```

**Notes:**

* The pool **does not call `swarm.flush()`** in normal operation; it is generally unnecessary outside tests.
* All periodic work is bounded (single `setInterval` with `.unref()` so the process can still exit).
* Peers exceeding `MAX_PEERS` are rejected early to avoid resource churn.

---

## 3) Copy‑paste helpers

**Topic from string (BLAKE2b‑256):**

```js
import sodium from 'sodium-native'
import b4a from 'b4a'
export function topicFromString (str){ const out=b4a.alloc(32); sodium.crypto_generichash(out,b4a.from(str)); return out }
```

**First‑peer or timeout (one‑shot):**

```js
const failAfter=(ms,label)=>new Promise((_,rej)=>setTimeout(()=>rej(new Error(`${label} timeout ${ms}ms`)),ms))
await Promise.race([
  new Promise(res=>swarm.once('connection',()=>res('connected'))),
  failAfter(15000,'no-peers')
])
```

**Server join with announce gate:**

```js
const discovery = swarm.join(topic,{server:true, client:false})
await discovery.flushed() // gate with a timeout as needed
```

---

## 4) FAQ (short)

* **Why am I not using `swarm.ready()`?** Because it doesn’t exist in Hyperswarm. Use `discovery.flushed()` for topic announce; `swarm.flush()` is optional and mainly useful in tests.
* **Can a single process with `both` find itself?** Don’t rely on it. Run at least one distinct `server` process.
* **Should I always call `swarm.flush()`?** No. Use it when you intentionally want to block until all pending discovery/connect work is flushed (e.g., CI), otherwise skip it.

