# NeonURI API Reference

## `parseHyperUri(input)`
- **Purpose:** Normalize and parse a Hyper URI string into structured components.
- **Parameters:** `input` (`string | { uri: string }`) – URI or pointer-like object.
- **Returns:** `ParsedHyperUri` `{ raw, scheme, key, path, segments, params, fragment }`.
- **Throws:** `TypeError` for invalid strings or unsupported schemes.

## `validateHyperUri(input, options?)`
- **Purpose:** Validate a Hyper URI against scheme rules and optional constraints.
- **Parameters:**
  - `input` (`string`) – URI to validate.
  - `options.requiredParams` (`string[]`) – enforce presence of query params.
  - `options.requireFragment` (`boolean`) – require hash fragment.
- **Returns:** `{ ok, errors[], parsed }`.
- **Errors:** Reports path requirements, key formats, traversal segments, etc.

## `normalizeHyperUri(input)`
- **Purpose:** Trim and coerce URIs or pointer objects into canonical strings.
- **Parameters:** `input` (`string | object | null`).
- **Returns:** `string | null`.

## `resolveHyperUris(reference, options?)`
- **Purpose:** Resolve one or more Hyper pointers, catalog manifests, or mirrors.
- **Parameters:**
  - `reference` (`string | object | Array`) – pointer(s) or catalog structures.
  - `options.resolvers` (`Record<string, Function>`) – scheme resolvers.
  - `options.enforceHash` (`boolean`) – verify bytes against hashes.
  - `options.maxCatalogDepth` (`number`) – default `2`.
  - `options.swarmResolver` (`Function`) – inject Hyperswarm resolver.
  - `options.autoSwarm` (`boolean`) – lazily create Hyperswarm resolver.
  - `options.onAttempt` (`function`) – telemetry hook invoked for each attempt with `{ uri, ok, parsed?, metadata?, bytes?, resource?, error?, durationMs }`.
  - `options.onResolution` (`function`) – final summary hook receiving `{ ok, uri?, parsed?, metadata?, bytes?, resource?, attempts, durationMs }`.
- **Returns:** `{ ok, bytes, resource, metadata, attempts[] }`.
- **Throws:** Does not throw; collects failures in `attempts`.

## `createHyperResolvers(options?)`
- **Purpose:** Build default resolvers for Hyperdrive, Hyperbee, and Hypercore.
- **Parameters:** `options.storePath`, `options.swarmOptions`, `options.bootstrap`, `options.createSwarm`.
- **Optional:** `options.beeKeyEncoding` – custom Hyperbee key encoding (defaults to pointer-aware codec that injects the `0xff` marker for keys starting with `~ptr/`).
- **Returns:** `{ drive, bee, core }` resolver functions.
- **Notes:** Uses Corestore replication; respects `SMOKE_TRACE` logging.

## `createHyperswarmResolver(options?)`
- **Purpose:** Dial Hyperswarm pointers with optional Plex autowiring.
- **Parameters:** `options.createSwarm`, `swarmOptions`, `bootstrap`, `hashAlgorithm`, `joinOptions`, `autoDestroy`, `connectionTimeout`.
- **Returns:** Resolver handling `swarm://` URIs with `resource.waitForConnection()`, `waitForPlex()`, etc.
- **Behavior:** Auto-aborts after `connectionTimeout` (default 30s); cleans up swarm joins on destroy.

## `listProtocols()` & `getProtocolDefinition(id)`
- **Purpose:** Inspect protocol registry for transport defaults.
- **Returns:** `listProtocols()` yields array of known protocol IDs; `getProtocolDefinition(id)` returns metadata with layers/default roles.

## Types
- **`ParsedHyperUri`**
  ```ts
  type ParsedHyperUri = {
    raw: string;
    scheme: 'bee' | 'core' | 'drive' | 'base' | 'swarm';
    key: string;
    path: string;
    segments: string[];
    params: Record<string, string>;
    fragment: string;
  };
  ```
- **`ResolutionOutcome`**
  ```ts
  type ResolutionOutcome = {
    ok: boolean;
    uri?: string;
    bytes?: Uint8Array | null;
    resource?: unknown;
    metadata?: Record<string, unknown>;
    attempts: Array<{ uri: string | null; ok: boolean; error: Error }>;
  };
  ```
- **`AttemptTelemetry`**
  ```ts
  type AttemptTelemetry = {
    uri: string | null;
    ok: boolean;
    parsed?: ParsedHyperUri | null;
    metadata?: Record<string, unknown>;
    bytes?: Uint8Array | null;
    resource?: unknown;
    error?: Error;
    durationMs: number;
  };
  ```
- **`ResolutionTelemetry`**
  ```ts
  type ResolutionTelemetry = {
    ok: boolean;
    uri?: string;
    parsed?: ParsedHyperUri;
    metadata?: Record<string, unknown>;
    bytes?: Uint8Array | null;
    resource?: unknown;
    attempts: ResolutionOutcome['attempts'];
    durationMs: number;
  };
  ```

> **Note:** Every `bytes` payload is a `Uint8Array` produced via [`b4a`](https://github.com/mafintosh/b4a) so the same structures work in Bare, Pear, and Node environments.

## Pointer Key Helpers
- **`encodePointerKey(key, options?)` / `decodePointerKey(buffer, options?)`** – attach or remove the marker byte (`0xff` by default) when persisting pointer keys to byte-oriented stores.
- **`createPointerKeyEncoding(baseEncoding?, options?)`** – wrap a Hyperbee-compatible codec so keys like `~ptr/catalog/item` automatically receive the marker while data keys stay untouched. Returns `{ encode, decode, isPointer, formatPath, parsePath, strip }`.
- **`formatPointerPath(key, options?)` / `parsePointerPath(path, options?)`** – convert pointer IDs to the visible prefix form (`~ptr/`) and back.
- **`isPointerBufferKey(buffer)` / `isPointerPath(path, options?)`** – detect pointers via marker byte or visible prefix.
- **Constants:** `POINTER_KEY_MARKER` (`0xff`), `POINTER_KEY_PREFIX` (`b4a.from([0xff])`), `DEFAULT_POINTER_VISIBLE_PREFIX` (`'~ptr/'`).
