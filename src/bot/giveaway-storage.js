// In-memory storage for giveaways (for testing without database)
const giveaways = new Map();
let nextGiveawayId = 1;

function createGiveaway(guildId, channelId, prize, winnersCount, endsAt) {
  const giveawayId = nextGiveawayId++;
  const giveaway = {
    id: giveawayId,
    guild_id: guildId,
    channel_id: channelId,
    prize: prize,
    winners_count: winnersCount,
    ends_at: endsAt,
    status: 'active',
    entries: new Set(),
    message_id: null
  };
  giveaways.set(giveawayId, giveaway);
  
  // Set timer to end the giveaway
  const timeUntilEnd = endsAt.getTime() - Date.now();
  if (timeUntilEnd > 0) {
    setTimeout(() => {
      endGiveaway(giveawayId);
    }, timeUntilEnd);
  }
  
  return giveawayId;
}

function setMessageId(giveawayId, messageId) {
  const giveaway = giveaways.get(giveawayId);
  if (giveaway) {
    giveaway.message_id = messageId;
  }
}

function endGiveaway(giveawayId) {
  const giveaway = giveaways.get(giveawayId);
  if (!giveaway || giveaway.status !== 'active') return;
  
  giveaway.status = 'ended';
  
  // Emit event for winner announcement
  if (typeof global.giveawayEnded === 'function') {
    global.giveawayEnded(giveaway);
  }
}

function getWinners(giveawayId) {
  const giveaway = giveaways.get(giveawayId);
  if (!giveaway || giveaway.status !== 'ended') return [];
  
  const entries = Array.from(giveaway.entries);
  const winners = [];
  
  // Simple random selection
  for (let i = 0; i < Math.min(giveaway.winners_count, entries.length); i++) {
    const randomIndex = Math.floor(Math.random() * entries.length);
    winners.push(entries[randomIndex]);
    entries.splice(randomIndex, 1);
  }
  
  return winners;
}

function getGiveaway(giveawayId) {
  return giveaways.get(giveawayId);
}

function addEntry(giveawayId, userId) {
  const giveaway = giveaways.get(giveawayId);
  if (giveaway) {
    giveaway.entries.add(userId);
    return true;
  }
  return false;
}

function removeEntry(giveawayId, userId) {
  const giveaway = giveaways.get(giveawayId);
  if (giveaway) {
    return giveaway.entries.delete(userId);
  }
  return false;
}

function hasUserEntered(giveawayId, userId) {
  const giveaway = giveaways.get(giveawayId);
  return giveaway ? giveaway.entries.has(userId) : false;
}

function getEntryCount(giveawayId) {
  const giveaway = giveaways.get(giveawayId);
  return giveaway ? giveaway.entries.size : 0;
}

module.exports = {
  createGiveaway,
  getGiveaway,
  addEntry,
  removeEntry,
  hasUserEntered,
  getEntryCount,
  setMessageId,
  endGiveaway,
  getWinners
};
