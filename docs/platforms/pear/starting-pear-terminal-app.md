---
title: Starting a Pear Terminal Project
summary: Scaffold and run a Bare-based Pear terminal application with automatic reload.
tags: [pear, terminal, onboarding]
updated: 2025-10-18
audience: both
---

# Starting a Pear Terminal Project

> **Context Card**
> - **Scope:** Scaffold and run a Pear terminal application with live reload.
> - **Primary APIs:** `pear init --type terminal`, `pear dev`, `pear build`.
> - **Protocols/Feeds:** Prepared to wire Hyper services via Autobase or Protomux once added.
> - **Dependencies:** Pear CLI, Bare runtime, Node.js ≥18.
> - **Outputs:** Terminal project skeleton, running dev session, packaged build.
> - **Next Hop:** [`making-pear-terminal-app.md`](making-pear-terminal-app.md)

Use this quickstart to initialise a Pear terminal app before adding custom networking or Autobase logic. Continue with [Making a Pear Terminal Application](making-pear-terminal-app.md) once the scaffold runs.

## Step 1 – Initialise the Project
1. Create a new directory and run the terminal template:
   ```bash
   mkdir chat-terminal
   cd chat-terminal
   pear init --yes --type terminal
   ```
2. Generated files:
   - `package.json` — contains the `pear` config block tailored for Bare.
   - `index.js` — terminal entry point.
   - `test/index.test.js` — TAP-style test skeleton.

## Step 2 – Install Dependencies
1. Install the default modules:
   ```bash
   npm install
   ```
2. These dependencies include `pear-interface` (editor hints) and `brittle` for testing. Add additional Bare modules (e.g., `bare-readline`) as needed later.

## Step 3 – Run in Development Mode
1. Launch the app from disk:
   ```bash
   pear run --dev .
   ```
2. Development mode enables automatic reload and logs runtime events to the terminal.
3. Edit `index.js` and the process reloads on save. For example, replace the default log line with `console.log('hello, Pear terminal!')`.

## Step 4 – Wire Live Reload Hooks
Ensure `index.js` has the following snippet to restart the app when staged changes occur:
```js
Pear.updates(() => Pear.reload())
```
This mirrors the desktop workflow and keeps BLE devices or CLI dashboards in sync during development.

## Step 5 – Configure Project Metadata
Open `package.json` and adjust:
```json
{
  "pear": {
    "args": ["--help"],
    "stage": {
      "ignore": ["tmp", "logs"]
    }
  }
}
```
- `pear.args` passes default arguments when the app runs.
- `pear.stage.ignore` ensures transient directories are excluded from staging.

## Next Steps
- Extend the scaffold in [Making a Pear Terminal Application](making-pear-terminal-app.md).
- Prepare distribution via [Sharing a Pear Application](sharing-pear-application.md).
- Capture debugging tips in [Debugging Pear Applications](debugging-pear-app.md).
