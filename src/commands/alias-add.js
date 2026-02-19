const { loadConfig, saveConfig } = require("../utils/config");

function registerAliasAddCommand(program) {
  program
    .command("alias-add <alias> <account>")
    .description("Save an alias profile for a GitHub account")
    .option("--git-name <name>", "Default global git user.name for this alias")
    .option("--git-email <email>", "Default global git user.email for this alias")
    .action((alias, account, options) => {
      const config = loadConfig();

      config.aliases[alias] = {
        account,
        gitName: options.gitName || null,
        gitEmail: options.gitEmail || null,
      };

      saveConfig(config);
      console.log(`Alias saved: ${alias} -> ${account}`);
    });
}

module.exports = {
  registerAliasAddCommand,
};
