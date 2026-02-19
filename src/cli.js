const { Command } = require("commander");
const pkg = require("../package.json");
const { APP_NAME } = require("./constants");

const { registerDoctorCommand } = require("./commands/doctor");
const { registerStatusCommand } = require("./commands/status");
const { registerListCommand } = require("./commands/list");
const { registerSwitchCommand } = require("./commands/switch");
const { registerSetupCommand } = require("./commands/setup");
const { registerAliasAddCommand } = require("./commands/alias-add");
const { registerAliasRmCommand } = require("./commands/alias-rm");
const { registerAliasesCommand } = require("./commands/aliases");
const { registerUseCommand } = require("./commands/use");
const { registerUpdateCommand } = require("./commands/update");

function createProgram() {
  const program = new Command();

  program
    .name(APP_NAME)
    .description("Switch and manage multiple GitHub accounts using GitHub CLI")
    .version(pkg.version);

  registerDoctorCommand(program);
  registerStatusCommand(program);
  registerListCommand(program);
  registerSwitchCommand(program);
  registerSetupCommand(program);
  registerAliasAddCommand(program);
  registerAliasRmCommand(program);
  registerAliasesCommand(program);
  registerUseCommand(program);
  registerUpdateCommand(program);

  return program;
}

function run(argv = process.argv) {
  const program = createProgram();
  program.parse(argv);
}

module.exports = {
  createProgram,
  run,
};
