const { pool } = require('../pool');

async function upsertGuild(guildId, name) {
  await pool.query(
    `INSERT INTO guilds (guild_id, name)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), active = 1`,
    [guildId, name]
  );
}

async function deactivateGuild(guildId) {
  await pool.query(`UPDATE guilds SET active = 0 WHERE guild_id = ?`, [guildId]);
}

async function getGuild(guildId) {
  const [rows] = await pool.query(`SELECT * FROM guilds WHERE guild_id = ?`, [guildId]);
  return rows[0] || null;
}

module.exports = { upsertGuild, deactivateGuild, getGuild };
