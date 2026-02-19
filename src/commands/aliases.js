const { loadConfig } = require("../utils/config");

function registerAliasesCommand(program) {
  program
    .command("aliases")
    .description("List saved alias profiles")
    .action(() => {
      const config = loadConfig();
      const entries = Object.entries(config.aliases);

      if (entries.length === 0) {
        console.log("No aliases saved.");
        return;
      }

      for (const [alias, profile] of entries) {
        const parts = [`${alias} -> ${profile.account}`];
        if (profile.gitName) {
          parts.push(`name=${profile.gitName}`);
        }
        if (profile.gitEmail) {
          parts.push(`email=${profile.gitEmail}`);
        }
        console.log(parts.join(" | "));
      }
    });
}

module.exports = {
  registerAliasesCommand,
};
