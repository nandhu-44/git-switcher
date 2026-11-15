// Provider knowledge is intentionally small: credentials and identity are plain git
// config, so any host works. Providers only add friendly names and sensible defaults.

export const PROVIDERS = {
  github: { name: "GitHub", host: "github.com" },
  gitlab: { name: "GitLab", host: "gitlab.com" },
  bitbucket: { name: "Bitbucket", host: "bitbucket.org" },
  azure: { name: "Azure DevOps", host: "dev.azure.com" },
  codeberg: { name: "Codeberg", host: "codeberg.org" },
  sourcehut: { name: "SourceHut", host: "git.sr.ht" },
  gitea: { name: "Gitea", host: "gitea.com" },
};

export const DEFAULT_HOST = "github.com";

/** Strip scheme, credentials, path and trailing dots/slashes; lowercase the host. */
export function normalizeHost(input) {
  if (!input) return null;
  let h = String(input).trim().toLowerCase();
  h = h.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/^[^@/]*@/, "");
  h = h.split("/")[0].replace(/\.$/, "");
  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d+)?$/.test(h) ? h : null;
}

/** Resolve `--provider` / `--host` into a host. An explicit host wins. */
export function resolveHost({ provider, host } = {}) {
  if (host) {
    const h = normalizeHost(host);
    if (!h) throw new Error(`Invalid host: ${host}`);
    return h;
  }
  if (provider) {
    const p = PROVIDERS[String(provider).toLowerCase()];
    if (!p) throw new Error(`Unknown provider "${provider}". Known: ${Object.keys(PROVIDERS).join(", ")}. Use --host for others.`);
    return p.host;
  }
  return DEFAULT_HOST;
}

export function providerName(host) {
  const found = Object.values(PROVIDERS).find((p) => p.host === host);
  return found ? found.name : host;
}

/** Extract the host from an https/ssh/scp-style git remote URL. */
export function hostFromRemote(url) {
  if (!url) return null;
  const u = url.trim();
  let m = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]*@)?([^/:]+)(?::\d+)?\//i.exec(u); // https://, ssh://
  if (m) return m[1].toLowerCase();
  m = /^(?:[^@/]+@)?([^/:]+):(?!\/\/)/.exec(u); // git@host:owner/repo
  return m ? m[1].toLowerCase() : null;
}

/** The credential config URL for a host, e.g. https://github.com */
export const credentialUrl = (host) => `https://${host}`;
