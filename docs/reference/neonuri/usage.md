# Using NeonURI

## Installation
```bash
npm install @neonloom/neonuri
```

## Basic Parsing & Validation
```js
import { parseHyperUri, validateHyperUri } from '@neonloom/neonuri';

const parsed = parseHyperUri('drive://k4r...sy/assets/model.glb');
console.log(parsed.path); // "assets/model.glb"

const { ok, errors } = validateHyperUri(parsed.raw, {
  requiredParams: ['hash'],
});
if (!ok) {
  throw new Error(errors.join('; '));
}
```

## Resolving with Custom Schemes
```js
import { resolveHyperUris } from '@neonloom/neonuri';

const reference = {
  schemaRef: 'bee://k4r...sy/schemas/asset@1',
  uris: [
    'drive://k4r...sy/assets/offline.glb',
    'drive://b6c...2s/assets/live.glb',
  ],
};

const resolvers = {
  drive: async ({ parsed }) => {
    const bytes = await fetchFromStorage(parsed.key, parsed.path);
    return { bytes, metadata: { storage: parsed.key } };
  },
};

const outcome = await resolveHyperUris(reference, { resolvers, enforceHash: true });
if (!outcome.ok) {
  throw new Error(outcome.attempts.map((attempt) => attempt.error.message).join('\n'));
}

const buffer = outcome.bytes;
```

All byte helpers rely on [`b4a`](https://github.com/mafintosh/b4a) for portability, so use `b4a.from(...)` (as the examples below do) whenever you need to manufacture payloads.

## Wiring Hyperswarm Resolution
```js
import b4a from 'b4a';
import { resolveHyperUris, createHyperswarmResolver } from '@neonloom/neonuri';

const swarmResolver = createHyperswarmResolver({
  autoDestroy: true,
  connectionTimeout: 20000,
});

const pointer = {
  uri: 'swarm://peers.topic?proto=plex&mux=mesh.control&id=abcd1234ef',
  proto: 'plex',
  mux: 'mesh.control',
  id: 'abcd1234ef',
  layers: [{ type: 'plex', protocol: 'mesh.control', id: 'abcd1234ef' }],
};

const outcome = await resolveHyperUris(pointer, { swarmResolver });
if (outcome.ok) {
  const plex = await outcome.resource.waitForPlex();
  plex.write(b4a.from('ping'));
}
```

## Catalog Expansion & Depth Control
```js
const pointer = {
  schemaRef: 'bee://k4r...sy/schemas/asset@1',
  catalog: {
    uri: 'bee://k4r...sy/catalog/assets',
    selection: 'mirrors',
  },
};

const outcome = await resolveHyperUris(pointer, {
  resolvers,
  maxCatalogDepth: 3,
  enforceHash: true,
});
```

## Telemetry Hooks
```js
const attempts = [];
const summaries = [];

const outcome = await resolveHyperUris(reference, {
  resolvers,
  enforceHash: true,
  onAttempt: (detail) => {
    attempts.push(detail);
  },
  onResolution: (summary) => {
    summaries.push(summary);
  },
});

console.table(attempts.map(({ uri, ok, durationMs }) => ({ uri, ok, durationMs })));
console.log('resolution summary', summaries.at(-1));
```

## Hyperbee Pointer Conventions
Pointers stored in Hyperbee should carry a binary marker so they can be detected without parsing values. NeonURI’s helpers reserve the byte `0xff` and expose a readable prefix `~ptr/`:

```js
import b4a from 'b4a';
import { createPointerKeyEncoding, formatPointerPath } from '@neonloom/neonuri';

const pointerEncoding = createPointerKeyEncoding('utf-8');

const pointerKey = formatPointerPath('catalog/root'); // "~ptr/catalog/root"
await bee.put(pointerKey, b4a.from(JSON.stringify(pointerPayload)));

const valueKey = 'data/document';
await bee.put(valueKey, b4a.from(JSON.stringify(documentPayload)));
```

When you instantiate the bundled Hyperbee resolver, the same encoding is already wired in:

```js
import { createHyperResolvers } from '@neonloom/neonuri';

const { resolvers } = createHyperResolvers(); // uses createPointerKeyEncoding internally
```

Need a custom layout? Pass your own codec via `beeKeyEncoding`, preferably still built with `createPointerKeyEncoding` so the resolver keeps the `0xff` marker contract.

## Release Workflow
- Run `npm run release` locally to lint, test, and smoke-test before tagging.
- Use `npm run publish:dry` to inspect the publish payload.
- When ready, execute `npm run publish:release` (requires npm auth with publish rights).
