const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadOrInitBuilder } = require('../ticket-builder');
const { builderSummaryEmbed, builderControls, channelSelectMenu } = require('../ticket-ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-ticket-system')
    .setDescription('Complete ticket system setup with channel selection')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: '❌ Sorry! You need Manage Guild permission to setup the ticket system.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Load existing panel or create defaults
      const session = await loadOrInitBuilder(interaction.guild);

      // Check if we need to set a channel first
      if (!session.channel_id) {
        await interaction.editReply({
          content: '🎛️ **Ticket System Setup**\nFirst, let\'s choose where to publish your ticket panel:',
          embeds: [builderSummaryEmbed(session)],
          components: [channelSelectMenu(interaction.guild)]
        });
        return;
      }

      // If channel is already set, show the full builder
      await interaction.editReply({
        content: '🎛️ **Ticket System Setup**\nConfigure your ticket panel below:',
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session),
      });
    } catch (error) {
      console.error('Error in setup-ticket-system command:', error);
      await interaction.editReply({
        content: '❌ Oops! Something went wrong while setting up the ticket system. Please try again in a moment!',
        embeds: [],
        components: []
      });
    }
  },
};
