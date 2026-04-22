const fs = require('fs');
const path = require('path');
const os = require('os');

const configDir = path.join(os.homedir(), '.portdoom');
const configPath = path.join(configDir, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {}
  
  return { hiddenApps: [] };
}

function saveConfig(config) {
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function isAppHidden(processName) {
  const config = loadConfig();
  return config.hiddenApps.includes(processName);
}

function hideApp(processName) {
  const config = loadConfig();
  if (!config.hiddenApps.includes(processName)) {
    config.hiddenApps.push(processName);
    return saveConfig(config);
  }
  return true;
}

function unhideApp(processName) {
  const config = loadConfig();
  const idx = config.hiddenApps.indexOf(processName);
  if (idx > -1) {
    config.hiddenApps.splice(idx, 1);
    return saveConfig(config);
  }
  return true;
}

function unhideAllApps() {
  return saveConfig({ hiddenApps: [] });
}

function getHiddenApps() {
  const config = loadConfig();
  return config.hiddenApps;
}

module.exports = {
  loadConfig,
  saveConfig,
  isAppHidden,
  hideApp,
  unhideApp,
  unhideAllApps,
  getHiddenApps,
};
