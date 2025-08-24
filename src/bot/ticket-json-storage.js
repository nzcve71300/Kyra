// JSON-based ticket storage for testing
const fs = require('fs');
const path = require('path');

const TICKETS_FILE = path.join(__dirname, '../../data/tickets.json');
const PANELS_FILE = path.join(__dirname, '../../data/panels.json');

// Ensure data directory exists
const dataDir = path.dirname(TICKETS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(TICKETS_FILE)) {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify({ tickets: [] }, null, 2));
}

if (!fs.existsSync(PANELS_FILE)) {
  fs.writeFileSync(PANELS_FILE, JSON.stringify({ panels: [], buttons: [] }, null, 2));
}

function readTickets() {
  try {
    const data = fs.readFileSync(TICKETS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tickets file:', error);
    return { tickets: [] };
  }
}

function writeTickets(data) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing tickets file:', error);
    return false;
  }
}

function readPanels() {
  try {
    const data = fs.readFileSync(PANELS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading panels file:', error);
    return { panels: [], buttons: [] };
  }
}

function writePanels(data) {
  try {
    fs.writeFileSync(PANELS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing panels file:', error);
    return false;
  }
}

// Ticket functions
function createTicket(guildId, openerId, type, channelId, reason = null) {
  const data = readTickets();
  const ticketId = Date.now();
  
  const ticket = {
    id: ticketId,
    guild_id: guildId,
    opener_id: openerId,
    type: type,
    status: 'open',
    channel_id: channelId,
    reason: reason,
    created_at: new Date().toISOString(),
    closed_at: null,
    closed_by: null,
    closed_reason: null
  };
  
  data.tickets.push(ticket);
  writeTickets(data);
  
  return ticketId;
}

function getTicket(ticketId) {
  const data = readTickets();
  return data.tickets.find(t => t.id === ticketId) || null;
}

function getAllTickets(guildId) {
  const data = readTickets();
  return data.tickets.filter(t => t.guild_id === guildId);
}

function closeTicket(ticketId, closedBy, reason = null) {
  const data = readTickets();
  const ticket = data.tickets.find(t => t.id === ticketId);
  
  if (ticket) {
    ticket.status = 'closed';
    ticket.closed_at = new Date().toISOString();
    ticket.closed_by = closedBy;
    ticket.closed_reason = reason;
    writeTickets(data);
    return true;
  }
  
  return false;
}

// Panel functions
function createOrUpdatePanel(guildId, style, title, description, channelId = null, messageId = null) {
  const data = readPanels();
  
  const existingIndex = data.panels.findIndex(p => p.guild_id === guildId);
  const panel = {
    guild_id: guildId,
    style: style || 'embed',
    title: title || 'Support',
    description: description || 'Click a button to open a ticket.',
    channel_id: channelId,
    message_id: messageId,
    updated_at: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    data.panels[existingIndex] = panel;
  } else {
    data.panels.push(panel);
  }
  
  writePanels(data);
  return panel;
}

function getPanel(guildId) {
  const data = readPanels();
  return data.panels.find(p => p.guild_id === guildId) || null;
}

function createButton(guildId, label, color, question, rowIndex, position) {
  const data = readPanels();
  const buttonId = Date.now();
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
  
  data.buttons.push(button);
  writePanels(data);
  
  return button;
}

function getButtonsByGuild(guildId) {
  const data = readPanels();
  return data.buttons
    .filter(btn => btn.guild_id === guildId)
    .sort((a, b) => a.row_index - b.row_index || a.position - b.position);
}

function deleteButton(buttonId) {
  const data = readPanels();
  const index = data.buttons.findIndex(b => b.id === buttonId);
  
  if (index >= 0) {
    data.buttons.splice(index, 1);
    writePanels(data);
    return true;
  }
  
  return false;
}

function deletePanel(guildId) {
  const data = readPanels();
  
  // Remove panel
  const panelIndex = data.panels.findIndex(p => p.guild_id === guildId);
  if (panelIndex >= 0) {
    data.panels.splice(panelIndex, 1);
  }
  
  // Remove all buttons for this guild
  data.buttons = data.buttons.filter(b => b.guild_id !== guildId);
  
  writePanels(data);
  return true;
}

function updatePanelMessage(guildId, messageId) {
  const data = readPanels();
  const panel = data.panels.find(p => p.guild_id === guildId);
  
  if (panel) {
    panel.message_id = messageId;
    panel.updated_at = new Date().toISOString();
    writePanels(data);
  }
}

function updatePanelChannel(guildId, channelId) {
  const data = readPanels();
  const panel = data.panels.find(p => p.guild_id === guildId);
  
  if (panel) {
    panel.channel_id = channelId;
    panel.updated_at = new Date().toISOString();
    writePanels(data);
  }
}

module.exports = {
  // Ticket functions
  createTicket,
  getTicket,
  getAllTickets,
  closeTicket,
  
  // Panel functions
  createOrUpdatePanel,
  getPanel,
  createButton,
  getButtonsByGuild,
  deleteButton,
  deletePanel,
  updatePanelMessage,
  updatePanelChannel
};
