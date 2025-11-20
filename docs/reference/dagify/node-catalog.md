---
title: Dagify Node Catalog
summary: Specialized Dagify nodes for bridging inputs, filtering streams, and wiring trigger pipelines.
tags: [dagify, nodes, reference]
updated: 2025-10-18
audience: both
---

# Dagify Node Catalog

Use this catalog when you need to reach for Dagify’s higher-level node helpers. Every section assumes familiarity with the base APIs in `core-api.md` and calls out interactions with batching, encoding, and side-effect handling where relevant.

## BridgeNode

The `BridgeNode` is a specialized reactive node that acts as a mediator between an input node and an output node. It forwards incoming values to the input node while keeping its internal value synchronized with the output node's computed value.

### Overview

`BridgeNode` is implemented as a subclass of `ReactiveNode`. It serves two primary functions:

1. **Input forwarding:** When a new value is set on the `BridgeNode`, it immediately forwards this value to the designated input node.
2. **Value synchronization:** It subscribes to the output node to update its internal value with any new processed value produced by the output node. If an error occurs during recomputation, it fails silently without notifying subscribers.

### Constructor

```js
/**
 * Creates a new BridgeNode.
 *
 * @param {ReactiveNode} inputNode - The node where updates are fed.
 * @param {ReactiveNode} outputNode - The node that produces the final (processed) value.
 * @param {Object} [config] - Optional configuration.
 */
constructor(inputNode, outputNode, config = {})
```

#### Parameters

- **inputNode**: A `ReactiveNode` instance where the new values are fed. The `BridgeNode` forwards any value set to it into this node.
- **outputNode**: A `ReactiveNode` instance that computes and provides the processed value. The `BridgeNode` synchronizes its own value with this node.
- **config** (optional): An object allowing additional configuration. In the implementation, the `skip` property is forced to `1` to adjust the behavior inherited from `ReactiveNode`.

#### Initialization steps

1. **Call parent constructor:** The constructor calls `super(NO_EMIT, null, config)` using a static initial value (`null`) and setting `skip` to 1.
2. **Set initial value:** The internal value of the `BridgeNode` is immediately updated from the output node’s current value.
3. **Subscription:** It subscribes to the output node. On every new emission (`next` event), the internal value is updated with the latest value from the output node. Errors during recomputation are ignored (silent failure), and completion of the output node results in the `BridgeNode` also completing.

### Methods

#### `set(newValue)`

```js
set(newValue)
```

- **Value forwarding:** The new value is immediately passed to the input node via its `set` method.
- **Recomputation trigger:** A microtask (using `queueMicrotask`) is scheduled to force the output node to compute its new value.
- **Synchronous update:** After recomputation, the internal value of the `BridgeNode` is updated with the output node's current value.
- **Error handling:** Errors during output node computation are silently ignored, and no error is propagated to subscribers.
- **Return value:** A promise resolves on the next tick, ensuring asynchronous updates have been processed.

#### `complete()`

Wraps the standard completion flow by unsubscribing from the output node before calling `super.complete()`.

### Example

```js
import { BridgeNode } from './BridgeNode.js';
import { SomeInputNode, SomeOutputNode } from './nodes.js';

const inputNode = new SomeInputNode();
const outputNode = new SomeOutputNode();

const bridgeNode = new BridgeNode(inputNode, outputNode);

bridgeNode.subscribe({
  next(value) {
    console.log("New synchronized value:", value);
  },
  error(err) {
    console.error("Error:", err);
  },
  complete() {
    console.log("BridgeNode completed.");
  }
});

bridgeNode.set('example value');
```

## CommandNode

`CommandNode` handles external command payloads. It integrates optional data validation and mapping, processes incoming payloads using a provided handler function, and exposes both `set()` and `next()` to remain compatible with RxJS and Svelte stores.

### Overview

- **Purpose:** Process external command payloads with optional mapping and validation.
- **Handler:** A function that processes the incoming data. It can return a value directly or a promise.
- **Mapping:** A `map` function can transform incoming data before further processing.
- **Validation:** An optional `validator` ensures the data meets expected criteria, returning `{ valid: boolean, error?: Error }`.
- **Compatibility:** `next()` delegates to `set()`, making the node compatible with external observable contracts.
- **Batching:** Batching is disabled by default so every command processes immediately. Enable batching only if lossy commands are acceptable.

### Constructor

```js
constructor(commandName, handler, config = {})
```

- **commandName:** Unique identifier for the command.
- **handler:** Processes the incoming payload (sync or async).
- **config:** Optional object with `validator`, `map`, and `disableBatching`.

