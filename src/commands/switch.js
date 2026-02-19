const { ensureGh, ensureGit, getCurrentGhUser } = require("../utils/process");
const { switchGhAccount, setupGitAuth } = require("../utils/gitHubCli");
const { setGitIdentity } = require("../utils/gitConfig");

function registerSwitchCommand(program) {
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
}

module.exports = {
  registerSwitchCommand,
};
