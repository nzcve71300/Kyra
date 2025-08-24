require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const logger = require('../utils/logger');

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Command collection
client.commands = new Collection();

// Load commands
const fs = require('fs');
const path = require('path');
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    logger.info(`Loaded command: ${command.data.name}`);
  } else {
    logger.error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Bot ready event
client.once('ready', () => {
  logger.info(`Logged in as ${client.user.tag}`);
  logger.info(`Serving ${client.guilds.cache.size} guilds`);
  
  // Set bot status
  client.user.setActivity('your commands', { type: 'WATCHING' });
});

// Guild join event
client.on('guildCreate', async (guild) => {
  logger.info(`Joined guild: ${guild.name} (${guild.id})`);
});

// Guild leave event
client.on('guildDelete', async (guild) => {
  logger.info(`Left guild: ${guild.name} (${guild.id})`);
});

// Message interaction handler
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, error);
      
      const reply = {
        content: 'Oops! Something went wrong while running that command. Please try again in a moment!',
        ephemeral: true
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  } else if (interaction.isButton()) {
    // Handle giveaway button interactions
    const customId = interaction.customId;
    
    if (customId.startsWith('giveaway_enter_') || customId.startsWith('giveaway_leave_')) {
      try {
        await handleGiveawayButton(interaction, customId);
      } catch (error) {
        logger.error('Error handling giveaway button:', error);
        await interaction.reply({
          content: '❌ Oops! Something went wrong. Please try again in a moment!',
          ephemeral: true
        });
      }
    } else if (customId.startsWith('tp:')) {
      // Handle ticket panel builder interactions
      try {
        await handleTicketPanelButton(interaction, customId);
      } catch (error) {
        logger.error('Error handling ticket panel button:', error);
        const reply = {
          content: '❌ Oops! Something went wrong. Please try again in a moment!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    } else if (customId.startsWith('ticket:')) {
      // Handle ticket opening
      try {
        await handleTicketOpen(interaction, customId);
      } catch (error) {
        logger.error('Error handling ticket open:', error);
        const reply = {
          content: '❌ Oops! Something went wrong while opening your ticket. Please try again in a moment!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
  } else if (interaction.isStringSelectMenu()) {
    // Handle ticket panel select menu interactions
    const customId = interaction.customId;
    
    if (customId.startsWith('tp:')) {
      try {
        await handleTicketPanelSelect(interaction, customId);
      } catch (error) {
        logger.error('Error handling ticket panel select:', error);
        const reply = {
          content: '❌ Oops! Something went wrong. Please try again in a moment!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
  } else if (interaction.isModalSubmit()) {
    // Handle ticket panel modal submissions
    const customId = interaction.customId;
    
    if (customId.startsWith('tp:')) {
      try {
        await handleTicketPanelModal(interaction, customId);
      } catch (error) {
        logger.error('Error handling ticket panel modal:', error);
        const reply = {
          content: '❌ Oops! Something went wrong. Please try again in a moment!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    } else if (customId.startsWith('ticket:modal:')) {
      try {
        await handleTicketModal(interaction, customId);
      } catch (error) {
        logger.error('Error handling ticket modal:', error);
        const reply = {
          content: '❌ Oops! Something went wrong. Please try again in a moment!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
  }
});

// Giveaway button handler
async function handleGiveawayButton(interaction, customId) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const { getGiveaway, addEntry, removeEntry, hasUserEntered, getEntryCount, getWinners } = require('./giveaway-storage');
  
  const giveawayId = parseInt(customId.split('_')[2]);
  const action = customId.split('_')[1]; // 'enter' or 'leave'
  const userId = interaction.user.id;
  const guildId = interaction.guildId;

  // Get giveaway info from memory
  const giveaway = getGiveaway(giveawayId);
  if (!giveaway || giveaway.guild_id !== guildId) {
    await interaction.reply({
      content: '❌ Hmm, I couldn\'t find that giveaway. It might have been deleted or doesn\'t belong to this server.',
      ephemeral: true
    });
    return;
  }

  // Check if giveaway is still active
  if (giveaway.status !== 'active') {
    await interaction.reply({
      content: '❌ This giveaway isn\'t active right now. Maybe it\'s already ended or hasn\'t started yet!',
      ephemeral: true
    });
    return;
  }

  // Check if giveaway has ended
  if (new Date() > new Date(giveaway.ends_at) || giveaway.status === 'ended') {
    await interaction.reply({
      content: '❌ Aw, this giveaway has already ended! Better luck next time!',
      ephemeral: true
    });
    
    // Disable buttons on the original message
    try {
      const embed = EmbedBuilder.from(interaction.message.embeds[0]);
      embed.setColor('#666666'); // Gray out the embed
      
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_enter_${giveawayId}`)
            .setLabel('Giveaway Ended')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`giveaway_leave_${giveawayId}`)
            .setLabel('Giveaway Ended')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
      
      await interaction.message.edit({ embeds: [embed], components: [disabledRow] });
    } catch (error) {
      logger.error('Error disabling buttons:', error);
    }
    return;
  }

  if (action === 'enter') {
    // Check if user already entered
    const hasEntered = hasUserEntered(giveawayId, userId);
    if (hasEntered) {
      await interaction.reply({
        content: '❌ Looks like you\'ve already entered this giveaway! You can only enter once.',
        ephemeral: true
      });
      return;
    }

    // Add entry
    addEntry(giveawayId, userId);
    
    // Get updated entry count
    const entryCount = getEntryCount(giveawayId);

    // Ephemeral message
    await interaction.reply({
      content: '🎉 You successfully entered the giveaway! Good luck! 🍀',
      ephemeral: true
    });

    // Send rich DM
    const dmEmbed = new EmbedBuilder()
      .setTitle('You\'re In!')
      .setColor('#8a2be2')
      .setDescription(`**Congratulations!** You've successfully entered the giveaway for **${giveaway.prize}**!`)
      .addFields(
        { name: '🏆 Prize', value: giveaway.prize, inline: true },
        { name: '👥 Your Entry', value: `#${entryCount}`, inline: true },
        { name: '📅 Ends', value: `<t:${Math.floor(new Date(giveaway.ends_at).getTime() / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Powered by Kyra' })
      .setTimestamp();

    try {
      await interaction.user.send({ embeds: [dmEmbed] });
    } catch (error) {
      // User might have DMs disabled, that's okay
      logger.info(`Could not send DM to user ${interaction.user.tag}`);
    }

  } else if (action === 'leave') {
    // Check if user has entered
    const hasEntered = hasUserEntered(giveawayId, userId);
    if (!hasEntered) {
      await interaction.reply({
        content: '❌ You haven\'t entered this giveaway yet, so there\'s nothing to leave!',
        ephemeral: true
      });
      return;
    }

    // Remove entry
    removeEntry(giveawayId, userId);

    // Ephemeral message
    await interaction.reply({
      content: '❌ You successfully left the giveaway.',
      ephemeral: true
    });

    // Send rich DM
    const dmEmbed = new EmbedBuilder()
      .setTitle('Giveaway Left')
      .setColor('#8a2be2')
      .setDescription(`You've successfully left the giveaway for **${giveaway.prize}**.\n\nIf you change your mind, you can always enter again before it ends!`)
      .addFields(
        { name: '🏆 Prize', value: giveaway.prize, inline: true },
        { name: '📅 Ends', value: `<t:${Math.floor(new Date(giveaway.ends_at).getTime() / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Powered by Kyra' })
      .setTimestamp();

    try {
      await interaction.user.send({ embeds: [dmEmbed] });
    } catch (error) {
      // User might have DMs disabled, that's okay
      logger.info(`Could not send DM to user ${interaction.user.tag}`);
    }
  }

  // Update the original embed with new entry count
  const entryCount = getEntryCount(giveawayId);
  const embed = EmbedBuilder.from(interaction.message.embeds[0]);
  
  // Find and update the entries field
  const entriesField = embed.data.fields.find(field => field.name === '👥 Entries');
  if (entriesField) {
    entriesField.value = entryCount.toString();
  }

  await interaction.message.edit({ embeds: [embed] });
}

// Winner announcement handler
async function announceWinner(giveaway) {
  const { EmbedBuilder } = require('discord.js');
  const { getWinners } = require('./giveaway-storage');
  
  try {
    const winners = getWinners(giveaway.id);
    const channel = client.channels.cache.get(giveaway.channel_id);
    
    if (!channel) return;
    
    const embed = new EmbedBuilder()
      .setTitle('Giveaway Ended!')
      .setColor('#8a2be2')
      .setDescription(`**${giveaway.prize}**`)
      .addFields(
        { name: '🏆 Winners', value: winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries', inline: false },
        { name: '👥 Total Entries', value: giveaway.entries.size.toString(), inline: false },
        { name: '📅 Ended', value: `<t:${Math.floor(new Date().getTime() / 1000)}:R>`, inline: false }
      )
      .setFooter({ text: 'Powered by Kyra' })
      .setTimestamp();
    
    // Mention winners
    const winnerMentions = winners.length > 0 ? `Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!` : 'No one entered this giveaway.';
    
    await channel.send({ content: winnerMentions, embeds: [embed] });
    
    // Send DM to each winner
    for (const winnerId of winners) {
      try {
        const winner = await client.users.fetch(winnerId);
        const winnerEmbed = new EmbedBuilder()
          .setTitle('🎉 You Won!')
          .setColor('#8a2be2')
          .setDescription(`**Congratulations!** You've won the giveaway for **${giveaway.prize}**!`)
          .addFields(
            { name: '🏆 Prize', value: giveaway.prize, inline: true },
            { name: '👥 Total Entries', value: giveaway.entries.size.toString(), inline: true },
            { name: '📅 Won At', value: `<t:${Math.floor(new Date().getTime() / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: 'Powered by Kyra' })
          .setTimestamp();
        
        await winner.send({ embeds: [winnerEmbed] });
        logger.info(`Sent winner DM to ${winner.tag} for giveaway #${giveaway.id}`);
      } catch (error) {
        // User might have DMs disabled, that's okay
        logger.info(`Could not send winner DM to user ${winnerId} - DMs might be disabled`);
      }
    }
    
  } catch (error) {
    logger.error('Error announcing winner:', error);
  }
}

// Set up global giveaway ended handler
global.giveawayEnded = announceWinner;

// Ticket panel interaction handlers
async function handleTicketPanelButton(interaction, customId) {
  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
  const { getBuilder, updateBuilder, saveBuilderToStorage, clearBuilder } = require('./ticket-builder');
  const { builderSummaryEmbed, builderControls, renderPanelPreview, channelSelectMenu, COLOR_EMOJIS } = require('./ticket-ui');
  const { updatePanelMessage, updatePanelChannel } = require('./ticket-json-storage');
  
  const session = getBuilder(interaction.guildId);
  if (!session) {
    const reply = {
      content: '❌ No active ticket panel builder session found. Please run `/ticket-setup` again.',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
    return;
  }

  if (customId === 'tp:title') {
    const modal = new ModalBuilder()
      .setCustomId('tp:title:modal')
      .setTitle('Set Panel Title');
    
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('title')
          .setLabel('Panel Title')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(128)
          .setRequired(true)
          .setValue(session.title)
      )
    );
    
    await interaction.showModal(modal);
  } else if (customId === 'tp:desc') {
    const modal = new ModalBuilder()
      .setCustomId('tp:desc:modal')
      .setTitle('Set Panel Description');
    
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('desc')
          .setLabel('Panel Description')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(2000)
          .setRequired(true)
          .setValue(session.description)
      )
    );
    
    await interaction.showModal(modal);
  } else if (customId === 'tp:addbtn') {
    const modal = new ModalBuilder()
      .setCustomId('tp:addbtn:modal')
      .setTitle('Add Ticket Button');
    
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('label')
          .setLabel('Button Label')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(80)
          .setRequired(true)
          .setPlaceholder('e.g., General Support')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('color')
          .setLabel('Color (Primary/Secondary/Success/Danger)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue('Primary')
          .setPlaceholder('🔵 Primary, ⚪ Secondary, 🟢 Success, 🔴 Danger')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('question')
          .setLabel('Question (optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('e.g., What do you need help with?')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('row')
          .setLabel('Row (0-4)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue('0')
          .setPlaceholder('0 (top) to 4 (bottom)')
      )
    );
    
    await interaction.showModal(modal);
  } else if (customId === 'tp:removebtn') {
    await interaction.deferUpdate();
    
    if (session.buttons.length === 0) {
      await interaction.editReply({
        content: '❌ **No Buttons to Remove**\nThere are no buttons to remove from this panel.',
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session)
      });
      return;
    }
    
    // Create button selection menu
    const { StringSelectMenuBuilder } = require('discord.js');
    
    const options = session.buttons.map((btn, index) => ({
      label: `${btn.label} (Row ${btn.row_index})`,
      value: index.toString(),
      description: `${COLOR_EMOJIS[btn.color] || '🔵'} ${btn.color} button${btn.question ? ' • Has question' : ''}`
    }));
    
    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tp:removebtn:select')
        .setPlaceholder('Choose button to remove')
        .addOptions(options)
        .setMinValues(1)
        .setMaxValues(1)
    );
    
    await interaction.editReply({
      content: '🗑️ **Remove Button**\nSelect which button to remove:',
      embeds: [builderSummaryEmbed(session)],
      components: [selectMenu, ...builderControls(session).slice(1)] // Keep other controls but replace first row
    });
  } else if (customId === 'tp:channel') {
    await interaction.deferUpdate();
    
    await interaction.editReply({
      content: '📺 **Choose Channel**\nSelect where to publish your ticket panel:',
      embeds: [builderSummaryEmbed(session)],
      components: [channelSelectMenu(interaction.guild)]
    });
  } else if (customId === 'tp:preview') {
    await interaction.deferUpdate();
    
    const preview = renderPanelPreview(session);
    await interaction.followUp({
      content: '👀 **Panel Preview**\nThis is how your ticket panel will look:',
      ...preview,
      ephemeral: true
    });
  } else if (customId === 'tp:publish') {
    await interaction.deferUpdate();
    
    if (!session.channel_id) {
      await interaction.editReply({
        content: '❌ **No Channel Set**\nPlease set a channel first using the "Set Channel" button.',
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session)
      });
      return;
    }
    
    try {
      // Save to storage
      saveBuilderToStorage(interaction.guildId);
      
      // Publish the panel
      const channel = interaction.guild.channels.cache.get(session.channel_id);
      if (!channel) {
        throw new Error('Channel not found');
      }
      
      const panelContent = renderPanelPreview(session);
      
      let message;
      if (session.message_id) {
        try {
          const existingMessage = await channel.messages.fetch(session.message_id);
          message = await existingMessage.edit(panelContent);
        } catch {
          message = await channel.send(panelContent);
        }
      } else {
        message = await channel.send(panelContent);
      }
      
      // Update message ID
      updatePanelMessage(interaction.guildId, message.id);
      session.message_id = message.id;
      
      await interaction.editReply({
        content: `✅ **Panel Published!**\nYour ticket panel has been published in ${channel}`,
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session)
      });
      
    } catch (error) {
      logger.error('Error publishing panel:', error);
      await interaction.editReply({
        content: '❌ **Publish Failed**\nCould not publish the panel. Please check channel permissions and try again.',
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session)
      });
    }
  } else if (customId === 'tp:cancel') {
    await interaction.deferUpdate();
    
    clearBuilder(interaction.guildId);
    await interaction.editReply({
      content: '❌ **Builder Cancelled**\nTicket panel builder has been cancelled.',
      embeds: [],
      components: []
    });
  }
}

async function handleTicketPanelSelect(interaction, customId) {
  const { getBuilder, updateBuilder } = require('./ticket-builder');
  const { builderSummaryEmbed, builderControls } = require('./ticket-ui');
  const { updatePanelChannel } = require('./ticket-json-storage');
  
  const session = getBuilder(interaction.guildId);
  if (!session) return;

  if (customId === 'tp:style') {
    await interaction.deferUpdate();
    
    const style = interaction.values[0];
    updateBuilder(interaction.guildId, { style });
    
    await interaction.editReply({
      content: '🎛️ **Ticket Panel Builder**\nConfigure your ticket panel below:',
      embeds: [builderSummaryEmbed(session)],
      components: builderControls(session)
    });
  } else if (customId === 'tp:channel:select') {
    await interaction.deferUpdate();
    
    const channelId = interaction.values[0];
    updateBuilder(interaction.guildId, { channel_id: channelId });
    updatePanelChannel(interaction.guildId, channelId);
    
    const channel = interaction.guild.channels.cache.get(channelId);
    
    // Check if this is the initial setup (from /setup-ticket-system)
    const isInitialSetup = interaction.message.content.includes('Ticket System Setup');
    
    if (isInitialSetup) {
      // Show the full builder after channel selection
      await interaction.editReply({
        content: `🎛️ **Ticket System Setup**\nGreat! Channel set to ${channel}. Now configure your ticket panel:`,
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session)
      });
    } else {
      // Regular channel selection from builder
      await interaction.editReply({
        content: `📺 **Channel Set**\nPanel will be published in ${channel}`,
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session)
      });
    }
  } else if (customId === 'tp:removebtn:select') {
    await interaction.deferUpdate();
    
    const buttonIndex = parseInt(interaction.values[0], 10);
    
    if (buttonIndex >= 0 && buttonIndex < session.buttons.length) {
      const removedButton = session.buttons[buttonIndex];
      session.buttons.splice(buttonIndex, 1);
      
      await interaction.editReply({
        content: `✅ **Button Removed**\nRemoved button: "${removedButton.label}"`,
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session)
      });
    } else {
      await interaction.editReply({
        content: '❌ **Invalid Selection**\nCould not remove button. Please try again.',
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session)
      });
    }
  }
}

async function handleTicketPanelModal(interaction, customId) {
  const { getBuilder, updateBuilder } = require('./ticket-builder');
  const { builderSummaryEmbed, builderControls } = require('./ticket-ui');
  const { createButton } = require('./ticket-json-storage');
  
  const session = getBuilder(interaction.guildId);
  if (!session) return;

  await interaction.deferUpdate();

  if (customId === 'tp:title:modal') {
    const title = interaction.fields.getTextInputValue('title').trim();
    updateBuilder(interaction.guildId, { title });
    
    await interaction.editReply({
      content: '🎛️ **Ticket Panel Builder**\nConfigure your ticket panel below:',
      embeds: [builderSummaryEmbed(session)],
      components: builderControls(session)
    });
  } else if (customId === 'tp:desc:modal') {
    const description = interaction.fields.getTextInputValue('desc').trim();
    updateBuilder(interaction.guildId, { description });
    
    await interaction.editReply({
      content: '🎛️ **Ticket Panel Builder**\nConfigure your ticket panel below:',
      embeds: [builderSummaryEmbed(session)],
      components: builderControls(session)
    });
  } else if (customId === 'tp:addbtn:modal') {
    const label = interaction.fields.getTextInputValue('label').trim();
    const colorRaw = interaction.fields.getTextInputValue('color').trim();
    const question = (interaction.fields.getTextInputValue('question') || '').trim();
    const row = Math.max(0, Math.min(4, parseInt(interaction.fields.getTextInputValue('row'), 10) || 0));
    
    const color = ['Primary', 'Secondary', 'Success', 'Danger'].includes(colorRaw) ? colorRaw : 'Primary';
    const position = session.buttons.filter(b => b.row_index === row).length;
    
    const newButton = {
      id: Date.now(),
      label,
      color,
      question: question || null,
      row_index: row,
      position,
      custom_id: `${label.toLowerCase().replace(/\s+/g, '_')}_${Date.now() % 10000}`
    };
    
    session.buttons.push(newButton);
    
    await interaction.editReply({
      content: '🎛️ **Ticket Panel Builder**\nConfigure your ticket panel below:',
      embeds: [builderSummaryEmbed(session)],
      components: builderControls(session)
    });
  }
}

// Ticket modal handler
async function handleTicketModal(interaction, customId) {
  const { getButtonsByGuild } = require('./ticket-json-storage');
  
  const buttonId = customId.replace('ticket:modal:', '');
  const buttons = getButtonsByGuild(interaction.guildId);
  const button = buttons.find(btn => btn.custom_id === buttonId);
  
  if (!button) {
    await interaction.reply({
      content: '❌ This ticket button is no longer valid. Please contact an administrator.',
      ephemeral: true
    });
    return;
  }
  
  const reason = interaction.fields.getTextInputValue('reason').trim();
  await createTicketDirectly(interaction, button, reason);
}

// Ticket opening handler
async function handleTicketOpen(interaction, customId) {
  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
  const { getButtonsByGuild } = require('./ticket-json-storage');
  const { createTicket } = require('./ticket-json-storage');
  
  const buttonId = customId.replace('ticket:', '');
  const buttons = getButtonsByGuild(interaction.guildId);
  
  // Debug logging
  console.log('Debug - Custom ID:', customId);
  console.log('Debug - Button ID after removal:', buttonId);
  console.log('Debug - Available buttons:', buttons.map(b => ({ label: b.label, custom_id: b.custom_id })));
  
  const button = buttons.find(btn => btn.custom_id === buttonId);
  
  if (!button) {
    console.log('Debug - Button not found!');
    await interaction.reply({
      content: `❌ This ticket button is no longer valid. The panel may have been updated recently. Please try using the updated panel or contact an administrator.`,
      ephemeral: true
    });
    return;
  }
  
  // If button has a question, show modal
  if (button.question) {
    const modal = new ModalBuilder()
      .setCustomId(`ticket:modal:${buttonId}`)
      .setTitle(`Ticket: ${button.label}`);
    
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reason')
          .setLabel(button.question)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(true)
          .setPlaceholder('Please describe your issue...')
      )
    );
    
    await interaction.showModal(modal);
  } else {
    // Create ticket immediately
    await createTicketDirectly(interaction, button, null);
  }
}

async function createTicketDirectly(interaction, button, reason) {
  const { EmbedBuilder } = require('discord.js');
  const { createTicket } = require('./ticket-json-storage');
  
  try {
    // Create ticket in memory
    const ticketId = createTicket(
      interaction.guildId,
      interaction.user.id,
      button.label.toLowerCase().replace(/\s+/g, '_'),
      interaction.channelId
    );
    
    const embed = new EmbedBuilder()
      .setTitle('🎫 Ticket Created!')
      .setColor('#8a2be2')
      .addFields(
        { name: 'Ticket ID', value: `#${ticketId}`, inline: true },
        { name: 'Type', value: button.label, inline: true },
        { name: 'Status', value: '🟢 OPEN', inline: true }
      )
      .setFooter({ text: 'Powered by Kyra' })
      .setTimestamp();
    
    if (reason) {
      embed.addFields({ name: 'Your Issue', value: reason, inline: false });
    }
    
    await interaction.reply({
      content: `✅ **Ticket Created Successfully!**\nYour ticket has been created with ID #${ticketId}. A staff member will assist you soon.`,
      embeds: [embed],
      ephemeral: true
    });
    
  } catch (error) {
    logger.error('Error creating ticket:', error);
    await interaction.reply({
      content: '❌ Failed to create ticket. Please try again or contact an administrator.',
      ephemeral: true
    });
  }
}

// Error handling
client.on('error', (error) => {
  logger.error('Discord client error:', error);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down bot...');
  client.destroy();
  process.exit(0);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
