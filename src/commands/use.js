const { ensureGh, ensureGit, getCurrentGhUser } = require("../utils/process");
const { setupGitAuth, switchGhAccount } = require("../utils/gitHubCli");
const { setGitIdentity } = require("../utils/gitConfig");
const { loadConfig } = require("../utils/config");

function registerUseCommand(program) {
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
}

module.exports = {
  registerUseCommand,
};
