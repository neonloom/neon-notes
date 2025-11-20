# Bare Framework Standards

These rules apply to every Pear/Bare project in the Virtualia workspace. Follow them for all new code and migrations.

## Core Rules
- ✅ **Use canonical specifiers**: import builtins as `fs`, `path`, `process`, etc. If you need a `node:` specifier for Pear/Electron compatibility, mirror it in the repo `imports` map so Bare receives the shim path (Node will keep using the builtin). Never rely on un-mapped `node:` specifiers.
- ✅ **Map Bare shims in `imports`**: use the `package.json` [`imports`](https://nodejs.org/api/packages.html#imports) field to point Bare to `bare-*` modules while letting Node use its native implementations.
- ✅ **Keep repo-local installs**: run `npm install` per repo (no workspace hoisting) so Pear picks up local `node_modules`.
- ✅ **Run the Bare guard**: `npm run check:bare` (or equivalent) must pass before finishing.
- ✅ **Bundle both runtimes**: smoke test with `bare …` and `node …` whenever the code may execute under both.
- ✅ **Use portable primitives**: sodium should come from [`sodium-universal`](https://github.com/sodium-friends/sodium-universal) (never Node’s `crypto` directly), buffer work should go through [`b4a`](https://github.com/mafintosh/b4a`), EventEmitter usage should go through [`eventemitter3`](https://github.com/primus/eventemitter3`), and FRP/reactive graphs should standardize on [`dagify@^2.0.1`](https://github.com/hypercore-protocol/dagify). Add them via dependencies/import maps instead of ad-hoc shims.
- ✅ **Favor decentralization-friendly modules**: wherever a Node builtin would centralize state (crypto RNG, Buffer, EventEmitter), use the portable modules above so Bare, Node, and future Pear runtimes stay deterministic across devices (Raspberry Pi, phones, etc.).

## Import Map Template
Add the imports map at the top level of your repo’s `package.json` and trim to the builtin shims you actually need:

```json
{
  "imports": {
    "fs": { "bare": "bare-fs" },
    "fs/promises": { "bare": "bare-fs/promises" },
    "path": { "bare": "bare-path" },
    "process": { "bare": "bare-process" },
    "process/global": { "bare": "bare-process/global" },
    "child_process": { "bare": "bare-subprocess" },
    "crypto": { "bare": "bare-crypto" },
    "assert": { "bare": "bare-assert" },
    "assert/strict": { "bare": "bare-assert/strict" },
    "url": { "bare": "bare-url" }
  }
}
```

Node ignores these entries and continues to resolve its builtins. Bare reads the map and loads the shims. Remove any legacy `"fs": "npm:bare-node-fs"`-style aliases once the map is in place.

### Symlinking shared tooling
Shared scripts (for example `scripts/enforce/check-bare-imports.mjs`) need access to the shims. Create a symlink so they can resolve dependencies without copying packages:

```
ln -s ../economy/node_modules scripts/node_modules
```

Recreate the link whenever you wipe and reinstall dependencies.

## Guard Script
Place this script somewhere reusable (e.g. `scripts/enforce/check-bare-imports.mjs`) and run it via `npm run check:bare`.

```js
#!/usr/bin/env bare
import fs from 'fs';
import path from 'path';
import process from 'process';

const ROOT = process.cwd();
const FILE_EXTS = ['.js', '.mjs', '.ts', '.tsx'];
const violations = [];

const IGNORED_DIRS = new Set(['node_modules', 'test', 'tests']);

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(full);
    else if (FILE_EXTS.some(ext => entry.name.endsWith(ext))) check(full);
  }
}

function check(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (/['"]node:[^'"]+['"]/.test(src)) {
    violations.push({ file, reason: 'node:* specifier' });
    return;
  }
}

scan(ROOT);

if (violations.length) {
  console.error('\nBare guard failed: remove node:* imports from:\n');
  violations.forEach(({ file, reason }) => console.error(` - ${file} (${reason})`));
  process.exit(1);
} else {
  console.log('Bare guard passed (no node:* specifiers found).');
}
```

In each repo’s `package.json`:

```json
"scripts": {
  "check:bare": "node ../../scripts/enforce/check-bare-imports.mjs",
  "test": "npm run check:bare && …"
}
```

## Examples
- `import fs from 'fs/promises';`
- `import path from 'path';`
- `import { Readable } from 'stream';` (Bare swaps in `bare-stream` because of the imports map.)
- Loading a CommonJS module (Hypercore) from ESM:
  ```js
  import { createRequire } from 'bare-module';
  import Corestore from 'corestore';

  const require = createRequire(import.meta.url);
  const Hypercore = require('hypercore');

  const store = new Corestore('./tmp/tests/hypercore');
  await store.ready();

  const core = store.get({ name: 'demo' });
  await core.ready();
  await core.append(Buffer.from('hello'));

  const buffer = await core.get(0);
  console.log(buffer);

  await core.close();
  await store.close();
  ```
- CLI utilities run via `pear` (which uses Bare under the hood).

## References
- [`toolbelt/docs/docs/platforms/bare/bare-modules.md`](../toolbelt/docs/docs/platforms/bare/bare-modules.md)
- [`HyperQuill/docs/hyper-tools/pear/making-pear-terminal-app.md`](../HyperQuill/docs/hyper-tools/pear/making-pear-terminal-app.md)
- [`HyperQuill/docs/hyper-tools/bare/api.md`](../HyperQuill/docs/hyper-tools/bare/api.md)
- Repository docs live under `docs/projects/<repo>/` (sync with `node scripts/docs/sync-docs.mjs`).
