// Ticket panel UI components
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, EmbedBuilder
} = require('discord.js');

const COLOR_MAP = {
  Primary: ButtonStyle.Primary,
  Secondary: ButtonStyle.Secondary,
  Success: ButtonStyle.Success,
  Danger: ButtonStyle.Danger,
};

const COLOR_EMOJIS = {
  Primary: '🔵',
  Secondary: '⚪',
  Success: '🟢',
  Danger: '🔴'
};

const COLOR_DESCRIPTIONS = {
  Primary: '🔵 Primary - Blue button (default)',
  Secondary: '⚪ Secondary - Gray button',
  Success: '🟢 Success - Green button',
  Danger: '🔴 Danger - Red button'
};

const ROW_DESCRIPTIONS = {
  0: 'Row 0 - Top row (first line of buttons)',
  1: 'Row 1 - Second row of buttons',
  2: 'Row 2 - Third row of buttons',
  3: 'Row 3 - Fourth row of buttons',
  4: 'Row 4 - Bottom row (last line of buttons)'
};

function builderSummaryEmbed(session) {
  const embed = new EmbedBuilder()
    .setTitle('🎛️ Ticket Panel Builder')
    .setColor('#8a2be2')
    .addFields(
      { name: 'Style', value: session.style, inline: true },
      { name: 'Title', value: session.title, inline: true },
      { name: 'Buttons', value: session.buttons.length.toString(), inline: true },
      { name: 'Description', value: session.description.length > 100 ? 
        session.description.substring(0, 100) + '...' : session.description, inline: false }
    )
    .setFooter({ text: 'Powered by Kyra' })
    .setTimestamp();
  
  return embed;
}

function builderControls(session) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tp:style')
        .setPlaceholder('Choose panel style')
        .addOptions([
          { label: 'Embed', value: 'embed', description: 'Rich embed with purple theme' },
          { label: 'Text', value: 'text', description: 'Simple text message' },
        ])
        .setMinValues(1)
        .setMaxValues(1)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tp:title')
        .setLabel('Set Title')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('tp:desc')
        .setLabel('Set Description')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('tp:addbtn')
        .setLabel('Add Button')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('tp:removebtn')
        .setLabel('Remove Button')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(session.buttons.length === 0),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tp:channel')
        .setLabel('Set Channel')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('tp:preview')
        .setLabel('Preview')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('tp:publish')
        .setLabel('Publish')
        .setStyle(ButtonStyle.Success),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tp:cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger),
    ),
  ];
}

function renderPanelPreview(session) {
  // Convert session.buttons to ActionRows by row_index
  const rows = [0, 1, 2, 3, 4].map(() => new ActionRowBuilder());
  
  for (const btn of session.buttons) {
    if (btn.row_index >= 0 && btn.row_index < 5) {
      rows[btn.row_index].addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket:${btn.custom_id}`)
          .setLabel(btn.label)
          .setStyle(COLOR_MAP[btn.color] || ButtonStyle.Primary)
      );
    }
  }
  
  const compact = rows.filter(r => r.components.length > 0);

  if (session.style === 'embed') {
    return {
      embeds: [new EmbedBuilder()
        .setTitle(session.title)
        .setDescription(session.description)
        .setColor('#8a2be2')
        .setFooter({ text: 'Powered by Kyra' })
        .setTimestamp()],
      components: compact,
    };
  } else {
    return {
      content: `**${session.title}**\n${session.description}`,
      components: compact,
    };
  }
}

function channelSelectMenu(guild) {
  const textChannels = guild.channels.cache
    .filter(channel => channel.type === 0) // GuildText
    .map(channel => ({
      label: `#${channel.name}`,
      value: channel.id,
      description: `Post panel in ${channel.name}`
    }))
    .slice(0, 25); // Discord limit

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('tp:channel:select')
      .setPlaceholder('Choose channel for ticket panel')
      .addOptions(textChannels)
      .setMinValues(1)
      .setMaxValues(1)
  );
}

module.exports = {
  builderSummaryEmbed,
  builderControls,
  renderPanelPreview,
  channelSelectMenu,
  COLOR_MAP,
  COLOR_EMOJIS,
  COLOR_DESCRIPTIONS,
  ROW_DESCRIPTIONS
};
