import { existsSync } from "node:fs";
import { loadConfig, saveConfig, configPath } from "./config.js";
import {
  run, gitVersion, getConfig, setConfig, credentialUsernames, inRepo, remoteUrl,
} from "./git.js";
import { applyProfile } from "./profile.js";
import { PROVIDERS, hostFromRemote, providerName, resolveHost } from "./providers.js";

export class UsageError extends Error {}

const out = (s = "") => console.log(s);

function scopeOf(values) {
  if (values.local) {
    if (!inRepo()) throw new UsageError("--local needs to be run inside a git repository.");
    return "local";
  }
  return "global";
}

function profileFromOptions(username, values) {
  if (!username) throw new UsageError("A username is required.");
  return {
    host: resolveHost(values),
    username,
    gitName: values["git-name"] || null,
    gitEmail: values["git-email"] || null,
    sshKey: values["ssh-key"] || null,
  };
}

function activate(profile, alias, scope) {
  const steps = applyProfile(profile, { scope });
  for (const s of steps) out(`  - ${s}`);
  if (scope === "global") {
    const config = loadConfig();
    config.active[profile.host] = alias || null;
    saveConfig(config);
  }
  out(`Active on ${providerName(profile.host)}: ${profile.username}${alias ? ` (alias ${alias})` : ""}${scope === "local" ? " [this repository only]" : ""}`);
}

