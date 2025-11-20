---
title: Codex CLI Non-Interactive Mode
summary: Automate `codex exec` runs, manage output formats, and resume sessions without manual approvals.
tags: [codex, cli, automation]
updated: 2025-10-21
audience: both
---

# Codex CLI Non-Interactive Mode

Use `codex exec` when you need Codex to run a task end-to-end without prompting for command or edit approvals.

## Running Codex in Non-Interactive Mode
- Run a one-off command:

  ```shell
  codex exec "count the total number of lines of code in this project"
  ```

- By default the command runs in `read-only` mode, so it cannot modify files or access the network.
- Add `--full-auto` to allow file edits. Use `--sandbox danger-full-access` to unlock both writes and networked commands.

## Managing Output
- Standard behaviour streams Codex activity to stderr and only writes the final assistant message to stdout. Use this when piping output into other tools.
- Capture the last message directly with `-o` / `--output-last-message`, either to stdout in addition to stderr or to a file path you supply.

## Streaming JSON Events
Enable structured logging with JSON Lines output:

```shell
codex exec --json "Review the change, look for use-after-free issues"
```

Sample event stream:

```json
{"type":"thread.started","thread_id":"0199a213-81c0-7800-8aa1-bbab2a035a53"}
{"type":"turn.started"}
{"type":"item.completed","item":{"id":"item_0","type":"reasoning","text":"**Searching for README files**"}}
{"type":"item.started","item":{"id":"item_1","type":"command_execution","command":"bash -lc ls","aggregated_output":"","status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_1","type":"command_execution","command":"bash -lc ls","aggregated_output":"2025-09-11\nAGENTS.md\nCHANGELOG.md\ncliff.toml\ncodex-cli\ncodex-rs\ndocs\nexamples\nflake.lock\nflake.nix\nLICENSE\nnode_modules\nNOTICE\npackage.json\npnpm-lock.yaml\npnpm-workspace.yaml\nPNPM.md\nREADME.md\nscripts\nsdk\ntmp\n","exit_code":0,"status":"completed"}}
{"type":"item.completed","item":{"id":"item_2","type":"reasoning","text":"**Checking repository root for README**"}}
{"type":"item.completed","item":{"id":"item_3","type":"agent_message","text":"Yep — there’s a `README.md` in the repository root."}}
{"type":"turn.completed","usage":{"input_tokens":24763,"cached_input_tokens":24448,"output_tokens":122}}
```

Event types include `thread.started`, `turn.started`, `turn.completed`, `turn.failed`, `item.started`, `item.updated`, `item.completed`, and `error`. Item payloads may represent `agent_message`, `reasoning`, `command_execution`, `file_change`, `mcp_tool_call`, `web_search`, or `todo_list` events.

## Structured Output
- Provide a JSON Schema file with `--output-schema` to force the final message to match a specific structure.
- Combine `--output-schema` with `-o` to print only the resulting JSON, or pass a file path to `-o` to save the result.

Example schema:

```json
{
  "type": "object",
  "properties": {
    "project_name": { "type": "string" },
    "programming_languages": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["project_name", "programming_languages"],
  "additionalProperties": false
}
```

```shell
codex exec "Extract details of the project" --output-schema ~/schema.json
```

```json
{"project_name":"Codex CLI","programming_languages":["Rust","TypeScript","Shell"]}
```

## Repository Requirements and Session Resume
- `codex exec` requires a Git repository to prevent destructive changes. Override this check with `--skip-git-repo-check` when you intentionally work outside Git.
- Resume a non-interactive session to reuse conversation context:

  ```shell
  codex exec "Review the change, look for use-after-free issues"
  codex exec resume --last "Fix use-after-free issues"
  ```

  The conversation context carries over, but runtime flags (model, output mode, sandbox) must be supplied again.

## Authentication
Override the default authentication by exporting `CODEX_API_KEY` just for the command:

```shell
CODEX_API_KEY=your-api-key-here codex exec "Fix merge conflict"
```

`CODEX_API_KEY` currently applies only to `codex exec`.
