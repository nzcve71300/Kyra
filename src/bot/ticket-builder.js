// Ticket builder session management
const builders = new Map(); // key: guildId -> builder session

const { createOrUpdatePanel, getPanel, createButton, getButtonsByGuild } = require('./ticket-json-storage');

async function loadOrInitBuilder(guild) {
  // Load existing panel or create defaults
  const existingPanel = getPanel(guild.id);
  const existingButtons = getButtonsByGuild(guild.id);
  
  const session = existingPanel ? {
    guildId: guild.id,
    style: existingPanel.style,
    title: existingPanel.title,
    description: existingPanel.description,
    channel_id: existingPanel.channel_id,
    message_id: existingPanel.message_id,
    buttons: existingButtons.map(btn => ({
      id: btn.id,
      label: btn.label,
      color: btn.color,
      question: btn.question,
      row_index: btn.row_index,
      position: btn.position,
      custom_id: btn.custom_id
    }))
  } : {
    guildId: guild.id,
    style: 'embed',
    title: 'Support',
    description: 'Click a button to open a ticket.',
    channel_id: null,
    message_id: null,
    buttons: []
  };
  
  builders.set(guild.id, session);
  return session;
}

function getBuilder(guildId) {
  return builders.get(guildId);
}

function updateBuilder(guildId, updates) {
  const session = builders.get(guildId);
  if (session) {
    Object.assign(session, updates);
  }
  return session;
}

function saveBuilderToStorage(guildId) {
  const session = builders.get(guildId);
  if (!session) return null;
  
  // Save panel
  const panel = createOrUpdatePanel(
    session.guildId,
    session.style,
    session.title,
    session.description,
    session.channel_id,
    session.message_id
  );
  
  // Clear existing buttons and recreate
  const existingButtons = getButtonsByGuild(guildId);
  const { deleteButton } = require('./ticket-json-storage');
  for (const btn of existingButtons) {
    deleteButton(btn.id);
  }
  
  // Create new buttons
  for (const btn of session.buttons) {
    createButton(
      session.guildId,
      btn.label,
      btn.color,
      btn.question,
      btn.row_index,
      btn.position
    );
  }
  
  return panel;
}

function clearBuilder(guildId) {
  return builders.delete(guildId);
}

module.exports = {
  loadOrInitBuilder,
  getBuilder,
  updateBuilder,
  saveBuilderToStorage,
  clearBuilder
};
