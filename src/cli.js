import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { commands, providerList, UsageError } from "./commands.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

function help() {
  const rows = Object.entries(commands).map(([n, c]) => `  ${n.padEnd(11)} ${c.summary}`).join("\n");
  return `git-switcher v${pkg.version}  Switch between multiple Git accounts on any host

Usage
  git-switcher <command> [options]
  git switcher <command>     (also: gs, git-s)

Commands
${rows}

Run "git-switcher <command> -h" for options.
Providers for --provider: ${providerList()}. Use --host for any other server.
Works through plain git config, so no provider CLI is required.`;
}

export async function main(argv = process.argv.slice(2)) {
  const [name, ...rest] = argv;
  if (!name || name === "-h" || name === "--help" || name === "help") return console.log(help());
  if (name === "-v" || name === "--version") return console.log(pkg.version);

  const cmd = commands[name];
  if (!cmd) throw new UsageError(`Unknown command: ${name}\n\n${help()}`);

  const options = { ...(cmd.options || {}), help: { type: "boolean", short: "h" } };
  for (const k of Object.keys(options)) if (typeof options[k] === "string") options[k] = { type: options[k] };
  let parsed;
  try {
    parsed = parseArgs({ args: rest, options, allowPositionals: true });
  } catch (e) {
    throw new UsageError(e.message);
  }
  if (parsed.values.help) return console.log(`${cmd.summary}\n\nUsage: git-switcher ${cmd.usage || name}`);
  await cmd.run({ ...parsed, pkg });
}

export function runCli() {
  main().catch((err) => {
    console.error(`git-switcher: ${err.message}`);
    process.exitCode = err instanceof UsageError ? 2 : 1;
  });
}
