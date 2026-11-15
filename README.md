# git-switcher

[![npm version](https://img.shields.io/npm/v/%40n44%2Fgit-switcher)](https://www.npmjs.com/package/@n44/git-switcher)
![dependencies](https://img.shields.io/badge/dependencies-0-2ea44f)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Switch between multiple Git accounts on **GitHub, GitLab, Bitbucket, Azure DevOps, Codeberg, Gitea, SourceHut or any self-hosted server**. Zero dependencies, and no provider CLI (like `gh`) required.

## How it works

Everything is plain `git config`, so it works with any host and any credential helper (Git Credential Manager, macOS Keychain, libsecret, `store`):

- `credential.https://<host>.username` tells git which stored credential to use for that host
- `user.name` / `user.email` set the commit identity
- `core.sshCommand` selects an SSH key for `ssh` remotes (optional)

If the `gh` CLI happens to be installed, it is kept in sync for GitHub accounts as a bonus. Nothing needs it.

## Install

```bash
npm install -g @n44/git-switcher
```

Or run once without installing:

```bash
npx @n44/git-switcher doctor
```

Requires Node.js 18+ and `git` on your `PATH`. Update with `git-switcher update --run`.

## Usage

Available as `git-switcher`, `git switcher`, `gs` and `git s`.

```bash
# save profiles (host defaults to github.com)
gs alias-add personal octocat --git-name "Octo Cat" --git-email "octo@example.com"
gs alias-add work jdoe --provider gitlab --git-email "j@work.io" --ssh-key ~/.ssh/id_work
gs alias-add corp me --host git.corp.example.com

# switch
gs use work
gs use                 # auto-pick the profile matching this repo's remote host
gs use work --local    # only for the current repository

# one-off switch without a saved profile
gs switch jdoe --provider bitbucket
```

| Command | Description |
| --- | --- |
| `doctor` | Check git, credential helper, identity and profiles |
| `status` | Show identity, account per host, and this repo's remote |
| `list` | List known accounts (`*` = currently pinned) |
| `aliases` | List saved profiles |
| `alias-add <alias> <user>` | Save a profile (`--provider`, `--host`, `--git-name`, `--git-email`, `--ssh-key`) |
| `alias-rm <alias>` | Remove a profile |
| `use [alias]` | Activate a profile (`--local` for this repo only) |
| `switch <user>` | Activate an account directly (same options as `alias-add`, plus `--local`) |
| `setup` | Configure a credential helper if none is set (`--helper <name>`) |
| `update` | Print (or `--run`) the global npm update command |

Providers for `--provider`: `github`, `gitlab`, `bitbucket`, `azure`, `codeberg`, `sourcehut`, `gitea`. Use `--host` for anything else.

### First time with a new account

Git asks for a password/token the first time it talks to a host as a new user and your credential helper stores it per username. After that, `gs use <alias>` just selects which stored credential to use. Use a personal access token where the provider requires one.

## Migrating from 1.x

1.x required `gh`. Existing `~/.git-switcher/config.json` aliases keep working (treated as GitHub accounts). The `list` command now reads saved profiles and pinned credentials instead of `gh auth status`.

## Config storage

Profiles live in `~/.git-switcher/config.json` (override the directory with `GIT_SWITCHER_HOME`). No tokens or secrets are stored; those stay in your credential helper.

## Development and releases

```bash
npm test
```

Releases are published to npm by GitHub Actions when a version tag is pushed (`git tag v2.0.0 && git push --tags`), using npm trusted publishing (OIDC, with provenance), so no npm token is stored. One-time setup on npmjs.com: package settings, Trusted Publisher, GitHub Actions, repository `nandhu-44/git-switcher`, workflow `publish.yml`. `.gitlab-ci.yml` runs the tests on GitLab mirrors.
