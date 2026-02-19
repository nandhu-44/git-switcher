const { runBinary } = require("./process");

function setupGitAuth() {
  const result = runBinary("gh", ["auth", "setup-git"], { stdio: "inherit" });
  if (!result.ok) {
    process.exit(result.code || 1);
  }
}

function switchGhAccount(account) {
  const result = runBinary("gh", ["auth", "switch", "--user", account], { stdio: "inherit" });
  if (!result.ok) {
    process.exit(result.code || 1);
  }
}

module.exports = {
  setupGitAuth,
  switchGhAccount,
};
