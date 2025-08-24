const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadOrInitBuilder } = require('../ticket-builder');
const { builderSummaryEmbed, builderControls } = require('../ticket-ui');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Configure your ticket panel with an interactive builder')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: '❌ Sorry! You need Manage Guild permission to configure ticket panels.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Load existing panel or create defaults
      const session = await loadOrInitBuilder(interaction.guild);

      await interaction.editReply({
        content: '🎛️ **Ticket Panel Builder**\nConfigure your ticket panel below:',
        embeds: [builderSummaryEmbed(session)],
        components: builderControls(session),
      });
    } catch (error) {
      console.error('Error in ticket-setup command:', error);
      await interaction.editReply({
        content: '❌ Oops! Something went wrong while setting up the ticket panel. Please try again in a moment!',
        embeds: [],
        components: []
      });
    }
  },
};
