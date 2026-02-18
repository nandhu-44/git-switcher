#!/usr/bin/env node

const { Command } = require("commander");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const APP_NAME = "git-switcher";
const CONFIG_DIR = path.join(os.homedir(), ".git-switcher");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

function runBinary(binary, args, options = {}) {
  const result = spawnSync(binary, args, {
    encoding: "utf8",
    stdio: options.stdio || "pipe",
  });

  if (result.error) {
    return {
      ok: false,
      code: 1,
      stdout: "",
      stderr: result.error.message,
    };
  }

  return {
    ok: result.status === 0,
    code: result.status || 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

function requireBinary(binary, installHint) {
  const check = process.platform === "win32"
    ? runBinary("where", [binary])
    : runBinary("which", [binary]);

  if (!check.ok) {
    console.error(`Missing required binary: ${binary}`);
    console.error(installHint);
    process.exit(1);
  }
}

function ensureGh() {
  requireBinary("gh", "Install GitHub CLI: https://cli.github.com/");
}

function ensureGit() {
  requireBinary("git", "Install Git: https://git-scm.com/downloads");
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_PATH)) {
    return { aliases: {} };
  }

  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!parsed.aliases || typeof parsed.aliases !== "object") {
      return { aliases: {} };
    }
    return parsed;
  } catch {
    return { aliases: {} };
  }
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function getCurrentGhUser() {
  const result = runBinary("gh", ["api", "user", "--jq", ".login"]);
  if (!result.ok) {
    return null;
  }
  return result.stdout || null;
}

function parseAccountsFromStatus(statusText) {
  const set = new Set();
  const patterns = [/account\s+([A-Za-z0-9-]+)/gi, /as\s+([A-Za-z0-9-]+)/gi];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(statusText)) !== null) {
      set.add(match[1]);
    }
  }

  return [...set];
}

function listAccountsFromGhStatus() {
  const result = runBinary("gh", ["auth", "status"]);
  if (!result.ok) {
    return [];
  }
  return parseAccountsFromStatus(`${result.stdout}\n${result.stderr}`);
}

function setupGitAuth() {
  const result = runBinary("gh", ["auth", "setup-git"], { stdio: "inherit" });
  if (!result.ok) {
    process.exit(result.code || 1);
  }
}

function switchGhAccount(account) {
  const result = runBinary("gh", ["auth", "switch", "--user", account], { stdio: "inherit" });
  if (!result.ok) {
    process.exit(result.code || 1);
  }
}

function setGitIdentity(gitName, gitEmail) {
  if (gitName) {
    const setName = runBinary("git", ["config", "--global", "user.name", gitName], { stdio: "inherit" });
    if (!setName.ok) {
      process.exit(setName.code || 1);
    }
  }

  if (gitEmail) {
    const setEmail = runBinary("git", ["config", "--global", "user.email", gitEmail], { stdio: "inherit" });
    if (!setEmail.ok) {
      process.exit(setEmail.code || 1);
    }
  }
}

const program = new Command();

program
  .name(APP_NAME)
  .description("Switch and manage multiple GitHub accounts using GitHub CLI")
  .version("1.1.0");

program
  .command("doctor")
  .description("Check required tools and authentication status")
  .action(() => {
    console.log("Checking dependencies...");
    ensureGh();
    ensureGit();

    const authStatus = runBinary("gh", ["auth", "status"]);
    if (authStatus.ok) {
      console.log("- gh: OK");
      console.log("- git: OK");
      const current = getCurrentGhUser();
      if (current) {
        console.log(`- current GitHub account: ${current}`);
      }
      return;
    }

    console.error("- gh auth: not ready");
    console.error("Run: gh auth login");
    process.exit(1);
  });

program
  .command("status")
  .description("Show active GitHub account and auth status")
  .action(() => {
    ensureGh();

    const current = getCurrentGhUser();
    if (current) {
      console.log(`Current account: ${current}`);
    } else {
      console.log("No active GitHub account found.");
    }

    const status = runBinary("gh", ["auth", "status"], { stdio: "inherit" });
    if (!status.ok) {
      process.exit(status.code || 1);
    }
  });

program
  .command("list")
  .description("List accounts detected from gh auth status")
  .action(() => {
    ensureGh();
    const accounts = listAccountsFromGhStatus();

    if (accounts.length === 0) {
      console.log("No accounts detected from gh auth status.");
      return;
    }

    const current = getCurrentGhUser();
    accounts.forEach((account) => {
      const marker = current === account ? "*" : " ";
      console.log(`${marker} ${account}`);
    });
  });

program
  .command("switch <account>")
  .description("Switch active gh account")
  .option("--setup-git", "Run gh auth setup-git after switching")
  .option("--git-name <name>", "Set global git user.name")
  .option("--git-email <email>", "Set global git user.email")
  .action((account, options) => {
    ensureGh();
    ensureGit();

    console.log(`Switching GitHub account to ${account}...`);
    switchGhAccount(account);

    if (options.setupGit) {
      setupGitAuth();
    }

    setGitIdentity(options.gitName, options.gitEmail);

    const current = getCurrentGhUser();
    if (current) {
      console.log(`Active account: ${current}`);
    }
  });

program
  .command("setup")
  .description("Run gh auth setup-git")
  .action(() => {
    ensureGh();
    setupGitAuth();
    console.log("Git credential helper configured through gh.");
  });

program
  .command("alias-add <alias> <account>")
  .description("Save an alias profile for a GitHub account")
  .option("--git-name <name>", "Default global git user.name for this alias")
  .option("--git-email <email>", "Default global git user.email for this alias")
  .action((alias, account, options) => {
    const config = loadConfig();

    config.aliases[alias] = {
      account,
      gitName: options.gitName || null,
      gitEmail: options.gitEmail || null,
    };

    saveConfig(config);
    console.log(`Alias saved: ${alias} -> ${account}`);
  });

program
  .command("alias-rm <alias>")
  .description("Remove an alias profile")
  .action((alias) => {
    const config = loadConfig();

    if (!config.aliases[alias]) {
      console.error(`Alias not found: ${alias}`);
      process.exit(1);
    }

    delete config.aliases[alias];
    saveConfig(config);
    console.log(`Alias removed: ${alias}`);
  });

program
  .command("aliases")
  .description("List saved alias profiles")
  .action(() => {
    const config = loadConfig();
    const entries = Object.entries(config.aliases);

    if (entries.length === 0) {
      console.log("No aliases saved.");
      return;
    }

    for (const [alias, profile] of entries) {
      const parts = [`${alias} -> ${profile.account}`];
      if (profile.gitName) {
        parts.push(`name=${profile.gitName}`);
      }
      if (profile.gitEmail) {
        parts.push(`email=${profile.gitEmail}`);
      }
      console.log(parts.join(" | "));
    }
  });

program
  .command("use <alias>")
  .description("Switch account using a saved alias profile")
  .option("--skip-setup", "Skip gh auth setup-git")
  .action((alias, options) => {
    ensureGh();
    ensureGit();

    const config = loadConfig();
    const profile = config.aliases[alias];

    if (!profile) {
      console.error(`Alias not found: ${alias}`);
      process.exit(1);
    }

    console.log(`Using alias ${alias} (${profile.account})...`);
    switchGhAccount(profile.account);

    if (!options.skipSetup) {
      setupGitAuth();
    }

    setGitIdentity(profile.gitName, profile.gitEmail);

    const current = getCurrentGhUser();
    if (current) {
      console.log(`Active account: ${current}`);
    }
  });

program.parse(process.argv);
