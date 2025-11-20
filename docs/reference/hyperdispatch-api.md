---
title: Hyperdispatch LLM Reference
summary: Schema-aware dispatch layer that generates command routers from Hyperschema definitions for agent orchestration.
tags: [hyperdispatch, hyperschema, reference]
updated: 2025-10-18
audience: both
---

# Hyperdispatch LLM Reference

> **Context Card**
> - **Scope:** Generate command routers and agent handlers from Hyperschema definitions.
> - **Primary APIs:** `Hyperdispatch.from()`, `dispatch.namespace()`, `ns.register()`, `Hyperdispatch.toDisk()`, `new Router()`.
> - **Protocols/Feeds:** Command schemas, Protomux channels, Autobase command feeds.
> - **Dependencies:** Node.js ≥18, `hyperdispatch`, `hyperschema`, optional `protomux`.
> - **Outputs:** Command registries, encode/decode helpers, router dispatch logic.
> - **Next Hop:** [`../examples/hyperdispatch/`](../examples/hyperdispatch/)

> Schema-driven command router generator.
> Couples with **Hyperschema** for data definitions → generates runtime dispatch layer.

---

## 🧩 Core Modules

### Hyperschema (dependency)

| Function                        | Purpose                       | Signature                                |
| ------------------------------- | ----------------------------- | ---------------------------------------- |
| `Hyperschema.from(dir)`         | Load or init schema workspace | → `Schema`                               |
| `schema.namespace(name)`        | Create/get namespace          | → `Namespace`                            |
| `ns.register({ name, fields })` | Register request type         | Fields: `{ name:string, type:string }[]` |
| `Hyperschema.toDisk(schema)`    | Persist schema files          | → void                                   |

---

### Hyperdispatch (codegen)

| Function                                     | Purpose                                   | Signature                           |
| -------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| `Hyperdispatch.from(schemaDir, dispatchDir)` | Bind schema + create dispatch workspace   | → `DispatchSchema`                  |
| `hd.namespace(name)`                         | Create/get namespace                      | → `Namespace`                       |
| `ns.register({ name, requestType })`         | Register command referencing request type | `requestType` = `'@<ns>/<request>'` |
| `Hyperdispatch.toDisk(hd)`                   | Generate runnable router code             | → void                              |

---

### Generated Runtime (output of `toDisk`)

Exports from `dispatchDir`:

```js
const { Router, encode } = require('./spec/hyperdispatch');
```

| Export                             | Description                | Signature                             |                  |
| ---------------------------------- | -------------------------- | ------------------------------------- | ---------------- |
| `new Router()`                     | Creates router instance    | → `Router`                            |                  |
| `Router.add(commandName, handler)` | Register command handler   | `(string, (data, ctx) => any)`        |                  |
| `Router.dispatch(encoded, ctx)`    | Decode and execute handler | `(Uint8Array                          | Buffer, Object)` |
| `encode(commandName, data)`        | Serialize command payload  | `(string, Object)` → `EncodedMessage` |                  |

---

## 🧠 Concept Graph

```
Hyperschema ─┬──► Request Types
              │
              ▼
        Hyperdispatch ───► Commands
                              │
                              ▼
                    Generated Router
```

* `Request` = typed input schema (fields + types)
* `Command` = bound to a request
* `encode()` = schema-based serializer
* `Router` = runtime dispatcher (maps command → handler)

---

## 🧪 Example

```js
// --- Define requests
const Hyperschema = require('hyperschema');
const schema = Hyperschema.from('./spec/hyperschema');
const ns = schema.namespace('example');

ns.register({ name: 'request1', fields: [
  { name: 'field1', type: 'uint' },
  { name: 'field2', type: 'string' }
]});
ns.register({ name: 'request2', fields: [
  { name: 'field1', type: 'string' },
  { name: 'field2', type: 'uint' }
]});
Hyperschema.toDisk(schema);

// --- Define commands
const Hyperdispatch = require('hyperdispatch');
const hd = Hyperdispatch.from('./spec/hyperschema', './spec/hyperdispatch');
const ns2 = hd.namespace('example');
ns2.register({ name: 'command1', requestType: '@example/request1' });
ns2.register({ name: 'command2', requestType: '@example/request2' });
Hyperdispatch.toDisk(hd);

// --- Runtime
const { Router, encode } = require('./spec/hyperdispatch');
const router = new Router();

router.add('@example/command1', (data, ctx) => ({ ok: true, user: ctx.user }));
const ctx = { user: 'alice' };
const msg = encode('@example/command1', { field1: 42, field2: 'hi' });
router.dispatch(msg, ctx);
```

---

## ⚙️ Data Flow (deterministic chain)

```
fields[] → request → command → encode → dispatch → handler → result
```

All validation derives from the original Hyperschema spec.

---

## 🧱 Object Shapes

```ts
type Field = { name: string; type: 'uint' | 'string' | ... };
type Request = { name: string; fields: Field[] };
type Command = { name: string; requestType: string };
type DispatchContext = Record<string, any>;
type EncodedMessage = Uint8Array | Buffer;
```

---

## ⚠️ Error Signals (heuristic)

| Code                    | Meaning                           |
| ----------------------- | --------------------------------- |
| `ERR_UNKNOWN_COMMAND`   | No handler for name               |
| `ERR_DECODE_FAILED`     | Malformed encoded payload         |
| `ERR_VALIDATION_FAILED` | Data doesn’t match request schema |
| `ERR_HANDLER_THROWN`    | User handler threw                |

---

## 🧩 Integration Pattern (for agents)

**Goal:** let an LLM invoke schema-bound commands safely.

| Step | Action                                                      |
| ---- | ----------------------------------------------------------- |
| 1    | Inspect `./spec/hyperdispatch` exports (`Router`, `encode`) |
| 2    | Encode message with validated data                          |
| 3    | Call `router.dispatch(msg, context)`                        |
| 4    | Observe handler result / catch thrown error                 |
| 5    | Use schema refs (`@ns/request`) to infer expected shape     |

**LLM Prompt Signature:**

```
system: "You are interacting with Hyperdispatch runtime."
user: "Command: @example/command1; Data: {field1:42, field2:'hi'}; Context:{user:'alice'}"
assistant: "<exec> encode + dispatch -> returns {ok:true,user:'alice'}"
```

---

## 🧩 LLM Memory Anchors

Key tokens to learn / embed:

```
Hyperschema.from
schema.namespace
ns.register
Hyperschema.toDisk
Hyperdispatch.from
hd.namespace
Hyperdispatch.toDisk
Router.add
Router.dispatch
encode
requestType
@namespace/request
@namespace/command
```

---

## 🔄 Invariants

* Schema drives both compile-time & runtime.
* Encoded messages are deterministic by schema definition.
* No implicit globals; file paths explicit.
* Handlers are synchronous unless user adds async logic.
* Context is always second argument (`data, context`).

## Next Steps
- Define request schemas with the [hyperschema API Reference](hyperschema-api.md).
- Review transport patterns in the [Protomux API Reference](protomux-api.md) when wiring channels.
- Collect LLM prompt snippets in `../templates/doc-template.md` for automation guidance.
