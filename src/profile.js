import { run, setConfig, unsetConfig } from "./git.js";
import { credentialUrl, providerName } from "./providers.js";

/** Quote a path for use inside core.sshCommand. */
const shQuote = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

export function sshCommandFor(keyPath) {
  return `ssh -i ${shQuote(keyPath)} -o IdentitiesOnly=yes`;
}

/**
 * Apply a profile to git config. Everything here is standard git, so it works with
 * any host and any credential helper (GCM, osxkeychain, libsecret, store, ...).
 *  - credential.<https://host>.username picks which stored credential git uses
 *  - user.name / user.email set the commit identity
 *  - core.sshCommand picks the SSH key for ssh remotes
 * Returns a list of human readable steps that were performed.
 */
export function applyProfile(profile, { scope = "global" } = {}) {
  const steps = [];
  const { host, username, gitName, gitEmail, sshKey } = profile;

  setConfig(`credential.${credentialUrl(host)}.username`, username, scope);
  steps.push(`credential username for ${credentialUrl(host)} -> ${username}`);

  if (gitName) {
    setConfig("user.name", gitName, scope);
    steps.push(`user.name -> ${gitName}`);
  }
  if (gitEmail) {
    setConfig("user.email", gitEmail, scope);
    steps.push(`user.email -> ${gitEmail}`);
  }
  if (sshKey) {
    setConfig("core.sshCommand", sshCommandFor(sshKey), scope);
    steps.push(`core.sshCommand -> ssh key ${sshKey}`);
  }

  const bridged = bridgeNativeCli(host, username);
  if (bridged) steps.push(bridged);
  return steps;
}

/** Remove what applyProfile set for a host (identity is left alone). */
export function clearHost(host, { scope = "global" } = {}) {
  unsetConfig(`credential.${credentialUrl(host)}.username`, scope);
}

/**
 * Optional convenience: if the provider's own CLI is installed and already logged in
 * to that account, keep it in sync. Never required and never fatal.
 */
function bridgeNativeCli(host, username) {
  const cli = host === "github.com" ? ["gh", ["auth", "switch", "--hostname", host, "--user", username]] : null;
  if (!cli) return null;
  const r = run(cli[0], cli[1]);
  return r.ok ? `${cli[0]} switched to ${username} on ${providerName(host)}` : null;
}
