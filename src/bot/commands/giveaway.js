const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGiveaway, setMessageId } = require('../giveaway-storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-create')
    .setDescription('Create an exciting giveaway with interactive buttons!')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('How long the giveaway runs (e.g., 3m, 2h, 1d, 1w, 6M)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('winners')
        .setDescription('Number of lucky winners')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10))
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('What amazing prize are you giving away?')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Tell everyone about this awesome giveaway!')
        .setRequired(true)),
  
  async execute(interaction) {
    // Check if user has manage messages permission
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: '❌ Sorry! You need Manage Messages permission to create exciting giveaways.',
        ephemeral: true
      });
      return;
    }

    const durationStr = interaction.options.getString('duration');
    const winnersCount = interaction.options.getInteger('winners');
    const prize = interaction.options.getString('prize');
    const description = interaction.options.getString('description');
    const guildId = interaction.guildId;

    try {
      // Parse duration with support for minutes, hours, days, weeks, months
      let durationMs = 0;
      const durationMatch = durationStr.toLowerCase().replace(/\s+/g, '').match(/^(\d+)([mhdwM])$/);
      
      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2];
        switch (unit) {
          case 'm': durationMs = value * 60 * 1000; break; // minutes
          case 'h': durationMs = value * 60 * 60 * 1000; break; // hours
          case 'd': durationMs = value * 24 * 60 * 60 * 1000; break; // days
          case 'w': durationMs = value * 7 * 24 * 60 * 60 * 1000; break; // weeks
          case 'M': durationMs = value * 30 * 24 * 60 * 60 * 1000; break; // months (approximate)
        }
      }

      if (durationMs === 0) {
        await interaction.reply({
          content: '❌ Oops! That duration format doesn\'t look right. Try using formats like: 3m, 2h, 1d, 1w, or 6M',
          ephemeral: true
        });
        return;
      }

      const endsAt = new Date(Date.now() + durationMs);

      // Create giveaway in memory (for testing without database)
      const giveawayId = createGiveaway(
        guildId,
        interaction.channelId,
        prize,
        winnersCount,
        endsAt
      );

      // Create the main embed
      const embed = new EmbedBuilder()
        .setTitle(`${prize}`)
        .setColor('#8a2be2')
        .setDescription(description)
        .addFields(
          { name: '🏆 Winners', value: winnersCount.toString(), inline: false },
          { name: '⏰ Duration', value: durationStr, inline: false },
          { name: '📅 Ends', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: false },
          { name: '👥 Entries', value: '0', inline: false },
          { name: '🎯 Max Entries', value: '∞', inline: false },
          { name: '🆔 Giveaway ID', value: `#${giveawayId}`, inline: false }
        )
        .setFooter({ text: 'Powered by Kyra' })
        .setTimestamp();

      // Create buttons
      const enterButton = new ButtonBuilder()
        .setCustomId(`giveaway_enter_${giveawayId}`)
        .setLabel('Enter Giveaway')
        .setStyle(ButtonStyle.Success);

      const leaveButton = new ButtonBuilder()
        .setCustomId(`giveaway_leave_${giveawayId}`)
        .setLabel('Leave Giveaway')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder()
        .addComponents(enterButton, leaveButton);

      const reply = await interaction.reply({ 
        embeds: [embed], 
        components: [row],
        fetchReply: true
      });
      
      // Store the message ID for later winner announcement
      setMessageId(giveawayId, reply.id);

    } catch (error) {
      console.error('Error in giveaway command:', error);
      await interaction.reply({
        content: '❌ Oops! Something went wrong while creating the giveaway. Please try again in a moment!',
        ephemeral: true
      });
    }
  },
};
