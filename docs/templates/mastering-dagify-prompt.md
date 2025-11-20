---
title: Mastering Dagify Prompt
summary: Reusable briefing to teach an assistant Dagify’s reactive graph features.
tags: [template, dagify, prompt]
updated: 2025-10-18
audience: llm
---

# Prompt: “Mastering Dagify: A Comprehensive Guide to Reactive Dependency Graphs”

You are an AI tasked with learning and demonstrating the use of Dagify, a reactive dependency graph library for JavaScript. Your objective is to build a deep understanding of the library’s features and apply them to construct a dynamic, reactive system. Follow these steps and answer all parts of the task.

## 1. Introduction to Dagify
- **Overview:** Read the library documentation. Dagify lets you create static and computed nodes, compose nodes into composites, build graphs, and manage network synchronisation. It supports lazy node creation, batched updates, and both deep and shallow equality checks.
- **Key concepts:** `ReactiveNode`, static vs. computed nodes, composites, graphs, advanced nodes (BridgeNode, ExecutionNode), utilities such as batching and `nodeFactory`.

## 2. Basic node creation
- Create a static node holding `42`.
- Create a computed node that doubles the static node’s value.
- Subscribe to the computed node and explain how it updates when the static node changes.

```js
import { createNode } from "dagify";

const staticNode = createNode(42);
const computedNode = createNode(([value]) => value * 2, [staticNode]);

computedNode.subscribe(value => {
  console.log("Computed Value:", value);
});
```

## 3. Shallow reactive nodes
- Use `createShallowNode` and demonstrate that mutating nested properties without replacing the object reference does not emit.

```js
import { createShallowNode } from "dagify";

const baseObj = { a: 1, b: 2 };
const shallowNode = createShallowNode(([obj]) => obj, [baseObj]);

shallowNode.subscribe(value => {
  console.log("Shallow Node Value:", value);
});

baseObj.a = 10; // No emission because the reference did not change.
```

## 4. Composites
- Build a composite node that aggregates multiple reactive nodes.
- Show how the composite reflects its children.

```js
import { createComposite, createNode } from "dagify";

const node1 = createNode(10);
const node2 = createNode(([value]) => value + 5, [node1]);
const node3 = createNode(20);

const composite = createComposite([node1, node2, node3]);

composite.subscribe(values => {
  console.log("Composite Value:", values);
});
```

## 5. Reactive graphs
- Use `createGraph` to connect nodes, then inspect the graph (e.g., `topologicalSort`, `getImmediatePredecessors`).

```js
import { createGraph, createNode } from "dagify";

const graph = createGraph();

const n1 = createNode(5);
const n2 = createNode(([value]) => value * 3, [n1]);
const n3 = createNode(([value]) => value - 2, [n2]);

graph.addNodes([n1, n2, n3]);
graph.connect(n1, n2);
graph.connect(n2, n3);

console.log("Topologically Sorted Keys:", graph.topologicalSort());
```

## 6. Advanced nodes
- **BridgeNode:** Connect input and output nodes via `createBridgeNode`.
- **ExecutionNode:** Trigger manually controlled computations with `createExecutionNode`.

```js
import { createBridgeNode, createExecutionNode, createNode } from "dagify";
import { Subject } from "rxjs";

const inputNode = createNode(1);
const outputNode = createNode(([value]) => value + 10, [inputNode]);
const bridge = createBridgeNode(inputNode, outputNode);

bridge.subscribe(value => {
  console.log("Bridge Node Value:", value);
});
bridge.set(5);

const execStream = new Subject();
const execNode = createExecutionNode(([value]) => value * 2, [inputNode], execStream);
execNode.subscribe(value => {
  console.log("Execution Node Value:", value);
});
execNode.triggerExecution();
```

## 7. Batch updates
- Demonstrate `batch` to coalesce multiple updates so subscribers receive only the final value.

```js
import { batch, createNode } from "dagify";

const batchNode = createNode(0);
batchNode.subscribe(value => {
  console.log("Batched Node Value:", value);
});

batchNode.set(1);
batchNode.set(2);

batch(() => {
  batchNode.set(3);
  batchNode.set(4);
  batchNode.set(5);
});
```

## 8. Lazy node creation
- Use `nodeFactory` to lazily instantiate computed nodes on demand.

```js
import { nodeFactory, createNode } from "dagify";

const computedFactory = nodeFactory(
  deps => deps.reduce((sum, node) => sum + node.value, 0),
  [createNode(1), createNode(2)],
  10
);

const myNode = computedFactory.someKey;
myNode.subscribe(value => {
  console.log("Lazy Node Value:", value);
});

for (const node of computedFactory) {
  console.log("Iterated Node Value:", node.value);
  break;
}
```

## Final reflection
- Summarise how nodes, composites, graphs, advanced nodes, and utilities work together.
- Call out potential applications and integration challenges.

---

## Next Steps
- Pair this prompt with the reference set under `../reference/dagify/`.
- Capture resulting notes in `../inbox/` if new workflows emerge.
- Update `docs/index.md` when you add new Dagify material.
