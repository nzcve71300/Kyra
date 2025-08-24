// In-memory storage for ticket panels (for testing without database)
const ticketPanels = new Map();
const ticketButtons = new Map();
let nextButtonId = 1;

function createOrUpdatePanel(guildId, style, title, description, channelId = null, messageId = null) {
  const panel = {
    guild_id: guildId,
    style: style || 'embed',
    title: title || 'Support',
    description: description || 'Click a button to open a ticket.',
    channel_id: channelId,
    message_id: messageId,
    updated_at: new Date()
  };
  ticketPanels.set(guildId, panel);
  return panel;
}

function getPanel(guildId) {
  return ticketPanels.get(guildId);
}

function createButton(guildId, label, color, question, rowIndex, position) {
  const buttonId = nextButtonId++;
  const customId = `${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now() % 10000}`;
  
  const button = {
    id: buttonId,
    guild_id: guildId,
    label: label,
    custom_id: customId,
    color: color || 'Primary',
    question: question || null,
    row_index: rowIndex || 0,
    position: position || 0
  };
  
  ticketButtons.set(buttonId, button);
  return button;
}

function getButtonsByGuild(guildId) {
  return Array.from(ticketButtons.values())
    .filter(btn => btn.guild_id === guildId)
    .sort((a, b) => a.row_index - b.row_index || a.position - b.position);
}

function deleteButton(buttonId) {
  return ticketButtons.delete(buttonId);
}

function deletePanel(guildId) {
  // Delete all buttons for this guild
  for (const [id, button] of ticketButtons.entries()) {
    if (button.guild_id === guildId) {
      ticketButtons.delete(id);
    }
  }
  return ticketPanels.delete(guildId);
}

function updatePanelMessage(guildId, messageId) {
  const panel = ticketPanels.get(guildId);
  if (panel) {
    panel.message_id = messageId;
    panel.updated_at = new Date();
  }
}

function updatePanelChannel(guildId, channelId) {
  const panel = ticketPanels.get(guildId);
  if (panel) {
    panel.channel_id = channelId;
    panel.updated_at = new Date();
  }
}

module.exports = {
  createOrUpdatePanel,
  getPanel,
  createButton,
  getButtonsByGuild,
  deleteButton,
  deletePanel,
  updatePanelMessage,
  updatePanelChannel
};
