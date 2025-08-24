const { pool } = require('../pool');

async function getAllSettings(guildId) {
  const [rows] = await pool.query(
    `SELECT \`key\`, value_json, updated_at FROM guild_settings WHERE guild_id = ?`,
    [guildId]
  );
  const obj = {};
  for (const r of rows) obj[r.key] = r.value_json;
  return obj;
}

async function setSetting(guildId, key, valueJson) {
  await pool.query(
    `INSERT INTO guild_settings (guild_id, \`key\`, value_json)
     VALUES (?, ?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = CURRENT_TIMESTAMP`,
    [guildId, key, JSON.stringify(valueJson)]
  );
}

module.exports = { getAllSettings, setSetting };
