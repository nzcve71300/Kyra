const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getButtonsByGuild, getPanel } = require('../ticket-json-storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug-tickets')
    .setDescription('Debug ticket system (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: '❌ Sorry! You need Manage Guild permission to debug tickets.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const guildId = interaction.guildId;
      
      // Get panel info
      const panel = getPanel(guildId);
      const buttons = getButtonsByGuild(guildId);

      const embed = new EmbedBuilder()
        .setTitle('🔧 Ticket System Debug')
        .setColor('#8a2be2')
        .setFooter({ text: 'Powered by Kyra' })
        .setTimestamp();

      // Panel info
      if (panel) {
        embed.addFields(
          { name: 'Panel Status', value: '✅ Found', inline: true },
          { name: 'Title', value: panel.title, inline: true },
          { name: 'Channel', value: panel.channel_id ? `<#${panel.channel_id}>` : 'Not set', inline: true },
          { name: 'Message ID', value: panel.message_id || 'Not set', inline: true }
        );
      } else {
        embed.addFields({ name: 'Panel Status', value: '❌ Not found', inline: false });
      }

      // Buttons info
      embed.addFields({ name: 'Buttons Found', value: buttons.length.toString(), inline: false });

      if (buttons.length > 0) {
        const buttonList = buttons.map(btn => 
          `**${btn.label}**\n` +
          `ID: \`${btn.id}\`\n` +
          `Custom ID: \`${btn.custom_id}\`\n` +
          `Button ID: \`ticket:${btn.custom_id}\`\n` +
          `Color: ${btn.color}\n` +
          `Question: ${btn.question || 'None'}\n` +
          `Row: ${btn.row_index}, Pos: ${btn.position}`
        ).join('\n\n');

        embed.addFields({ name: 'Button Details', value: buttonList, inline: false });
      }

      await interaction.editReply({
        content: '🔧 **Debug Information**\nHere\'s what I found in your ticket system:',
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in debug-tickets command:', error);
      await interaction.editReply({
        content: '❌ Oops! Something went wrong while debugging. Please try again in a moment!',
        embeds: []
      });
    }
  },
};
