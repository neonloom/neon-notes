---
title: Documentation Template
summary: Standard Markdown skeleton for new guides, references, and walkthroughs.
tags: [template, documentation]
updated: 2025-10-18
audience: both
---

# Document Template

Copy this scaffold into a new file and fill in the sections that make sense for the topic. Delete unused headings before publishing.

```markdown
---
title: <Short Title>
summary: <What this doc teaches or enables in one sentence>
tags: [primary-topic, optional-topic]
updated: YYYY-MM-DD
audience: human | llm | both
---

# Overview
Briefly describe the problem space, prerequisites, and outcomes.

## Prerequisites
- Item 1
- Item 2

## Procedure
1. Step one with inline commands like `npm install`.
2. Step two with a fenced block:
   ```bash
   command --flag
   ```
3. Step three with checkpoints or callouts.

## Reference Notes
- Link to related API sheets, guides, or examples.
- Capture edge cases or gotchas in short bullet points.

## Next Steps
- Suggest follow-on docs or tasks.
- Leave TODO markers when follow-up work is planned.
```

For API reference files, replace **Procedure** with **Methods** or **Options** tables. For walkthroughs, keep numbered instructions concise and action-oriented.

## Next Steps
- Cross-check publishing steps in `../meta/authoring-guide.md`.
- Add completed docs to `../index.md` after filling this template.
