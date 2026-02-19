const { runBinary } = require("../utils/process");
const pkg = require("../../package.json");

function registerUpdateCommand(program) {
  program
    .command("update")
    .description("Update git-switcher globally to the latest version")
    .option("--run", "Run the npm global update command")
    .action((options) => {
      const packageName = pkg.name;
      const updateCommand = `npm install -g ${packageName}@latest`;

      if (!options.run) {
        console.log("Run this command to update globally:");
        console.log(updateCommand);
        return;
      }

      console.log(`Updating ${packageName} globally...`);
      const result = runBinary("npm", ["install", "-g", `${packageName}@latest`], { stdio: "inherit" });
      if (!result.ok) {
        console.error("Update failed.");
        process.exit(result.code || 1);
      }

      console.log("Update completed.");
    });
}

module.exports = {
  registerUpdateCommand,
};
