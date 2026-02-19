const { spawnSync } = require("node:child_process");

function checkBinary(binary, versionArgs = ["--version"]) {
  const result = spawnSync(binary, versionArgs, {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.error) {
    return {
      ok: false,
      reason: result.error.code === "ENOENT" ? "not-found" : result.error.message,
    };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      reason: (result.stderr || result.stdout || "unknown error").trim(),
    };
  }

  return {
    ok: true,
    output: (result.stdout || result.stderr || "").trim(),
  };
}

const checks = [
  {
    name: "git",
    installHint: "Install Git: https://git-scm.com/downloads",
  },
  {
    name: "gh",
    installHint: "Install GitHub CLI: https://cli.github.com/",
  },
];

const missing = [];

console.log("[git-switcher] Running postinstall checks...");

for (const check of checks) {
  const status = checkBinary(check.name);
  if (status.ok) {
    console.log(`[git-switcher] ✓ ${check.name} found`);
    continue;
  }

  console.warn(`[git-switcher] ! ${check.name} not available (${status.reason})`);
  console.warn(`[git-switcher]   ${check.installHint}`);
  missing.push(check.name);
}

if (missing.length > 0) {
  console.log(
    `\n[git-switcher] Missing required tools for runtime usage: ${missing.join(", ")}\n`
  );
  console.log(
    "[git-switcher] Package installed successfully. Install missing tools later to use all features."
  );
  process.exit(0);
}

console.log("[git-switcher] All required tools are installed.");
