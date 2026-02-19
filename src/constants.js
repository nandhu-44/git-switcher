const os = require("node:os");
const path = require("node:path");

const APP_NAME = "git-switcher";
const CONFIG_DIR = path.join(os.homedir(), ".git-switcher");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

module.exports = {
  APP_NAME,
  CONFIG_DIR,
  CONFIG_PATH,
};
