---
title: Documentation Inbox Workflow
summary: Checklist for staging, filing, and clearing documentation inbox items.
tags: [documentation, process, meta]
updated: 2025-10-21
audience: both
---

# Documentation Inbox Workflow

Use the documentation inbox as a temporary drop-zone when you capture new instructions, transcripts, or code snippets that have not yet been organised under `docs/`. Every note in this space should make it easy for another agent to route or rewrite the material.

## Adding Items
- Capture enough context (source, date, responsible project) inside each file so anyone can classify it later.
- Prefer Markdown or plain text so edits stay merge-friendly. Store binaries elsewhere and leave a pointer here.
- If the note clearly maps to an existing doc, update that file directly instead of parking it in the inbox.

## Processing Workflow
1. Review each item and decide where it belongs in `docs/` (guide, reference, walkthrough, platform note, example, meta, or template).
2. Move or rewrite the material into the correct location, applying the standard front matter and structure from [`docs/meta/authoring-guide.md`](authoring-guide.md).
3. Update cross-links in `docs/index.md` (and any affected navigation lists) so the new material is discoverable.
4. Remove the processed file from the inbox. If more work is needed, leave a short note in the target doc’s **Next Steps** section.

Keeping the inbox clear ensures every project and agent finds the latest information in the organised documentation tree.

## Next Steps
- Coordinate with the [Agent Operations Guide](../../Agents.md) before starting a filing session.
- Log recurring documentation gaps so new guides or references can be scoped.
