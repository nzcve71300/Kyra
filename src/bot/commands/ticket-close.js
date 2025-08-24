const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getTicket, closeTicket } = require('../ticket-json-storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Close a ticket (Admin only)')
    .addIntegerOption(option =>
      option.setName('ticket_id')
        .setDescription('ID of the ticket to close')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for closing the ticket')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: '❌ Sorry! You need Manage Guild permission to close tickets.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const ticketId = interaction.options.getInteger('ticket_id');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      // Get ticket
      const ticket = getTicket(ticketId);
      
      if (!ticket) {
        await interaction.editReply({
          content: '❌ **Ticket Not Found**\nCould not find a ticket with that ID.',
          embeds: []
        });
        return;
      }

      // Check if ticket belongs to this guild
      if (ticket.guild_id !== interaction.guildId) {
        await interaction.editReply({
          content: '❌ **Access Denied**\nThis ticket does not belong to this server.',
          embeds: []
        });
        return;
      }

      // Check if ticket is already closed
      if (ticket.status === 'closed') {
        await interaction.editReply({
          content: '❌ **Already Closed**\nThis ticket is already closed.',
          embeds: []
        });
        return;
      }

      // Close the ticket
      const success = closeTicket(ticketId, interaction.user.id, reason);
      
      if (!success) {
        await interaction.editReply({
          content: '❌ **Error**\nFailed to close the ticket. Please try again.',
          embeds: []
        });
        return;
      }

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Closed')
        .setColor('#8a2be2')
        .addFields(
          { name: 'Ticket ID', value: `#${ticket.id}`, inline: true },
          { name: 'Type', value: ticket.type, inline: true },
          { name: 'Status', value: '🔴 CLOSED', inline: true },
          { name: 'Opened By', value: `<@${ticket.opener_id}>`, inline: true },
          { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Closed At', value: `<t:${Math.floor(new Date().getTime() / 1000)}:R>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: 'Powered by Kyra' })
        .setTimestamp();

      await interaction.editReply({
        content: `✅ **Ticket Closed Successfully!**\nTicket #${ticket.id} has been closed.`,
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in ticket-close command:', error);
      await interaction.editReply({
        content: '❌ Oops! Something went wrong while closing the ticket. Please try again in a moment!',
        embeds: []
      });
    }
  },
};
