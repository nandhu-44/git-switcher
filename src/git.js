import { spawnSync } from "node:child_process";

/** Run a program without a shell. Never throws. */
export function run(bin, args, { cwd, input } = {}) {
  const r = spawnSync(bin, args, { cwd, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  if (r.error) {
    return { ok: false, code: 1, missing: r.error.code === "ENOENT", stdout: "", stderr: r.error.message };
  }
  return { ok: r.status === 0, code: r.status ?? 1, missing: false, stdout: (r.stdout || "").trim(), stderr: (r.stderr || "").trim() };
}

export const git = (args, opts) => run("git", args, opts);

export function gitVersion() {
  const r = git(["--version"]);
  return r.ok ? r.stdout.replace(/^git version\s+/, "") : null;
}

const scopeFlag = (scope) => (scope === "local" ? "--local" : "--global");

export function getConfig(key, scope) {
  const r = git(["config", ...(scope ? [scopeFlag(scope)] : []), "--get", key]);
  return r.ok ? r.stdout : null;
}

export function setConfig(key, value, scope = "global") {
  const r = git(["config", scopeFlag(scope), key, value]);
  if (!r.ok) throw new Error(`git config ${key} failed: ${r.stderr}`);
}

export function unsetConfig(key, scope = "global") {
  // exit code 5 means "key not set", which is fine.
  const r = git(["config", scopeFlag(scope), "--unset-all", key]);
  if (!r.ok && r.code !== 5) throw new Error(`git config --unset ${key} failed: ${r.stderr}`);
}

/** All `credential.<url>.username` entries visible to git, as [{ url, username }]. */
export function credentialUsernames(scope) {
  const r = git(["config", ...(scope ? [scopeFlag(scope)] : []), "--get-regexp", "^credential\\..+\\.username$"]);
  if (!r.ok) return [];
  return r.stdout.split("\n").flatMap((line) => {
    const m = /^credential\.(.+)\.username\s+(.*)$/i.exec(line);
    return m ? [{ url: m[1], username: m[2] }] : [];
  });
}

export function inRepo(cwd = process.cwd()) {
  return git(["rev-parse", "--is-inside-work-tree"], { cwd }).stdout === "true";
}

export function remoteUrl(name = "origin", cwd = process.cwd()) {
  const r = git(["remote", "get-url", name], { cwd });
  return r.ok ? r.stdout : null;
}
