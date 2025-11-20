# Nexus

Nexus is an experiment in composing small machine-learning services on top of Hypercore-based storage. It combines Autobase, Hyperbee, and Hyperswarm primitives with lightweight neural networks so behavior can be replicated, versioned, and consumed by distributed entities.

## Quick Start
- `npm install` to sync dependencies.
- `npm run main` to boot `index.js`, open a REPL, and announce the Hypercore discovery key.
- From the REPL, call `begin()` with an optional z32 key to join an existing core, or let Nexus create a new one.
- Explore modules directly (`node lib/agents/ai/ml/SimpleTrainer.js`) when prototyping ML flows; keep production wiring rooted in `index.js`.

## Repository Layout
- `index.js` – boots the main core, wires Hyperswarm replication, and exposes agents and stores in the REPL context.
- `lib/core/Core.js` – Autobase-powered registry that records genesis metadata, shared seeds, and service catalogs.
- `lib/store/index.js` – Corestore helpers (`initCorestore`, `openCorestore`, `replicate`) used across the codebase.
- `lib/agents/ai/` – AI adapters. `ml/` hosts the MLP trainer stack; `llm/` holds future-facing wrappers for Ollama and Venice.
- `lib/entity/` – Entity records and `LocalEntityInstance` bootstrap DNA (behavior) from Hypercores.
- `docs/hyper-tools/` – Design notes and API crib sheets for Hypercore, Autobase, Corestore, and related tooling.

## Decentralized Data Layer
- **Corestore namespaces** – Every logical component (`Core`, `Catalog`, ML trainers) opens its own namespace via `openCorestore()` so data stays segmented yet shareable.
- **Autobase orchestration** – `BaseBase` centralizes Autobase setup, writer management, and view wiring. Concrete subclasses (`RecordStringJson`, `RecordBinaryJson`, `Feed`) define how records are encoded and projected into Hyperbee views.
- **Hyperbee projections** – Writable nodes append operations (`put`, `del`, `append`) to Autobase logs. The configured Hyperbee view materializes those changes for fast lookups.
- **Hyperswarm sync** – `index.js` joins the swarm on the core’s discovery key. Each incoming peer stream is piped through `replicate()`, making every namespace rehydrate automatically wherever the project is run.

## Machine Learning Stack

### SimpleTrainer Pattern
1. **Configuration header** – `SimpleTrainer.create()` writes an `mlpConfigHeaderEncoding` block at log index `0` describing layer sizes, activation, learning rate, and optional seed.
2. **Deterministic model** – `MLP` builds a small feed-forward network using deterministic seeding (LCG) when requested, enabling identical training runs across peers.
3. **Training queue** – `SimpleTrainer.enqueueTraining()` schedules work so only one job mutates the in-memory network at a time. `_runTraining()` supports early stopping, adjustable resolution, and temporary learning-rate overrides.
4. **Snapshots as Hypercores** – Each training run produces binary dumps for every epoch. `BehaviorCore.commit()` stores those dumps in a dedicated Hypercore, then `SimpleTrainer.commit()` appends the behavior core’s key to the trainer log. The result is a tamper-proof history of model checkpoints.
5. **Streaming inference** – `BehaviorCore.createTrainForwardStream()` yields inference results for a new input against every stored snapshot, making A/B evaluation or time-travel debugging trivial.

### Local Entity DNA
- `Entity.putMachineLearningDNA()` records a named behavior with the trainer’s Hypercore key under the `DNA` sub-tree.
- `LocalEntityInstance` resolves DNA entries, instantiates `MLPCore` loaders scoped to `outsourcing` corestore namespaces, and picks a random behavior snapshot (`pickRandom()`) to bootstrap local inference.
- The instance materializes genesis metadata (entity id, author, time offsets) alongside the chosen ML behavior, turning decentralized model snapshots into plug-and-play capabilities for agents in other projects.

## Decentralized Technique Checklist
- **Store configs separately from weights** – Config headers live at index zero; weight dumps occupy subsequent entries. Downstream consumers can reconstruct models without shared staging servers.
- **Treat behaviors as first-class Hypercores** – Every committed training session is its own Hypercore (managed by `BehaviorCore`). This keeps versioning, replication, and permissioning aligned with Hypercore’s strengths.
- **Use entity DNA as capability routing** – Entities map capability names to trainer keys. Any project can adopt the same pattern: store capability pointers in a record schema, let local instances fetch and hydrate the actual models on demand.
- **Namespace everything** – Calling `openCorestore("component-name")` ensures reproducible file layouts and makes replication resilient across platforms.
- **Surface mutation through REPL-friendly APIs** – With agents and stores exposed in `index.js`, human operators (or other programs) can attach, train, and query models live over the swarm.

## Extending the System
- Add new ML trainers under `lib/agents/ai/ml/`, export them via the directory `index.js`, and reuse the header/dump pattern so behaviors remain portable.
- Hook external LLMs by fleshing out `Ollama` and `Venice` wrappers, keeping API keys injectable through constructor options or environment variables.
- Extend `Entity` DNA types for non-ML capabilities (e.g., rule engines, sensor adapters) by following the same Hypercore pointer approach.
- Contribute to `docs/hyper-tools/` with walkthroughs or API notes whenever new primitives join the stack.

## Roadmap Ideas
- Harden LLM clients and add prompt pipelines alongside the MLP agents.
- Introduce automated tests (`node --test`) around SimpleTrainer workflows and entity DNA hydration.
- Provide higher-level orchestration for selecting behaviors (score-based or context-aware instead of random).
- Document replication scenarios (offline-first, multi-device) to help future integrations reuse this Hypercore + ML pattern.

