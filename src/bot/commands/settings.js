const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllSettings, setSetting } = require('../settings-storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage guild settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current guild settings'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a guild setting')
        .addStringOption(option =>
          option.setName('key')
            .setDescription('Setting key')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('value')
            .setDescription('Setting value (JSON)')
            .setRequired(true))),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    try {
      if (subcommand === 'view') {
        const settings = getAllSettings(guildId);
        
        const embed = new EmbedBuilder()
          .setTitle('🎛️ Guild Settings')
          .setColor('#8a2be2')
          .setTimestamp()
          .setFooter({ text: 'Powered by Kyra' });

        if (Object.keys(settings).length === 0) {
          embed.setDescription('Looks like you haven\'t set up any custom settings yet! Once you do, they\'ll appear right here.');
        } else {
          for (const [key, value] of Object.entries(settings)) {
            embed.addFields({
              name: key,
              value: `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``,
              inline: false
            });
          }
        }

        await interaction.reply({ embeds: [embed] });

      } else if (subcommand === 'set') {
        const key = interaction.options.getString('key');
        const valueStr = interaction.options.getString('value');
        
        let value;
        try {
          value = JSON.parse(valueStr);
        } catch (error) {
          await interaction.reply({
            content: '❌ Oops! That doesn\'t look like valid JSON. Make sure to use proper JSON format with quotes around keys and values.',
            ephemeral: true
          });
          return;
        }

        setSetting(guildId, key, value);
        
        const embed = new EmbedBuilder()
          .setTitle('✅ Setting Updated Successfully!')
          .setColor('#8a2be2')
          .addFields(
            { name: 'Setting Key', value: key, inline: true },
            { name: 'New Value', value: `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Powered by Kyra' });

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in settings command:', error);
      await interaction.reply({
        content: '❌ Something went wrong while managing your settings. Please try again in a moment!',
        ephemeral: true
      });
    }
  },
};
