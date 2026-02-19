const { ensureGh, ensureGit, runBinary, getCurrentGhUser } = require("../utils/process");

function registerDoctorCommand(program) {
  program
    .command("doctor")
    .description("Check required tools and authentication status")
    .action(() => {
      console.log("Checking dependencies...");
      ensureGh();
      ensureGit();

      const authStatus = runBinary("gh", ["auth", "status"]);
      if (authStatus.ok) {
        console.log("- gh: OK");
        console.log("- git: OK");
        const current = getCurrentGhUser();
        if (current) {
          console.log(`- current GitHub account: ${current}`);
        }
        return;
      }

      console.error("- gh auth: not ready");
      console.error("Run: gh auth login");
      process.exit(1);
    });
}

module.exports = {
  registerDoctorCommand,
};
