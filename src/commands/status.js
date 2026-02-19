const { ensureGh, getCurrentGhUser, runBinary } = require("../utils/process");

function registerStatusCommand(program) {
  program
    .command("status")
    .description("Show active GitHub account and auth status")
    .action(() => {
      ensureGh();

      const current = getCurrentGhUser();
      if (current) {
        console.log(`Current account: ${current}`);
      } else {
        console.log("No active GitHub account found.");
      }

      const status = runBinary("gh", ["auth", "status"], { stdio: "inherit" });
      if (!status.ok) {
        process.exit(status.code || 1);
      }
    });
}

module.exports = {
  registerStatusCommand,
};
