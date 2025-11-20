---
title: LLM Usage Playbook
summary: Orientation checklist for pairing LLMs with the Hyper tooling docs and workflows.
tags: [llm, meta, onboarding]
updated: 2025-10-18
audience: both
---

# LLM Usage Playbook

Prime assistants with this sheet before they triage tickets, draft guides, or automate workflows across the Hyper ecosystem.

## Bootstrapping Context
- Share the repository purpose: _“Hyper primitives + FRP workflows for people and automations.”_
- Provide a breadcrumb list of relevant docs (copy from `docs/index.md` for the task at hand).
- Include objective constraints (environment, tooling limits, desired output format).

## Retrieval Commands
- Ask the model to read specific files: `open docs/reference/hypercore-api.md`.
- Prefer targeted excerpts over the entire folder to reduce token waste.
- When a doc spans multiple topics, specify the headings to focus on.

## Preferred Output Styles
- For procedural answers: numbered steps with explicit preconditions.
- For strategy guidance: short overview, risk checklist, next actions.
- For API explanations: signature table, usage example, edge cases.

## Guardrails
- Cross-verify facts with the reference sheets before proposing actions.
- Flag uncertainties or missing docs instead of guessing.
- Avoid inventing new directory names; use the taxonomy defined in `docs/index.md`.

## Feedback Loop
- Capture useful prompt snippets or macros under `docs/templates/`.
- When the model discovers a documentation gap, log it in an issue or append to a TODO block within the closest doc (clearly marked).
- Encourage the assistant to ask for clarification when goals or constraints conflict.

Handing this page to an LLM keeps its responses grounded in the latest repository structure and nomenclature.

## Next Steps
- Share the [Documentation Authoring Guide](authoring-guide.md) with human collaborators.
- Point assistants to `../index.md` for navigation.
- Collect reusable prompt macros under `../templates/`.
