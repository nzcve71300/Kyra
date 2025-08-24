const { pool } = require('../pool');

// Stub repository for tickets - will be implemented when bot features are added
async function createTicket(guildId, openerId, type, channelId) {
  const [result] = await pool.query(
    `INSERT INTO tickets (guild_id, opener_id, type, channel_id)
     VALUES (?, ?, ?, ?)`,
    [guildId, openerId, type, channelId]
  );
  return result.insertId;
}

async function getTicket(ticketId) {
  const [rows] = await pool.query(`SELECT * FROM tickets WHERE id = ?`, [ticketId]);
  return rows[0] || null;
}

async function closeTicket(ticketId, reason) {
  await pool.query(
    `UPDATE tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_reason = ?
     WHERE id = ?`,
    [reason, ticketId]
  );
}

module.exports = { createTicket, getTicket, closeTicket };