### Key APIs

- **`set(data)`**: Applies mapping, validates input, executes the handler, and emits the processed result unless it equals `NO_EMIT`.
- **`next(data)`**: Alias for `set(data)` to satisfy observable interfaces.
- **`_setValue(newValue, forceEmit)`**: Internal helper that suppresses emissions for `NO_EMIT`.

### Dispatcher helper

`createCommandNode(commandName, handler, config, context)` builds a node and wires it to a dispatcher so command events automatically call `node.set(payload)`.

### Example

```js
const validator = data =>
  typeof data.x === "number" && typeof data.y === "number"
    ? { valid: true }
    : { valid: false, error: new Error("Invalid vector2 format") };

const map = data => ({ x: Math.round(data.x), y: Math.round(data.y) });
const handler = async data => Math.hypot(data.x, data.y);

const cmdNode = createCommandNode("@player/position", handler, { validator, map });

cmdNode.set({ x: 3.2, y: 4.7 });
cmdNode.next({ x: 1, y: 1 });
```

## Filter Nodes

`createFilterNode(predicate, deps)` evaluates incoming values with a predicate and only emits those that pass.

- **Reactive filtering:** Applies `predicate(subject)` to each value.
- **Emission control:** Emits the original value when `true`; emits `NO_EMIT` when `false`.
- **Dependencies:** Provide dependencies so the node reevaluates when upstream transforms change.

```js
const isGreaterThan10 = value => typeof value === 'number' && value > 10;

const stateNode = createNode();
const filterNode = createFilterNode(isGreaterThan10, stateNode);

stateNode.next(15); // emits 15
stateNode.next(5);  // emits NO_EMIT and nothing propagates
```

## Sink Nodes

`createSinkNode(fnOrValue, dependencies, config)` creates a terminal consumer dedicated to side effects.

- **Purpose:** React to upstream changes by executing side effects (logging, I/O, API calls) while staying out of downstream dependency graphs.
- **Dependencies:** Accept a single dependency, an array, or an object mapping keys to dependencies.
- **Config:** Accepts the standard node configuration plus a forced `sink: true` flag to mark the node terminal.

```js
const dependencyNode = createNode(10);

const loggerSink = createSinkNode(([value]) => {
  console.log("Dependency updated:", value);
}, [dependencyNode]);

dependencyNode.set(42);
loggerSink.update();
```

Keep sink nodes out of upstream dependency lists so side effects never masquerade as pure computations.

## Trigger Nodes

Trigger helpers turn event streams into nodes that emit incremental counters regardless of payload repeatability.

### `trigger(sources, config)`

- **sources:** A single RxJS `Observable`, an array of observables, or a keyed object of observables.
- **config:** Accepts `disableBatching` (defaults to `true` so every event propagates).
- **Returns:** A `ReactiveNode` that increments on each emission.
- **Errors:** Throws if sources contain `ReactiveNode` instances or non-observable shapes.

```js
const click$ = fromEvent(document, "click");
const triggeredClick = trigger(click$);

triggeredClick.subscribe(value => console.log("Click count:", value));
```

Use `createTrigger()` when you want a plain `Subject` you can `.next()` manually.

### `triggerFromEvent(source, eventName, config)`

- Wraps DOM `EventTarget`s or Node.js `EventEmitter`s.
- Emits an incrementing counter per event, not the event payload itself.
- Accepts `onCleanup` to run when the final subscriber unsubscribes.

```js
const button = document.getElementById('save');

const triggerNode = triggerFromEvent(button, 'click', {
  onCleanup() {
    console.log('All subscribers unsubscribed; cleanup executed.');
  }
});
```

## NO_EMIT sentinel

`NO_EMIT` is a sentinel symbol used to suppress downstream emissions.

- **Purpose:** Defer emissions until a value is ready, skip redundant updates, and prevent incomplete dependency graphs from firing.
- **Behavior:** Any node set to `NO_EMIT` (or initialised with `undefined`/`null`) will not emit until a concrete value arrives.
- **Composites:** Composite nodes suppress output if any dependency is `NO_EMIT`.

```js
const state = createNode(NO_EMIT);

state.set(42);     // emits 42
state.set(NO_EMIT); // suppresses emission
state.set(100);    // emits 100
```

## Next Steps
- Pair node usage with batching guidance in `unbatched.md` when real-time behaviour is required.
- Review `side-effects.md` before wiring sinks or subscribers that talk to external systems.
- Use `activity-thresholding.md` when trigger-heavy nodes need smoothing before recomputation.
