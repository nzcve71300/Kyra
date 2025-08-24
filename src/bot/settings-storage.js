// In-memory storage for settings (for testing without database)
const settings = new Map();

function getAllSettings(guildId) {
  const guildSettings = settings.get(guildId) || {};
  return guildSettings;
}

function setSetting(guildId, key, value) {
  if (!settings.has(guildId)) {
    settings.set(guildId, {});
  }
  const guildSettings = settings.get(guildId);
  guildSettings[key] = value;
  return true;
}

module.exports = {
  getAllSettings,
  setSetting
};
