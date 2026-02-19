const fs = require("node:fs");
const { CONFIG_DIR, CONFIG_PATH } = require("../constants");

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_PATH)) {
    return { aliases: {} };
  }

  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!parsed.aliases || typeof parsed.aliases !== "object") {
      return { aliases: {} };
    }
    return parsed;
  } catch {
    return { aliases: {} };
  }
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

module.exports = {
  loadConfig,
  saveConfig,
};
