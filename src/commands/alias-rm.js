const { loadConfig, saveConfig } = require("../utils/config");

function registerAliasRmCommand(program) {
  program
    .command("alias-rm <alias>")
    .description("Remove an alias profile")
    .action((alias) => {
      const config = loadConfig();

      if (!config.aliases[alias]) {
        console.error(`Alias not found: ${alias}`);
        process.exit(1);
      }

      delete config.aliases[alias];
      saveConfig(config);
      console.log(`Alias removed: ${alias}`);
    });
}

module.exports = {
  registerAliasRmCommand,
};
