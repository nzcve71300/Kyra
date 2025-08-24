const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getTicket } = require('../ticket-json-storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-info')
    .setDescription('View detailed ticket information')
    .addIntegerOption(option =>
      option.setName('ticket_id')
        .setDescription('ID of the ticket to view')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: '❌ Sorry! You need Manage Guild permission to view ticket information.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const ticketId = interaction.options.getInteger('ticket_id');

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

      // Create detailed embed
      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticket.id}`)
        .setColor(ticket.status === 'open' ? '#8a2be2' : '#666666')
        .addFields(
          { name: 'Status', value: ticket.status === 'open' ? '🟢 OPEN' : '🔴 CLOSED', inline: true },
          { name: 'Type', value: ticket.type, inline: true },
          { name: 'Opened By', value: `<@${ticket.opener_id}>`, inline: true },
          { name: 'Created At', value: `<t:${Math.floor(new Date(ticket.created_at).getTime() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'Powered by Kyra' })
        .setTimestamp();

      // Add reason if provided
      if (ticket.reason) {
        embed.addFields({ name: 'Issue Description', value: ticket.reason, inline: false });
      }

      // Add closing information if closed
      if (ticket.status === 'closed') {
        embed.addFields(
          { name: 'Closed By', value: `<@${ticket.closed_by}>`, inline: true },
          { name: 'Closed At', value: `<t:${Math.floor(new Date(ticket.closed_at).getTime() / 1000)}:R>`, inline: true }
        );
        
        if (ticket.closed_reason) {
          embed.addFields({ name: 'Close Reason', value: ticket.closed_reason, inline: false });
        }
      }

      await interaction.editReply({
        content: `📋 **Ticket Information**\nDetails for ticket #${ticket.id}:`,
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in ticket-info command:', error);
      await interaction.editReply({
        content: '❌ Oops! Something went wrong while fetching ticket information. Please try again in a moment!',
        embeds: []
      });
    }
  },
};
