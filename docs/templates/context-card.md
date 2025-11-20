---
title: Context Card Template
summary: Lightweight header so humans and LLMs can triage a doc quickly.
tags: [template, context]
updated: 2025-10-18
audience: both
---

# Context Card Template

Place this block at the top of any doc (after front matter) to summarise its essentials without consuming much context.

```markdown
> **Context Card**
> - **Scope:** <what this doc covers in 1 clause>
> - **Primary APIs:** `<module.method()>`, `<command --flag>`
> - **Protocols/Feeds:** `<topic>` (writer), `<feed>` (reader)
> - **Dependencies:** `<runtime/library requirements>`
> - **Outputs:** `<artefacts or side effects>`
> - **Next Hop:** [`related-doc.md`](path/to/doc)
```

Adapt bullet labels as needed. Keep it under ~8 bullets so it stays token-friendly.
