import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_HOST } from "./providers.js";

export const configDir = () => process.env.GIT_SWITCHER_HOME || path.join(os.homedir(), ".git-switcher");
export const configPath = () => path.join(configDir(), "config.json");

/** Profiles are stored under `aliases`; v1 profiles used `account` and implied GitHub. */
function normalizeProfile(p) {
  if (!p || typeof p !== "object") return null;
  const username = p.username ?? p.account;
  if (!username) return null;
  return {
    host: p.host || DEFAULT_HOST,
    username: String(username),
    gitName: p.gitName || null,
    gitEmail: p.gitEmail || null,
    sshKey: p.sshKey || null,
  };
}

export function loadConfig() {
  let raw = {};
  try {
    raw = JSON.parse(readFileSync(configPath(), "utf8"));
  } catch {
    /* missing or unreadable: start fresh */
  }
  const aliases = {};
  for (const [name, p] of Object.entries(raw.aliases || {})) {
    const profile = normalizeProfile(p);
    if (profile) aliases[name] = profile;
  }
  return { aliases, active: raw.active && typeof raw.active === "object" ? raw.active : {} };
}

export function saveConfig(config) {
  mkdirSync(configDir(), { recursive: true });
  const tmp = `${configPath()}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  renameSync(tmp, configPath()); // atomic: never leaves a half-written file
}
