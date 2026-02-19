const { spawnSync } = require("node:child_process");

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

module.exports = {
  runBinary,
  ensureGh,
  ensureGit,
  getCurrentGhUser,
  parseAccountsFromStatus,
  listAccountsFromGhStatus,
};
