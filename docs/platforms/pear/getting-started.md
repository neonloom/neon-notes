---
title: Getting Started with Pear
summary: Install the Pear runtime and verify your environment across desktop and terminal platforms.
tags: [pear, onboarding, platform]
updated: 2025-10-18
audience: both
---

# Getting Started

> **Context Card**
> - **Scope:** Install Pear runtime and validate environment for desktop/terminal apps.
> - **Primary APIs:** `npm install -g pear`, `pear doctor`, `pear --version`.
> - **Protocols/Feeds:** Preps environment for Hyper/Autobase-powered Pear apps.
> - **Dependencies:** Node.js ≥18, npm, Pear runtime binaries.
> - **Outputs:** Verified Pear install, initial runtime checks, next-step pointers.
> - **Next Hop:** [`pear-cli.md`](pear-cli.md)

Pear Runtime can be installed via [npm](https://www.npmjs.com/).

Since `npm` (or equivalent package manager) is needed to install application dependencies this guide will walk through installing `pear` with `npm`.

{% embed url="<https://www.youtube.com/watch?v=y2G97xz78gU>" %}

Build with Pear - Episode 01: Developing with Pear

## Requirements

Pear runs on Windows, Mac and Linux.

Linux requires the `libatomic` library which can be installed using:

Debian/Ubuntu:

```console
sudo apt install libatomic1
```

RHEL/CentOS:

```console
sudo yum install libatomic
```

Fedora:

```console
sudo dnf install libatomic
```

Alpine Linux:

```console
sudo apk add libatomic
```

Arch Linux:

```console
sudo pacman -S libatomic_ops
```

The `pear` CLI can be installed from [npm](https://www.npmjs.com/), which comes with [`node`](https://nodejs.org/en/about).

The `npm` package manager can also be used to install application dependencies later on.

On MacOS and Linux, we recommend installing `node` using [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating)

On Windows we recommend installing `node` with [`nvs`](https://github.com/jasongin/nvs#setup).

> The Pear Runtime does not rely on `node`, `node` is only needed to install and run the `npm` package manager.

## Setup

To install Pear run the following command:

```sh
npm i -g pear
```

To complete the setup, run the `pear` command.

```
pear
```

If a Pear application, such as [Keet](https://keet.io), is already installed then the Pear platform is already available. In this case, running `pear` should show help output.

If not, the first run of `pear` will fetch the platform from peers, after which running `pear` again should output help information.

To check that Pear is fully working, try the following command:

```
pear run pear://keet
```

Pear loads applications from peers, so this command should open [Keet](https://keet.io) whether or not it was downloaded and installed beforehand.

## Next Steps
- Follow [Starting a Pear Desktop Project](starting-desktop-application.md) to build a GUI app.
- Explore [Starting a Pear Terminal Project](starting-pear-terminal-app.md) for CLI-focused workflows.
- Review [Pear Application Configuration](app-config-and-package-json.md) before staging.
