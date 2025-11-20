---
title: Dagify Encodings and Types
summary: Configure serialization, validation, and key generation for ReactiveNode values.
tags: [dagify, encodings, types, reference]
updated: 2025-10-18
audience: both
---

# Encodings in ReactiveNode

ReactiveNode supports flexible encoding and decoding so values can be serialised to buffers and restored later. Configure `valueEncoding` when you need durable storage, replication, or interoperable transports.

## Overview

- **Purpose:** Encode values into a binary form (typically a `Buffer`) when setting them and decode on retrieval.
- **Default:** When `valueEncoding` is `"any"` or omitted, the node stores raw values without encoding.
- **Library:** Dagify leans on [compact-encoding](https://github.com/mafintosh/compact-encoding) for its encoder catalogue.

## Built-in encodings

- **Raw encodings:** `raw.utf8`, `raw.ascii`, `raw.hex`, `raw.base64`, `raw.ucs2`, `raw.utf16le`.
- **Numeric encodings:** `uint`, `uint8`, `uint16`, `uint24`, `uint32`, `int`, `int8`, `int16`, `int24`, `int32`, `float32`, `float64`, `biguint64`, `bigint64`.
- **Buffers:** `buffer`, `binary`.
- **String helpers:** `string.fixed(10)` and similar factory encodings.
- **Composite structures:** Arrays, objects, and custom codecs assembled from the compact-encoding API.

## Constructing the encoding string

Encoding strings follow `<namespace>.<encoder>(args)` and are parsed by `getEncoder`.

- Optional `"cenc."` prefixes are ignored.
- Function-style segments (like `fixed(10)`) parse arguments—numbers convert automatically, nested encoders trigger lookups.

```js
const encodingStr = "string.fixed(10)";
const encoder = getEncoder(encodingStr);
```

## Using encodings

```js
import { createNode } from "./node/index.js";

const node = createNode({ name: "Alice", age: 30 }, null, {
  valueEncoding: "json"
});

node.set({ name: "Alice", age: 30 }); // stored as Buffer
console.log(node.value);              // decoded back into an object
```

Encodings apply on `set` and decode during `get`. If decoding fails, the getter throws so data corruption is never silent.

---

# Type Registry

Dagify exposes a global `types` registry that validates node values before they commit. Use it to catch mismatches early and enforce consistency across the graph.

## Overview

- **Registry:** `types` is a singleton `TypeRegistry`.
- **Validators:** Each type is a function returning truthy for valid values.
- **Defaults:** The registry ships with a spread of basic, integer, floating, and buffer validators.

```js
import { types } from "./lib/types/index.js";
```

### Default types

- **Basic:** `any`, `number`, `string`, `boolean`, `object`, `array`, `function`.
- **Integers:** `int`, `uint`, `int8/uint8`, `int16/uint16`, `int32/uint32`, `int64/uint64` (supports `bigint`).
- **Floats:** `float32`, `float64`.
- **Binary:** `buffer`, `binary`.

### Registering custom types

```js
types.registerType('email', value =>
  typeof value === 'string' && /\S+@\S+\.\S+/.test(value)
);

const emailNode = createNode("test@example.com", null, { type: "email" });
```

### Working with nodes

- Pass `type` in the node config.
- On each assignment the value is validated; failing validation raises an error.

### TypeRegistry API

- `registerType(name, validator)` – add a validator.
- `getType(name)` – retrieve a validator.
- `union(...typeNames)` – build a validator that passes if any listed type succeeds.
- `intersection(...typeNames)` – require every listed type to succeed.
- `createType(name, validator)` – sugar to define + register in one step.

### Global helper snippet

```js
import {TypeRegistry} from "./TypeRegistry.js";
import {includeDefaultTypes} from "./defaultTypes.js";

const types = new TypeRegistry();
types.registerType('any', () => true);
includeDefaultTypes(types);

const setType = (node, type) => {
  if (typeof type === "function") type = type(types);
  node.type = type;
  return node;
};

const getType = node => node.type || types.getType("any");
```

---

# Encodings vs. Types

Encodings and types address different concerns:

| Concern | Encodings | Types |
|---------|-----------|-------|
| Focus   | Data representation (binary form) | Data correctness (validation) |
| When    | On `set`/`get` to serialize & deserialize | On every assignment |
| Use     | Persisting, transmitting, or compacting values | Guaranteeing shape, range, or invariants |

### Why keep them separate?

- **Separation of concerns:** Encodings manage storage/transport; types enforce correctness.
- **Flexibility:** Expand serialization without touching validation (and vice versa).
- **Debugging clarity:** Serialization errors surface during encode/decode; validation errors surface during assignment.

### Combined scenarios

- Use encodings for persistence (`"json"`), types for validation (`"object"`).
- Validate numeric ranges via types, then encode with `uint32` or similar.

---

# Key generator utilities

Some Dagify graph helpers rely on 32-byte keys. The key generator module lets you manage default and custom functions.

## Module summary

- Imports `defaultKeyGenerator` from `./defaultKeyGenerator.js`.
- Stores custom generators in a `Map`.
- Ensures every generator returns a 32-byte `Buffer`.

### Public surface

- `currentKeyGenerator`: Exported variable representing the active generator (defaults to `defaultKeyGenerator`).
- `registerKeyGenerator(name, generator)`: Register a generator in the map.
- `useKeyGenerator(name)`: Switch the active generator to a registered one, or reset to default when falsy.
- `useKeyGeneratorWhile(name, cb)`: Temporarily switch generators during a callback, then restore the previous one.

```js
registerKeyGenerator("uuidGenerator", () => Buffer.alloc(32));

useKeyGenerator("uuidGenerator");
console.log(currentKeyGenerator());

useKeyGeneratorWhile("uuidGenerator", () => {
  console.log(currentKeyGenerator());
});
```

---

## Next Steps
- Review `node-catalog.md` for nodes (like `CommandNode`) that interact heavily with encodings and types.
- Pair encodings with `activity-thresholding.md` or `unbatched.md` when serialised values need tightly controlled emission cadence.
- Keep template prompts in `../templates/` updated so agents remember to choose sensible encodings and validators.
