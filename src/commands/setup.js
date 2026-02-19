const { ensureGh } = require("../utils/process");
const { setupGitAuth } = require("../utils/gitHubCli");

function registerSetupCommand(program) {
  program
    .command("setup")
    .description("Run gh auth setup-git")
    .action(() => {
      ensureGh();
      setupGitAuth();
      console.log("Git credential helper configured through gh.");
    });
}

module.exports = {
  registerSetupCommand,
};
