---
title: Agent Operations Guide
summary: Shared playbook so every assistant knows how to process the documentation inbox and keep docs synced across projects.
tags: [agents, process, meta]
updated: 2025-10-18
audience: llm
---

# Agent Operations Guide

This repository is the canonical knowledge base for all Hyper projects and automation agents. Follow this guide each time you pair with a human contributor, file new material, or respond to incoming requests.

## Daily Workflow
1. Skim `docs/index.md` to refresh the taxonomy and confirm where each document lives.
2. Check the `inbox/` directory for unfiled notes. Anything here must be classified and moved during the current session unless the user requests otherwise.
3. Read any task-specific instructions supplied by the user, then gather the relevant docs listed in the index.
4. After completing work, verify all touched files conform to the structure in `docs/meta/authoring-guide.md` and update metadata dates as needed.

## Inbox Processing
- Treat `inbox/` as a short-lived staging area. Move content into the appropriate location under `docs/` at the first opportunity.
- When filing a new document, apply the template from `docs/templates/doc-template.md` (or a more specific template if present).
- Update navigation lists, especially `docs/index.md`, so humans and agents can discover the new or modified material.
- Delete or archive the inbox item once its contents have been fully integrated into the organised docs tree.

## Collaboration Norms
- Use relative links and cite exact file paths when referencing material, mirroring the examples in `docs/meta/authoring-guide.md`.
- Capture reusable prompt fragments or macros under `docs/templates/` so future agents can reuse them.
- Note open questions or follow-up work in the **Next Steps** section of the relevant doc rather than leaving items in the inbox.

## Escalation & Reporting
- If you encounter information that does not fit the existing taxonomy, propose the new structure in the inbox first, then request human confirmation before reshaping `docs/`.
- For missing content or gaps uncovered during a task, either start a draft in `inbox/` with clear context or annotate the affected doc with a brief TODO block.
- Share this guide with any new agent before they contribute, ensuring consistent behaviour across all projects.

## Next Steps
- Review `docs/meta/llm-usage.md` for additional pairing guidelines.
- Use `inbox/README.md` as the checklist while triaging unfiled material.
- Keep `docs/index.md` current so humans and agents always land on the right file.
