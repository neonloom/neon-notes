---
title: Building Pear App Templates
summary: How to author reusable pear:// templates with prompts and defaults for new applications.
tags: [pear, templates, platform]
updated: 2025-10-18
audience: both
---

# Building Pear App Templates

> **Context Card**
> - **Scope:** Author reusable Pear templates with prompts, defaults, and scaffolding.
> - **Primary APIs:** Template manifest (`_template.json`), `pear init --template`, post-gen scripts.
> - **Protocols/Feeds:** Enables consistent Hyper/Autobase wiring across generated projects.
> - **Dependencies:** Pear CLI, template repository layout, optional pear:// hosting.
> - **Outputs:** Template packages, generation prompts, standardized project structure.
> - **Next Hop:** [`pear-cli.md`](pear-cli.md)

Create reusable templates to bootstrap Pear applications with consistent structure, dependencies, and configuration. Templates can be hosted as pear links or kept locally for team workflows.

## Template Anatomy
- `_template.json` — describes prompts, default values, and file substitutions.
- `package.json` — base configuration merged into the generated project.
- `files/` — directory containing the actual scaffolded files (supports variable interpolation).
- `scripts/` — optional helper scripts invoked post-generation (e.g., install dependencies).

## Designing `_template.json`
Example structure:
```json
{
  "name": "pear-chat-template",
  "description": "Starter chat app with Hyperswarm wiring",
  "prompts": [
    { "name": "appName", "message": "App name", "default": "pear-chat" },
    { "name": "channel", "message": "Default stage channel", "default": "dev" },
    { "name": "enableTerminal", "message": "Include terminal workspace?", "type": "confirm", "default": true }
  ]
}
```
- Prompt values become locals accessible in files via `{{ appName }}`.
- Use booleans to conditionally include files or code blocks.

## Packaging the Template
1. Place template files in a directory.
2. Generate Pear metadata:
   ```bash
   pear init --type desktop --force ./template-shell
   ```
   Replace the generated contents with your template files.
3. Stage the template:
   ```bash
   pear stage template ./template-shell
   ```
4. Share the resulting pear link. Consumers can run:
   ```bash
   pear init pear://<template-link>
   ```

## Local Development Workflow
- For private repositories, keep templates in `templates/` and reference them with `pear init ./templates/chat`.
- Automate dependency installs by adding a `postInstall` script in `_template.json` that runs `npm install`.
- Version templates by staging to `template/v1`, `template/v2`, etc., documenting changes in release notes.

## Updating Templates
1. Pull the latest template files.
2. Apply changes (new dependencies, updated docs).
3. Increment any version markers in `_template.json` or `package.json`.
4. Restage to the same channel to override or a new channel to preserve history.

## Next Steps
- Point new teammates to [Getting Started with Pear](getting-started.md) before using templates.
- Showcase template usage in [Starting a Pear Desktop Project](starting-desktop-application.md) or [Starting a Pear Terminal Project](starting-pear-terminal-app.md).
- Maintain template documentation alongside [Pear Application Best Practices](best-practices.md).
