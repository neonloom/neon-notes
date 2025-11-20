title: Svelte Platform Overview
summary: Orientation for using Svelte alongside Hyper tooling without project-specific assumptions.
tags: [svelte, platform]
updated: 2025-10-18
audience: both
---

# Svelte Platform Overview

> **Context Card**
> - **Scope:** Orient Svelte/SvelteKit usage alongside Hyper tooling in a vendor-neutral way.
> - **Primary APIs:** SvelteKit routing (`+page.svelte`), stores, loaders, FRP integrations.
> - **Protocols/Feeds:** Guides wiring to Hyper services (Autobase, Protomux) without project-specific assumptions.
> - **Dependencies:** SvelteKit, Node.js ≥18, Hyper client libraries as needed.
> - **Outputs:** Shared patterns, references to quickstart and roadmap docs, neutral baseline.
> - **Next Hop:** [`quickstart.md`](quickstart.md)

Use this track to pair Svelte (and SvelteKit) with Hyper primitives in a platform-agnostic way. The goal is to share reusable patterns that any project can adopt, whether or not it depends on a particular product stack.

## How to use these docs
- Apply the functional reactive guidance in `../../guides/frp-overview.md` and `../../guides/autobase-frp-playbook.md` when wiring stores or async flows.
- Start new UI work with the neutral `quickstart.md`, then layer in project-specific conventions separately.
- Extend coverage in `reference.md` as shared patterns emerge (render pipelines, deployment, testing, etc.).

Upcoming sections will collect any project-specific adapters or conventions under their own heading so the core Svelte guidance stays portable.
