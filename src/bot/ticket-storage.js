// In-memory storage for tickets (for testing without database)
const tickets = new Map();
let nextTicketId = 1;

function createTicket(guildId, openerId, type, channelId) {
  const ticketId = nextTicketId++;
  const ticket = {
    id: ticketId,
    guild_id: guildId,
    opener_id: openerId,
    type: type,
    status: 'open',
    channel_id: channelId,
    created_at: new Date(),
    closed_at: null,
    closed_reason: null
  };
  tickets.set(ticketId, ticket);
  return ticketId;
}

function getTicket(ticketId) {
  return tickets.get(ticketId);
}

function closeTicket(ticketId, reason) {
  const ticket = tickets.get(ticketId);
  if (ticket) {
    ticket.status = 'closed';
    ticket.closed_at = new Date();
    ticket.closed_reason = reason;
    return true;
  }
  return false;
}

module.exports = {
  createTicket,
  getTicket,
  closeTicket
};
