# Hyper Ecosystem Docs

This repository gathers workflow guidance for people and automation agents that build on Hyper primitives. All written material now lives under `docs/` so it is easy to expand without duplicating files.

## Directory Layout
- `docs/index.md` — quick links to every section.
- `docs/guides/` — conceptual framing such as `frp-overview.md` and the Autobase playbook.
- `docs/reference/` — API cheat sheets for Autobase, Corestore, Hypercore, Hyperbee, Compact Encoding, Hypercore Crypto, Hyperdrive, Hyperswarm, HyperDHT, Hyperdispatch, Hyperschema, Localdrive, and Protomux.
- `docs/walkthroughs/` — procedural recipes that pair with the reference sheets.
- `docs/platforms/` — platform-specific notes (`bare/` and `pear/` today).
- `docs/examples/` — executable patterns and message encodings organised by domain.
- `docs/meta/` — authoring standards and prompts for humans or LLMs.
- `docs/templates/` — starter files for future additions.

## Getting Started
1. Skim `docs/index.md` to pick the component or workflow you need.
2. Use the matching API sheet in `docs/reference/` to recall signatures and options.
3. Follow the relevant walkthrough or platform note to execute the workflow.

## Contributing New Material
- Follow the naming, structure, and review checklist in `docs/meta/authoring-guide.md`.
- When working with an assistant, prime it with `docs/meta/llm-usage.md` so it anchors to the latest taxonomy.
- Keep the manifest in `docs/index.md` up to date whenever you add or move files.
