# git-switcher

[![npm version](https://img.shields.io/npm/v/git-switcher)](https://www.npmjs.com/package/git-switcher)
[![npm downloads](https://img.shields.io/npm/dm/git-switcher)](https://www.npmjs.com/package/git-switcher)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Switch and manage multiple GitHub accounts using GitHub CLI.

## Features

- Switch GitHub account with `gh auth switch`
- Set up Git credential helper with `gh auth setup-git`
- Save named account aliases for faster switching
- Optionally set global `git user.name` and `git user.email`
- Validate your local setup with a built-in doctor command

## Requirements

- Node.js 18+
- [GitHub CLI](https://cli.github.com/)
- [Git](https://git-scm.com/)
- Logged in at least once with `gh auth login`

## Installation

### Global

```bash
npm install -g git-switcher
```

### Local development

```bash
npm install
npm link
```

## CLI names

After global install (or `npm link`), you can run it in any of the following ways:

```bash
git-switcher <command>
```

```bash
git switcher <command>
```

```bash
gs <command>
```

```bash
git s <command>
```

## Commands

### doctor

```bash
git-switcher doctor
```

Checks whether `gh` and `git` are available and verifies authentication status.

### status

```bash
git-switcher status
```

Shows the current active account and `gh auth status`.

### list

```bash
git-switcher list
```

Lists detected authenticated GitHub accounts.

### switch

```bash
git-switcher switch <account>
```

Optional flags:

```bash
git-switcher switch <account> --setup-git
git-switcher switch <account> --git-name "Your Name" --git-email "you@example.com"
```

### setup

```bash
git-switcher setup
```

Runs `gh auth setup-git`.

### alias-add

```bash
git-switcher alias-add <alias> <account>
```

Optional profile fields:

```bash
git-switcher alias-add <alias> <account> --git-name "Your Name" --git-email "you@example.com"
```

### aliases

```bash
git-switcher aliases
```

Lists all saved alias profiles.

### use

```bash
git-switcher use <alias>
```

Optional flag:

```bash
git-switcher use <alias> --skip-setup
```

### alias-rm

```bash
git-switcher alias-rm <alias>
```

Removes a saved alias profile.

## Examples

```bash
# direct account switch
gs switch personal --setup-git

# create reusable profile
gs alias-add work john-work --git-name "John" --git-email "john@company.com"

# switch using saved profile
gs use work
```

## Config storage

Alias profiles are stored in:

```text
~/.git-switcher/config.json
```

This package does not store tokens or secrets.
