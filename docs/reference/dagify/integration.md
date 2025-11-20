---
title: Dagify Integration Patterns
summary: How Dagify cooperates with RxJS, Svelte stores, and piped observables.
tags: [dagify, rxjs, svelte, integration]
updated: 2025-10-18
audience: both
---

# Dagify Integration Patterns

Use these notes to align Dagify’s stateful dependency graph with RxJS streams, Svelte stores, and other consumer frameworks.

## Dagify vs. RxJS: Water Analogy

Think of **Dagify** as a calm pool and **RxJS** as a flowing stream:

- **Dagify (pool):** Holds structured state until explicitly changed. Dependencies ripple updates only where needed.
- **RxJS (stream):** Pushes transient events downstream. If you do not capture an emission it is gone.

### Dagify traits

- Maintains a dependency graph so only affected nodes recompute.
- Values persist between updates.
- Ideal for composing state (agents, UI state, derived metrics).

```js
import { createNode } from "dagify";

const health = createNode(100);
const shield = createNode(50);
const effectiveHealth = createNode(() => health.value + shield.value, [health, shield]);

health.set(80);  // effectiveHealth updates to 130
shield.set(30);  // effectiveHealth updates to 110
```

### RxJS traits

- Handles push-based event streams (keyboard input, WebSocket messages).
- Emissions are transient and designed for transformation via operators.

```js
import { fromEvent } from "rxjs";
import { map, filter } from "rxjs/operators";

const keyPress$ = fromEvent(document, "keydown").pipe(
  map(event => event.key),
  filter(key => key === "ArrowUp")
);

keyPress$.subscribe(() => console.log("Player jumped!"));
```

### Working together

- Let RxJS streams feed Dagify nodes for structured state updates.
- Let Dagify nodes expose `.subscribe()` to push state into RxJS-powered transports.

```js
import { webSocket } from "rxjs/webSocket";
import { takeUntil, fromEvent, take } from "rxjs";
import { createNode, createSinkNode } from "dagify";

const gameServer$ = webSocket("wss://game-server.example");
const close$ = fromEvent(gameServer$.socket, "close").pipe(take(1));

const gameStateNode = createNode(null, gameServer$.pipe(takeUntil(close$)));

const playerActionNode = createSinkNode(action => gameServer$.next(action));

const playerX = createNode(0);
const playerY = createNode(0);
const playerPosition = createNode(([x, y]) => ({ x, y }), [playerX, playerY]);

playerPosition.subscribe(pos => playerActionNode.set({ type: "move", position: pos }));
```

## ReactiveNode vs. piped observables

A `ReactiveNode` is more than an RxJS observable—it carries lifecycle hooks, dependency management, and metadata.

- **Lifecycle control:** Call `compute()`, `update()`, and respond to hooks like `finalize`, `onSubscribe`, and `onUnsubscribe`.
- **Dependency APIs:** Use `setDependencies`, `addDependency`, and `removeDependency`.
- **Metadata:** Inspect `id`, `key`, `value`, and custom helpers.

When you call `node.pipe(...)`, you receive a plain RxJS observable that:

- Loses access to Dagify-specific methods and metadata.
- Cannot manipulate dependencies or trigger recomputation.
- Only exposes the standard RxJS subscription interface.

| Capability | ReactiveNode | `node.pipe(...)` result |
|------------|--------------|-------------------------|
| Lifecycle methods (`compute`, `update`) | ✅ | ❌ |
| Custom hooks (`finalize`, `onSubscribe`) | ✅ | ❌ (hidden in node) |
| Dependency management | ✅ | ❌ |
| Metadata (`id`, `key`, etc.) | ✅ | ❌ |

**Pattern:** keep a reference to the original node, then pipe it when you need operator composition.

```js
const node = createNode(initialValue, dependencies, {
  finalize(err) {
    if (err) console.error('Node finalized with error:', err);
  },
  onSubscribe(count) {
    console.log(`Subscribers: ${count}`);
  },
  onUnsubscribe(count) {
    console.log(`Remaining subscribers: ${count}`);
  }
});

const nodePiped = node.pipe(
  map(val => val * 2),
  filter(val => val > 10)
);

nodePiped.subscribe({
  next(value) {
    console.log('Piped value:', value);
  },
  error(err) {
    console.error('Piped error:', err);
  },
  complete() {
    console.log('Piped complete.');
  }
});

node.update(newValue);
console.log('Node ID:', node.id);
```

## Dagify as an RxJS + Svelte bridge

`ReactiveNode` extends `Subject`, so it already conforms to the Svelte store contract (anything with `subscribe`). Use the same primitives to keep UI state in sync.

### ReactiveNode recap

- **Stateful node:** Holds a value and mutates via `set(value)` or `update(fn)`.
- **Computed node:** Derives its value from dependencies and recomputes when they change.
- **Async handling:** Accepts promises or observables during computation.
- **Batching:** Wrap coordinated updates in `ReactiveNode.batch(fn)` unless `disableBatching` is set.

### Using nodes directly in Svelte

```svelte
<script>
  import { createNode } from 'dagify';

  const count = createNode(0);

  function increment() {
    count.set(count.value + 1);
  }
</script>

<button on:click={increment}>
  Clicked {$count} times
</button>
```

Because `ReactiveNode` implements `subscribe`, Svelte’s `$store` syntax works out of the box.

### Asynchronous integration

- Initialise a node with an observable—Dagify subscribes internally.
- Return a promise from a computed node—Dagify resolves it before emission.

### Batching with `ReactiveNode.batch`

Wrap multiple updates so subscribers only receive the final state:

```js
import { ReactiveNode, createNode } from 'dagify';

const firstName = createNode("John");
const lastName = createNode("Doe");
const fullName = createNode(([first, last]) => `${first} ${last}`, [firstName, lastName]);

ReactiveNode.batch(() => {
  firstName.set("Jane");
  lastName.set("Smith");
});
```

### Side-effect isolation

- Keep computed nodes pure; trigger effects in `.subscribe()` handlers or sink nodes.
- Use `.once.subscribe` when an effect should fire a single time.
- Pair with `createSinkNode` (see `node-catalog.md`) to route external I/O.

---

## Next Steps
- Lean on `node-catalog.md` when you need specialised nodes such as `CommandNode` or event triggers.
- Consult `side-effects.md` for deeper guidance on isolating outbound effects.
- Reference `unbatched.md` when bridging to transports that cannot tolerate batched updates.
