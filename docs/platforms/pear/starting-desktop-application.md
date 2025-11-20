---
title: Starting a Pear Desktop Project
summary: Generate, configure, and live-reload a Pear desktop starter app before adding domain logic.
tags: [pear, desktop, onboarding]
updated: 2025-10-18
audience: both
---

# Starting a Pear Desktop Project

> **Context Card**
> - **Scope:** Scaffold and run a Pear desktop starter app with live reload.
> - **Primary APIs:** `pear init`, `pear dev`, `pear build`, project config files.
> - **Protocols/Feeds:** Integrates with Hyper services via bundled bridges once configured.
> - **Dependencies:** Pear CLI, Node.js ≥18, desktop runtime prerequisites.
> - **Outputs:** Bootstrapped desktop project, running dev server, build artefacts.
> - **Next Hop:** [`making-pear-application.md`](making-pear-application.md)

This section shows how to generate, configure, and develop a Pear desktop project, in preparation for [Making a Pear Desktop Application](making-pear-application.md).

{% embed url="<https://www.youtube.com/watch?v=y2G97xz78gU>" %}

Build with Pear - Episode 01: Developing with Pear

## Step 1. Initialization

Use `pear init` to create a new Pear project.

```
mkdir chat
cd chat
pear init --yes
```

This creates the base project structure.

* `package.json`. App configuration. Notice the `pear` property.
* `index.html`. App entrypoint.
* `app.js`. Main code.
* `test/index.test.js`. Test skeleton.

## Step 2. Verify Everything Works

Use `pear run` to verify everything works as expected.

```
pear run --dev .
```

> A directory or link needs to be specified with `pear run`, here `.` denotes the current Project directory.

The app should open in development mode. In this mode developer tools are also opened.

![Running pear run --dev .](https://1301247912-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fjdab83NqbLtX0WX9qY2n%2Fuploads%2Fgit-blob-bb2ac638a4339d32c410b9f9d5b544e1484ae808%2Fchat-app-1.png?alt=media)

## Step 3. Automatic Reload

To enable automatic reloading, add the following lines to `app.js` :

```js
Pear.updates(() => Pear.reload())
```

Run the app again using:

```js
pear run --dev .
```

Now Pear watches project files. When they change, the app is automatically reloaded.

While keeping the `pear run --dev .` command running, open `index.html` in an editor.

Change `<h1>desktop</h1>` to `<h1>Hello world</h1>`.

The app should now show:

![Automatic reload](https://1301247912-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fjdab83NqbLtX0WX9qY2n%2Fuploads%2Fgit-blob-a8cf55dd030d06447d748c7ab6991f055f5c9453%2Fchat-app-2.png?alt=media)

> Live reload with hot-module reloading is possible by using the `pear.watch` configuration and the [`pear.updates`](https://docs.pears.com/pear-runtime/api#pear.updates-listener-less-than-async-function-or-function-greater-than-greater-than-streamx.readabl) API. The [pear-hotmods](https://github.com/holepunchto/pear-hotmods) convenience module can also be used.

## Step 4. Configuration

Application configuration is under the `pear` property in `package.json`

Open `package.json` and update it to:

```
{
  ...
  "pear": {
    "gui": {
      "height": 400,
      "width": 700
    }
  }
  ...
}
```

Close the app and re-run `pear run --dev .` to see the changes, the initial window size is different now.

See [Pear Application Configuration](app-config-and-package-json.md) for all options.

## Next Steps
- Continue with [Making a Pear Desktop Application](making-pear-application.md).
- Prepare distribution using [Sharing a Pear Application](sharing-pear-application.md).
- Capture debugging habits from [Debugging Pear Applications](debugging-pear-app.md).
