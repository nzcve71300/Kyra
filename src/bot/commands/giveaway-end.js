const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGiveaway, endGiveaway, getWinners } = require('../giveaway-storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('Manually end a giveaway (Admin only)')
    .addIntegerOption(option =>
      option.setName('giveaway_id')
        .setDescription('Giveaway ID to end')
        .setRequired(true)),
  
  async execute(interaction) {
    // Check if user has manage messages permission
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: '❌ Sorry! You need Manage Messages permission to end giveaways.',
        ephemeral: true
      });
      return;
    }

    const giveawayId = interaction.options.getInteger('giveaway_id');
    const guildId = interaction.guildId;

    try {
      const giveaway = getGiveaway(giveawayId);
      if (!giveaway || giveaway.guild_id !== guildId) {
        await interaction.reply({
          content: '❌ Hmm, I couldn\'t find that giveaway. Make sure the ID is correct and belongs to this server.',
          ephemeral: true
        });
        return;
      }

      if (giveaway.status === 'ended') {
        await interaction.reply({
          content: '❌ This giveaway has already ended!',
          ephemeral: true
        });
        return;
      }

      // End the giveaway
      endGiveaway(giveawayId);
      
      // Get winners
      const winners = getWinners(giveawayId);
      
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
      
      await interaction.reply({ content: winnerMentions, embeds: [embed] });
      
      // Send DM to each winner
      for (const winnerId of winners) {
        try {
          const winner = await interaction.client.users.fetch(winnerId);
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
          console.log(`Sent winner DM to ${winner.tag} for giveaway #${giveaway.id}`);
        } catch (error) {
          // User might have DMs disabled, that's okay
          console.log(`Could not send winner DM to user ${winnerId} - DMs might be disabled`);
        }
      }

    } catch (error) {
      console.error('Error in giveaway-end command:', error);
      await interaction.reply({
        content: '❌ Oops! Something went wrong while ending the giveaway. Please try again in a moment!',
        ephemeral: true
      });
    }
  },
};
