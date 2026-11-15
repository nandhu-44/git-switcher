import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hostFromRemote, normalizeHost, resolveHost } from "../src/providers.js";

const bin = fileURLToPath(new URL("../bin/index.js", import.meta.url));
let home, env;

before(() => {
  home = mkdtempSync(path.join(os.tmpdir(), "gsw-"));
  writeFileSync(path.join(home, ".gitconfig"), "");
  env = { ...process.env, HOME: home, USERPROFILE: home, GIT_CONFIG_GLOBAL: path.join(home, ".gitconfig"), GIT_CONFIG_NOSYSTEM: "1", GIT_SWITCHER_HOME: path.join(home, ".gs"), PATH: process.env.PATH };
});
after(() => rmSync(home, { recursive: true, force: true }));

const gs = (...args) => spawnSync(process.execPath, [bin, ...args], { env, encoding: "utf8", cwd: home });
const gitCfg = (key) => spawnSync("git", ["config", "--global", "--get", key], { env, encoding: "utf8" }).stdout.trim();

test("hostFromRemote handles https, ssh and scp-style urls on any provider", () => {
  assert.equal(hostFromRemote("https://github.com/a/b.git"), "github.com");
  assert.equal(hostFromRemote("https://user@bitbucket.org/a/b.git"), "bitbucket.org");
  assert.equal(hostFromRemote("git@gitlab.com:a/b.git"), "gitlab.com");
  assert.equal(hostFromRemote("ssh://git@git.example.com:2222/a/b.git"), "git.example.com");
  assert.equal(hostFromRemote("https://dev.azure.com/org/proj/_git/repo"), "dev.azure.com");
  assert.equal(hostFromRemote("/local/path"), null);
});

test("normalizeHost and resolveHost", () => {
  assert.equal(normalizeHost("https://GitLab.Example.com/"), "gitlab.example.com");
  assert.equal(normalizeHost("bad host"), null);
  assert.equal(resolveHost({}), "github.com");
  assert.equal(resolveHost({ provider: "gitlab" }), "gitlab.com");
  assert.equal(resolveHost({ provider: "gitlab", host: "git.corp.io" }), "git.corp.io");
  assert.throws(() => resolveHost({ provider: "nope" }), /Unknown provider/);
});

test("alias-add + use pins credential username and identity for a non-GitHub host", () => {
  assert.equal(gs("alias-add", "work", "jdoe", "--provider", "gitlab", "--git-name", "J Doe", "--git-email", "j@work.io").status, 0);
  const r = gs("use", "work");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(gitCfg("credential.https://gitlab.com.username"), "jdoe");
  assert.equal(gitCfg("user.name"), "J Doe");
  assert.equal(gitCfg("user.email"), "j@work.io");
});

test("switch supports custom hosts and ssh keys", () => {
  const r = gs("switch", "me", "--host", "git.corp.io", "--ssh-key", "/keys/it's");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(gitCfg("credential.https://git.corp.io.username"), "me");
  assert.match(gitCfg("core.sshCommand"), /IdentitiesOnly=yes/);
});

test("list and aliases show saved profiles", () => {
  assert.match(gs("aliases").stdout, /work -> jdoe@gitlab\.com/);
  assert.match(gs("list").stdout, /gitlab\.com\s+jdoe\s+\[work\]/);
});

test("v1 config (account field, GitHub implied) still loads", () => {
  writeFileSync(path.join(home, ".gs", "config.json"), JSON.stringify({ aliases: { old: { account: "octo", gitName: null, gitEmail: null } } }));
  assert.match(gs("aliases").stdout, /old -> octo@github\.com/);
});

test("alias-rm, unknown alias and unknown command fail cleanly", () => {
  assert.equal(gs("alias-rm", "old").status, 0);
  assert.equal(gs("use", "old").status, 2);
  assert.equal(gs("bogus").status, 2);
});

test("setup reports an existing helper; doctor runs", () => {
  spawnSync("git", ["config", "--global", "credential.helper", "store"], { env });
  assert.match(gs("setup").stdout, /already configured: store/);
  assert.match(gs("doctor").stdout, /ok git/);
});

test("--local applies to the repository only", () => {
  const repo = path.join(home, "repo");
  spawnSync("git", ["init", "-q", repo], { env });
  const r = spawnSync(process.execPath, [bin, "switch", "bob", "--local", "--git-email", "b@x.io"], { env, cwd: repo, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const local = spawnSync("git", ["config", "--local", "--get", "user.email"], { env, cwd: repo, encoding: "utf8" }).stdout.trim();
  assert.equal(local, "b@x.io");
  assert.notEqual(gitCfg("user.email"), "b@x.io");
});
