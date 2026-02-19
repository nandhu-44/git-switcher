const { ensureGh, getCurrentGhUser, listAccountsFromGhStatus } = require("../utils/process");

function registerListCommand(program) {
  program
    .command("list")
    .description("List accounts detected from gh auth status")
    .action(() => {
      ensureGh();
      const accounts = listAccountsFromGhStatus();

      if (accounts.length === 0) {
        console.log("No accounts detected from gh auth status.");
        return;
      }

      const current = getCurrentGhUser();
      accounts.forEach((account) => {
        const marker = current === account ? "*" : " ";
        console.log(`${marker} ${account}`);
      });
    });
}

module.exports = {
  registerListCommand,
};
