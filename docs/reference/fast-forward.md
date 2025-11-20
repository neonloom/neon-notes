# Autobase Fast-Forward Guide

Fast-forward lets lagging peers skip already-signed history and catch up from the latest checkpoint rather than replaying every block. This doc captures the patterns we validated so agents (LLM or human) can detect and leverage fast-forward safely.

## When Fast-Forward Triggers

Autobase triggers fast-forward when:

1. **The writer has a long lead** – typically >16 blocks (the default `FastForward.MINIMUM`).
2. **The lagging peer signals a stall** via `host.preferFastForward()` during `apply`.
3. **Replication is active** – the peer must still be connected (via Hyperswarm or biSwarm) so the signed checkpoint can be fetched.

Holepunch’s tests (mirrored in `smoke-n-scratch/autobase-fastforward-biswarm.js` and `...-migrate.js`) use these heuristics to force fast-forward:

- Seed peer A, stall peer B’s `apply`, append another entry. B emits `fast-forward` and its view becomes mostly sparse.
- When a third peer C joins via B (with B and/or C stalled), C also jumps to the checkpoint and reports sparse blocks.

## How to Detect Fast-Forward

1. **Listen for the `fast-forward` event**:
   ```js
   base.on('fast-forward', ({ from, to }) => {
     console.log('jumped from', from, 'to', to);
   });
   ```
2. **Count sparse blocks** after sync:
   ```js
   let sparse = 0;
   for (let i = 0; i < base.view.length; i++) {
     if (!(await base.view.has(i))) sparse++;
   }
   console.log('sparse %', (sparse / base.view.length) * 100);
   ```
   If sparse > 0 after replicating a large backlog, fast-forward was used.

## Recommended Flow for Agents

1. **Replication setup**
   - Use `createBiSwarm()` for deterministic local tests, or Hyperswarm with generous timeouts (20s+).
   - Wire replication per peer (A↔B, B↔C). For multi-hop scenarios, let B replicate with both A and C.
2. **Stall logic**
   - Inside the Autobase strategy’s `apply` handler, toggle a `slow` flag and call `host.preferFastForward()` when you detect a lag (e.g., when `base.view.length` doesn’t grow for N ticks).
3. **Verification**
   - After catching up, inspect sparse blocks and/or `fast-forward` events to confirm the jump.
   - The scripts in `smoke-n-scratch` (`autobase-fastforward-biswarm.js`, `...-migrate.js`) are ready-to-run references.
4. **Documentation hints**
   - When a new peer joins, record whether fast-forward was used. If not, consider requesting it (via `host.preferFastForward`) or increasing the backlog threshold.

## Integration Tips

- **Dagify** – when wrapping Autobase ops in Dagify nodes, expose `fastForward` metadata (events, sparse counts) via nodes so UI/admin tools can monitor replication health.
- **Swarm helpers** – our Lego blocks (`lib/net/swarm.js`, `lib/net/replication.js`) already isolate join/connection lifecycles; use them to attach Autobase replication to either biSwarm or Hyperswarm.
- **Testing strategy** – run fast-forward smokes with biSwarm for speed; use Hyperswarm with retries/timeouts before shipping.

Keep these notes handy whenever you add new writers or bootstrap peers. Fast-forward is a powerful mechanism, but it only activates if the peer requests it (via `host.preferFastForward`) or falls sufficiently behind.
