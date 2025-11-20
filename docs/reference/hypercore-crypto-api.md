---
title: hypercore-crypto API Reference
summary: Lists the signing, hashing, and namespace helpers Hypercore uses for Merkle trees and discovery keys.
tags: [hypercore, crypto, reference]
updated: 2025-10-18
audience: both
---

# hypercore-crypto

> **Context Card**
> - **Scope:** Hypercore cryptographic helpers for signing, hashing, and namespace derivation.
> - **Primary APIs:** `crypto.keyPair()`, `crypto.sign()`, `crypto.verify()`, `crypto.discoveryKey()`.
> - **Protocols/Feeds:** Hypercore Merkle tree hashing, discovery key derivation, Autobase writer signatures.
> - **Dependencies:** Node.js ≥18, `hypercore-crypto`.
> - **Outputs:** Key pairs, signatures, discovery keys, hashes.
> - **Next Hop:** [`../walkthroughs/hypercore-crypto-walkthrough.md`](../walkthroughs/hypercore-crypto-walkthrough.md)

> Walkthrough companion: `../walkthroughs/hypercore-crypto-walkthrough.md`

The crypto primitives used in hypercore, extracted into a separate module

```
npm install hypercore-crypto
```

## Usage

``` js
const crypto = require('hypercore-crypto')

const keyPair = crypto.keyPair()
console.log(keyPair) // prints a ed25519 keypair
```

## API

#### `keyPair = crypto.keyPair()`

Returns an `ED25519` keypair that can be used for tree signing.

#### `signature = crypto.sign(message, secretKey)`

Signs a message (buffer).

#### `verified = crypto.verify(message, signature, publicKey)`

Verifies a signature for a message.

#### `hash = crypto.data(data)`

Hashes a leaf node in a merkle tree.

#### `hash = crypto.parent(left, right)`

Hash a parent node in a merkle tree. `left` and `right` should look like this:

```js
{
  index: treeIndex,
  hash: hashOfThisNode,
  size: byteSizeOfThisTree
}
```

#### `hash = crypto.tree(peaks)`

Hashes the merkle root of the tree. `peaks` should be an array of the peaks of the tree and should look like above.

#### `buffer = crypto.randomBytes(size)`

Returns a buffer containing random bytes of size `size`.

#### `hash = crypto.discoveryKey(publicKey)`

Return a hash derived from a `publicKey` that can used for discovery
without disclosing the public key.

#### `list = crypto.namespace(name, count)`

Make a list of namespaces from a specific publicly known name.
Use this to namespace capabilities or hashes / signatures across algorithms.

## License

MIT

## Next Steps
- Dry-run the primitives with the [Hypercore Crypto Walkthrough](../walkthroughs/hypercore-crypto-walkthrough.md).
- Pair these helpers with [Hypercore API Reference](hypercore-api.md) when building replication pipelines.
- Capture deployment key-handling decisions in `../meta/authoring-guide.md` sections on guardrails.
