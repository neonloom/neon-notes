---
title: Dagify diffOperator
summary: Compare successive array emissions and surface element-level changes.
tags: [dagify, rxjs, operator]
updated: 2025-10-18
audience: both
---

# Diff Operator Documentation

The `diffOperator` transforms a stream of arrays into a stream of diff objects. It compares consecutive emissions element by element and identifies additions, removals, and unchanged items.

---

## API

```ts
diffOperator(options?: {
  initial?: boolean,
  eq?: (a: T, b: T) => boolean
}): OperatorFunction<T[], { new?: T[], del?: T[], same?: T[] }>
```

- **`initial`** (`boolean`, default `true`): Compare the first emission against an empty array so every element appears under `new`.
- **`eq`** (`function`): Custom equality checker; defaults to strict equality.

The operator returns an observable that emits objects with optional `new`, `del`, and `same` arrays.

---

## Comparison rules

1. **Added:** Present in the new array when the previous value is `undefined`.
2. **Removed:** Present in the previous array when the new value is `undefined`.
3. **Changed:** Both arrays contain a value at the index but the equality checker returns `false`. The new value appears in `new`, the old value in `del`.
4. **Unchanged:** Values pass the equality check and land in `same`.

---

## Usage

### Default behaviour

```js
source$.pipe(diffOperator()).subscribe(console.log);
```

With arrays `[0, 1, 2, 0]` then `[0, 1, 2, 2]`, the diff emits:

```json
{
  "new": [2],
  "del": [0],
  "same": [0, 1, 2]
}
```

### Custom equality

```js
const diff$ = source$.pipe(
  diffOperator({ eq: (a, b) => a.id === b.id })
);
```

When comparing arrays of objects, identical `id` values land in `same` even if other properties differ.

---

## Next Steps
- Combine with `node-catalog.md` helpers such as `createFilterNode` to apply diffs selectively.
- Use alongside `side-effects.md` guidance when diffs trigger downstream I/O.
- Feed diff results into Svelte or RxJS consumers documented in `integration.md`.
