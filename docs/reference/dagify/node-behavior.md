---
title: Dagify Node Behaviour
summary: Control dependency wiring with shallow nodes and dependency assignment rules.
tags: [dagify, nodes, behaviour]
updated: 2025-10-18
audience: both
---

# Shallow vs. Regular Nodes

Dagify offers two node families:

1. **Regular (deep) nodes** track changes inside nested objects or arrays.
2. **Shallow nodes** only react to top-level reference changes.

## Regular nodes

- Perform deep tracking of nested structures.
- Recompute when any nested property changes.
- Ideal for UI components and complex state objects.

```js
const user = createNode({ name: "Alice", details: { age: 30 } });

user.value.details.age = 35;
user.update(); // triggers downstream updates
```

## Shallow nodes

- Use shallow equality (`shallowEqual`) to detect change.
- Ignore mutations to nested properties unless the outer reference changes.
- Recommended for performance-sensitive maps, caches, or memoised derived state.

```js
const user = createShallowNode({ name: "Alice", details: { age: 30 } });

user.value.details.age = 35;
user.update(); // ignored

user.set({ name: "Bob", details: { age: 35 } }); // emits
```

### Shallow computed nodes

- Depend on other nodes but only emit when the new computed value differs shallowly from the previous one.

```js
const count = createNode(0);
const double = createShallowNode(() => ({ value: count.value * 2 }), [count]);

count.set(1); // emits { value: 2 }
count.set(1); // suppressed
count.set(2); // emits { value: 4 }
```

| Feature | Regular node | Shallow node |
|---------|--------------|--------------|
| Nested property tracking | ✅ | ❌ |
| Top-level reference tracking | ✅ | ✅ |
| Comparison strategy | Deep | Shallow |
| Use cases | UI, complex state | Large objects, memoised derivations |

---

# Dependency assignment rules

Use `setDependencies` when replacing dependency lists. `addDependency` expects arrays or objects; passing a single function should throw.

```js
const computed = createNode(x => x + 1, () => 5);

t.exception(() => computed.addDependency(() => 3));

computed.setDependencies(() => 3);
await sleep();

t.is(computed.value, 4);
```

- **`addDependency`** – append to an existing array/object of dependencies.
- **`setDependencies`** – replace dependencies entirely; supports single factory functions.

---

## Next Steps
- Combine with `node-catalog.md` when picking specialised nodes (e.g., filter or trigger nodes) that lean on these behaviours.
- Consult `side-effects.md` before wiring shallow nodes into effectful sinks.
- Review `integration.md` if these nodes feed RxJS pipelines or Svelte stores.
