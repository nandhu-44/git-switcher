const { runBinary } = require("./process");

function setGitIdentity(gitName, gitEmail) {
  if (gitName) {
    const setName = runBinary("git", ["config", "--global", "user.name", gitName], { stdio: "inherit" });
    if (!setName.ok) {
      process.exit(setName.code || 1);
    }
  }

  if (gitEmail) {
    const setEmail = runBinary("git", ["config", "--global", "user.email", gitEmail], { stdio: "inherit" });
    if (!setEmail.ok) {
      process.exit(setEmail.code || 1);
    }
  }
}

module.exports = {
  setGitIdentity,
};
