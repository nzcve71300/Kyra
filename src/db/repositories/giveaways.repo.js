const { pool } = require('../pool');

// Stub repository for giveaways - will be implemented when bot features are added
async function createGiveaway(guildId, channelId, messageId, prize, winnersCount, endsAt) {
  const [result] = await pool.query(
    `INSERT INTO giveaways (guild_id, channel_id, message_id, prize, winners_count, ends_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [guildId, channelId, messageId, prize, winnersCount, endsAt]
  );
  return result.insertId;
}

async function getGiveaway(giveawayId) {
  const [rows] = await pool.query(`SELECT * FROM giveaways WHERE id = ?`, [giveawayId]);
  return rows[0] || null;
}

async function addEntry(giveawayId, userId) {
  await pool.query(
    `INSERT IGNORE INTO giveaway_entries (giveaway_id, user_id) VALUES (?, ?)`,
    [giveawayId, userId]
  );
}

async function removeEntry(giveawayId, userId) {
  await pool.query(
    `DELETE FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?`,
    [giveawayId, userId]
  );
}

async function getEntryCount(giveawayId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM giveaway_entries WHERE giveaway_id = ?`,
    [giveawayId]
  );
  return rows[0].count;
}

async function hasUserEntered(giveawayId, userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?`,
    [giveawayId, userId]
  );
  return rows[0].count > 0;
}

module.exports = { createGiveaway, getGiveaway, addEntry, removeEntry, getEntryCount, hasUserEntered };
