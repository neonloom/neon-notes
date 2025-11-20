---
title: Dagify Core API
summary: Core Dagify primitives for creating reactive nodes, graphs, and composites.
tags: [dagify, reactive, reference]
updated: 2025-11-20
audience: both
---

# Dagify Core API

> **Context Card**
> - **Scope:** Foundational Dagify primitives for nodes, graphs, and composites.
> - **Primary APIs:** `createNode()`, `createComposite()`, `createGraph()`.
> - **Protocols/Feeds:** N/A (pure in-process FRP).
> - **Dependencies:** Node.js ≥18, `dagify`, optional `rxjs` for interoperability.
> - **Outputs:** Reactive nodes, computed behaviours, composite aggregations.
> - **Next Hop:** [`node-catalog.md`](node-catalog.md)

Dagify is a reactive dependency graph library designed for powerful state management and reactive computation. This guide covers the core API for creating and managing reactive nodes, graphs, and composites.

> See related node docs: [`node-catalog.md`](node-catalog.md), [`bridge-node.md`](bridge-node.md), [`command-node.md`](command-node.md), [`filter-node.md`](filter-node.md), [`sink-node.md`](sink-node.md), [`trigger-node.md`](trigger-node.md), [`rxjs-and-svelte-integration.md`](rxjs-and-svelte-integration.md).

## Installation

```bash
npm install dagify
```

---

## Basic Usage

### 1. **Creating a Node**

Use `createNode` to create a reactive node that can hold and update a value.

#### Example

```js
import { createNode } from 'dagify';

// Create a simple reactive node
const node = createNode(10);

// Subscribe to changes
node.subscribe(value => {
  console.log('Node value:', value);
});

// Update the node value
node.set(20);
```

---

### 2. **Creating a Computed Node**

You can create nodes that depend on other nodes and automatically recompute when dependencies change.

#### Example

```js
import { createNode } from 'dagify';

// Create base nodes
const a = createNode(2);
const b = createNode(3);

// Create a computed node that reacts to changes in `a` and `b`
const sum = createNode(([a, b]) => a + b, [a, b]);

// Subscribe to the computed node
sum.subscribe(value => {
  console.log('Sum:', value);
});

// Change values and trigger recomputation
a.set(5); // Sum will automatically update to 8
```

---

### 3. **Creating a Graph**

Use `createGraph` to initialize a reactive dependency graph for managing multiple interconnected nodes.

#### Example

```js
import { createGraph, createNode } from 'dagify';

// Create a new graph
const graph = createGraph();

// Add nodes to the graph
const nodeA = createNode(10);
const nodeB = createNode(20);
const nodeSum = createNode(([a, b]) => a + b);

graph.addNodes([nodeA, nodeB, nodeSum]);
graph.connect([nodeA, nodeB], nodeSum);

// Subscribe to the sum node
nodeSum.subscribe(value => {
  console.log('Graph sum:', value);
});

// Trigger an update
nodeA.set(30);
```

---

### 4. **Creating a Composite**

Use `createComposite` to group multiple nodes together and emit a combined value when any of them change.

#### Example (Object Mode)

```js
import { createNode, createComposite } from 'dagify';

// Create individual nodes
const width = createNode(100);
const height = createNode(200);

// Create a composite node
const dimensions = createComposite({ width, height });

// Subscribe to composite changes
dimensions.subscribe(({ width, height }) => {
  console.log(`Dimensions: ${width}x${height}`);
});

// Update width
width.set(150);
```

#### Example (Array Mode)

```js
const color1 = createNode('red');
const color2 = createNode('blue');

const palette = createComposite([color1, color2]);

palette.subscribe(colors => {
  console.log('Current palette:', colors);
});

// Change a color
color2.set('green');
```

---

## License

MIT License © 2025 Zachary Griffee

## Next Steps
- Review specialty nodes under `docs/reference/dagify/*.md` (migration-2.0, dagify-vs-rxjs, types/encodings, and node guides linked above).
- Integrate with UI frameworks via the RxJS and Svelte notes once filed.
