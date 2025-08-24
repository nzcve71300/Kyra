const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getAllTickets } = require('../ticket-json-storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-list')
    .setDescription('List all tickets in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: '❌ Sorry! You need Manage Guild permission to view tickets.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const tickets = getAllTickets(interaction.guildId);
      
      if (tickets.length === 0) {
        await interaction.editReply({
          content: '📋 **No Tickets Found**\nThere are no tickets in this server yet.',
          embeds: []
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Server Tickets')
        .setColor('#8a2be2')
        .setDescription(`Found **${tickets.length}** ticket(s) in this server:`)
        .setFooter({ text: 'Powered by Kyra' })
        .setTimestamp();

      // Group tickets by status
      const openTickets = tickets.filter(t => t.status === 'open');
      const closedTickets = tickets.filter(t => t.status === 'closed');

      if (openTickets.length > 0) {
        const openList = openTickets.slice(0, 10).map(ticket => 
          `**#${ticket.id}** - ${ticket.type} by <@${ticket.opener_id}>`
        ).join('\n');
        
        embed.addFields({
          name: `🟢 Open Tickets (${openTickets.length})`,
          value: openList + (openTickets.length > 10 ? '\n*... and more*' : ''),
          inline: false
        });
      }

      if (closedTickets.length > 0) {
        const closedList = closedTickets.slice(0, 5).map(ticket => 
          `**#${ticket.id}** - ${ticket.type} by <@${ticket.opener_id}>`
        ).join('\n');
        
        embed.addFields({
          name: `🔴 Closed Tickets (${closedTickets.length})`,
          value: closedList + (closedTickets.length > 5 ? '\n*... and more*' : ''),
          inline: false
        });
      }

      await interaction.editReply({
        content: `📋 **Ticket Summary**\nServer has ${tickets.length} total tickets`,
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in ticket-list command:', error);
      await interaction.editReply({
        content: '❌ Oops! Something went wrong while fetching tickets. Please try again in a moment!',
        embeds: []
      });
    }
  },
};