export const commands = {
  doctor: {
    summary: "Check git, credential helper, identity and saved profiles",
    run() {
      let problems = 0;
      const v = gitVersion();
      if (!v) {
        out("x git: not found (install from https://git-scm.com/downloads)");
        process.exitCode = 1;
        return;
      }
      out(`ok git ${v}`);

      const helper = getConfig("credential.helper");
      if (helper) out(`ok credential helper: ${helper}`);
      else { out("! no credential helper configured (run: git-switcher setup)"); problems++; }

      const name = getConfig("user.name");
      const email = getConfig("user.email");
      out(name && email ? `ok identity: ${name} <${email}>` : "! git user.name / user.email not both set globally");
      if (!(name && email)) problems++;

      const { aliases } = loadConfig();
      out(`ok ${Object.keys(aliases).length} saved profile(s) in ${configPath()}`);

      for (const cli of [["gh", "GitHub CLI"], ["glab", "GitLab CLI"]]) {
        out(run(cli[0], ["--version"]).ok ? `ok optional ${cli[1]} found` : `- optional ${cli[1]} not installed (not required)`);
      }
      if (problems) out(`\n${problems} thing(s) to look at.`);
    },
  },

  status: {
    summary: "Show the active identity and credential account per host",
    run() {
      out(`Identity: ${getConfig("user.name") || "(no name)"} <${getConfig("user.email") || "no email"}>`);
      const { aliases, active } = loadConfig();
      const creds = credentialUsernames();
      if (creds.length === 0) out("Credential accounts: none pinned yet (use `git-switcher use <alias>`).");
      for (const c of creds) {
        const host = c.url.replace(/^https?:\/\//, "");
        const alias = active[host] && aliases[active[host]]?.username === c.username ? ` (alias ${active[host]})` : "";
        out(`  ${providerName(host)} [${host}]: ${c.username}${alias}`);
      }
      if (inRepo()) {
        const host = hostFromRemote(remoteUrl());
        if (host) {
          const local = credentialUsernames("local").find((c) => c.url.replace(/^https?:\/\//, "") === host);
          const effective = local?.username || creds.find((c) => c.url.replace(/^https?:\/\//, "") === host)?.username;
          out(`This repo's remote: ${host}${effective ? ` -> account ${effective}` : " (no account pinned)"}`);
        }
      }
    },
  },

  list: {
    summary: "List known accounts (saved profiles and pinned credentials)",
    run() {
      const { aliases } = loadConfig();
      const rows = new Map();
      for (const c of credentialUsernames("global")) {
        const host = c.url.replace(/^https?:\/\//, "");
        rows.set(`${host}\0${c.username}`, { host, username: c.username, current: true, alias: [] });
      }
      for (const [alias, p] of Object.entries(aliases)) {
        const key = `${p.host}\0${p.username}`;
        const row = rows.get(key) || { host: p.host, username: p.username, current: false, alias: [] };
        row.alias.push(alias);
        rows.set(key, row);
      }
      if (rows.size === 0) return out("No accounts known yet. Add one with: git-switcher alias-add <alias> <username>");
      for (const r of rows.values()) {
        out(`${r.current ? "*" : " "} ${r.host.padEnd(18)} ${r.username}${r.alias.length ? `  [${r.alias.join(", ")}]` : ""}`);
      }
    },
  },

  switch: {
    summary: "Switch to an account on a host: switch <username>",
    usage: "switch <username> [--provider github|gitlab|... | --host <host>] [--git-name N] [--git-email E] [--ssh-key PATH] [--local]",
    options: { provider: "string", host: "string", "git-name": "string", "git-email": "string", "ssh-key": "string", local: "boolean" },
    run({ positionals: [username], values }) {
      const profile = profileFromOptions(username, values);
      out(`Switching ${providerName(profile.host)} to ${username}...`);
      activate(profile, null, scopeOf(values));
    },
  },

  use: {
    summary: "Activate a saved alias (auto-detects from the repo remote if omitted)",
    usage: "use [alias] [--local]",
    options: { local: "boolean" },
    run({ positionals: [alias], values }) {
      const { aliases } = loadConfig();
      if (!alias) {
        const host = inRepo() ? hostFromRemote(remoteUrl()) : null;
        const matches = Object.entries(aliases).filter(([, p]) => p.host === host);
        if (!host) throw new UsageError("Pass an alias, or run inside a repository with a remote.");
        if (matches.length !== 1) throw new UsageError(`${matches.length} profiles match ${host}; pass one explicitly: ${matches.map(([n]) => n).join(", ") || "(none saved)"}`);
        alias = matches[0][0];
      }
      const profile = aliases[alias];
      if (!profile) throw new UsageError(`Alias not found: ${alias}`);
      out(`Using alias ${alias} (${profile.username}@${profile.host})...`);
      activate(profile, alias, scopeOf(values));
    },
  },

  "alias-add": {
    summary: "Save a profile: alias-add <alias> <username>",
    usage: "alias-add <alias> <username> [--provider P | --host H] [--git-name N] [--git-email E] [--ssh-key PATH]",
    options: { provider: "string", host: "string", "git-name": "string", "git-email": "string", "ssh-key": "string" },
    run({ positionals: [alias, username], values }) {
      if (!alias || !username) throw new UsageError("Usage: alias-add <alias> <username>");
      if (values["ssh-key"] && !existsSync(values["ssh-key"])) out(`Warning: ssh key not found at ${values["ssh-key"]}`);
      const config = loadConfig();
      config.aliases[alias] = profileFromOptions(username, values);
      saveConfig(config);
      out(`Alias saved: ${alias} -> ${username}@${config.aliases[alias].host}`);
    },
  },

  aliases: {
    summary: "List saved profiles",
    run() {
      const entries = Object.entries(loadConfig().aliases);
      if (entries.length === 0) return out("No aliases saved.");
      for (const [alias, p] of entries) {
        const parts = [`${alias} -> ${p.username}@${p.host}`];
        if (p.gitName) parts.push(`name=${p.gitName}`);
        if (p.gitEmail) parts.push(`email=${p.gitEmail}`);
        if (p.sshKey) parts.push(`ssh=${p.sshKey}`);
        out(parts.join(" | "));
      }
    },
  },

  "alias-rm": {
    summary: "Remove a saved profile",
    usage: "alias-rm <alias>",
    run({ positionals: [alias] }) {
      const config = loadConfig();
      if (!config.aliases[alias]) throw new UsageError(`Alias not found: ${alias}`);
      delete config.aliases[alias];
      saveConfig(config);
      out(`Alias removed: ${alias}`);
    },
  },

  setup: {
    summary: "Make sure a git credential helper is configured",
    usage: "setup [--helper <name>]",
    options: { helper: "string" },
    run({ values }) {
      const current = getConfig("credential.helper");
      if (current && !values.helper) return out(`Credential helper already configured: ${current}`);
      const helper = values.helper || { win32: "manager", darwin: "osxkeychain" }[process.platform];
      if (!helper) {
        out("No credential helper configured. Pick one for your system, for example:");
        out("  git-switcher setup --helper libsecret   # Linux keyring");
        out("  git-switcher setup --helper manager     # Git Credential Manager (any OS, any provider)");
        out("  git-switcher setup --helper store       # plain text file (least secure)");
        process.exitCode = 1;
        return;
      }
      setConfig("credential.helper", helper, "global");
      out(`Credential helper set to: ${helper}`);
    },
  },

  update: {
    summary: "Show (or run with --run) the global npm update command",
    usage: "update [--run]",
    options: { run: "boolean" },
    run({ values, pkg }) {
      const args = ["install", "-g", `${pkg.name}@latest`];
      if (!values.run) {
        out("Run this command to update globally:");
        return out(`npm ${args.join(" ")}`);
      }
      const r = run(process.platform === "win32" ? "npm.cmd" : "npm", args);
      if (!r.ok) throw new Error(`Update failed: ${r.stderr || r.stdout}`);
      out("Update completed.");
    },
  },
};

export const providerList = () => Object.entries(PROVIDERS).map(([k, p]) => `${k} (${p.host})`).join(", ");

