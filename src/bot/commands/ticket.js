const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createTicket, getTicket, closeTicket } = require('../ticket-storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage support tickets')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new support ticket')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Type of support needed')
            .setRequired(true)
            .addChoices(
              { name: 'Rust Help', value: 'rust_help' },
              { name: 'Discord Help', value: 'discord_help' },
              { name: 'Purchase Help', value: 'purchase_help' }
            ))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Brief description of your issue')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close a ticket (Admin only)')
        .addIntegerOption(option =>
          option.setName('ticket_id')
            .setDescription('Ticket ID to close')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for closing')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Get information about a ticket')
        .addIntegerOption(option =>
          option.setName('ticket_id')
            .setDescription('Ticket ID to view')
            .setRequired(true))),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    try {
      if (subcommand === 'create') {
        const type = interaction.options.getString('type');
        const reason = interaction.options.getString('reason');

        // Create ticket in memory
        const ticketId = createTicket(guildId, userId, type, interaction.channelId);

        const embed = new EmbedBuilder()
          .setTitle('🎫 Support Ticket Created!')
          .setColor('#8a2be2')
          .addFields(
            { name: 'Ticket ID', value: `#${ticketId}`, inline: true },
            { name: 'Support Type', value: type.replace('_', ' ').toUpperCase(), inline: true },
            { name: 'Status', value: '🟢 OPEN', inline: true },
            { name: 'Your Issue', value: reason, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Powered by Kyra' });

        await interaction.reply({ embeds: [embed] });

      } else if (subcommand === 'close') {
        // Check if user has admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
          await interaction.reply({
            content: '❌ Sorry! You need Manage Channels permission to close support tickets.',
            ephemeral: true
          });
          return;
        }

        const ticketId = interaction.options.getInteger('ticket_id');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const ticket = getTicket(ticketId);
        if (!ticket || ticket.guild_id !== guildId) {
          await interaction.reply({
            content: '❌ Hmm, I couldn\'t find that ticket. Make sure the ticket ID is correct and belongs to this server.',
            ephemeral: true
          });
          return;
        }

        closeTicket(ticketId, reason);

        const embed = new EmbedBuilder()
          .setTitle('🔒 Support Ticket Closed')
          .setColor('#8a2be2')
          .addFields(
            { name: 'Ticket ID', value: `#${ticketId}`, inline: true },
            { name: 'Closed by', value: interaction.user.tag, inline: true },
            { name: 'Close Reason', value: reason, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Powered by Kyra' });

        await interaction.reply({ embeds: [embed] });

      } else if (subcommand === 'info') {
        const ticketId = interaction.options.getInteger('ticket_id');

        const ticket = getTicket(ticketId);
        if (!ticket || ticket.guild_id !== guildId) {
          await interaction.reply({
            content: '❌ Hmm, I couldn\'t find that ticket. Make sure the ticket ID is correct and belongs to this server.',
            ephemeral: true
          });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle(`🎫 Support Ticket #${ticketId}`)
          .setColor('#8a2be2')
          .addFields(
            { name: 'Support Type', value: ticket.type.replace('_', ' ').toUpperCase(), inline: true },
            { name: 'Status', value: ticket.status === 'open' ? '🟢 OPEN' : '🔒 CLOSED', inline: true },
            { name: 'Opened by', value: `<@${ticket.opener_id}>`, inline: true },
            { name: 'Created', value: `<t:${Math.floor(new Date(ticket.created_at).getTime() / 1000)}:R>`, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'Powered by Kyra' });

        if (ticket.status === 'closed') {
          embed.addFields(
            { name: 'Closed', value: `<t:${Math.floor(new Date(ticket.closed_at).getTime() / 1000)}:R>`, inline: true },
            { name: 'Close Reason', value: ticket.closed_reason || 'No specific reason was provided', inline: false }
          );
        }

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in ticket command:', error);
      await interaction.reply({
        content: '❌ Oops! Something went wrong while managing your ticket. Please try again in a moment!',
        ephemeral: true
      });
    }
  },
};
