---
title: Documentation Authoring Guide
summary: Checklist for placing, formatting, and reviewing docs so humans and LLMs stay aligned.
tags: [documentation, meta, process]
updated: 2025-10-18
audience: both
---

# Authoring Guide

Use this checklist whenever you add or update documentation. It keeps the corpus legible for people while ensuring LLMs can reliably cite the right files.

## 1. Pick the Right Location
- `docs/guides/` — high-level mental models, background theory, or playbooks.
- `docs/reference/` — API surfaces and option tables (one file per dependency).
- `docs/walkthroughs/` — numbered procedures that call out prerequisites.
- `docs/platforms/<target>/` — platform-specific setup or troubleshooting notes.
- `docs/examples/` — runnable code, message schemas, or protocol captures.
- `docs/meta/` — contribution policies, prompt primers, or repository logistics.
- `docs/templates/` — starting points for new documents.

## 2. Follow the Markdown Skeleton
```markdown
---
title: Short Title (required)
summary: 1–2 sentence description for previews
tags: [primary-topic, optional-topic]
updated: 2024-04-26
audience: human | llm | both
---

# Heading 1
```
- Front matter is YAML. `audience` declares the primary reader; use `both` when applicable.
- Keep headings sentence case. Prefer short sections over long prose.
- Call out commands with fenced code blocks and `bash` / `js` info strings.
- End with a **Next Steps** section when follow-up guidance exists.

## 3. Cross-Link Intentionally
- Use relative links, e.g. `[Hyperdrive API](../reference/hyperdrive-api.md)`.
- When referencing code, include inline code ticks: `` `corestore.get()` ``.
- Update cross-section navigation (lists in `docs/index.md`) during the same change.

## 4. Optimise for Retrieval
- Mention canonical component names verbatim (Autobase, Hypercore, etc.).
- Highlight key nouns and verbs early in paragraphs so embeddings pick them up.
- Add glossaries or quick tables when a document introduces new terminology.

## 5. Review Checklist
- ✅ Example commands run as written (or are marked as pseudo-code).
- ✅ Links resolve locally.
- ✅ Metadata (`updated`) matches the current date.
- ✅ Changes recorded in `docs/index.md`.
- ✅ Commit message summarises the intent, not just the files touched.

## 6. Ready for LLM Pairing
- Share `docs/meta/llm-usage.md` with the assistant before collaborative work.
- Point the model to specific sections rather than whole directories.
- Capture effective prompt snippets in `docs/templates/prompt-snippets.md` (create if needed).

Keeping to this flow ensures that every new addition slots cleanly into the growing knowledge base.

## Next Steps
- Prime collaborators with the [LLM Usage Playbook](llm-usage.md).
- Update `../index.md` immediately after publishing new material.
- Capture reusable snippets in `../templates/doc-template.md`.
