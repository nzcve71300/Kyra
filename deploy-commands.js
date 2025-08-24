require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src/bot/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all commands
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.log(`⚠️  [WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Get deployment type from command line argument
const deploymentType = process.argv[2] || 'global'; // 'global' or 'guild'
const guildId = process.argv[3]; // Optional guild ID for guild-specific deployment

// Deploy commands
(async () => {
  try {
    console.log(`🚀 Started refreshing ${commands.length} application (/) commands...`);
    console.log(`📡 Deployment type: ${deploymentType.toUpperCase()}`);

    let data;
    
    if (deploymentType === 'guild' && guildId) {
      // Deploy to specific guild (faster for testing)
      console.log(`🎯 Deploying to guild: ${guildId}`);
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
        { body: commands },
      );
    } else {
      // Deploy globally (takes up to 1 hour to propagate)
      console.log(`🌍 Deploying globally (may take up to 1 hour to appear everywhere)`);
      data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands },
      );
    }

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands!`);
    console.log(`📋 Commands deployed:`);
    data.forEach(cmd => console.log(`   - /${cmd.name}`));
    
    if (deploymentType === 'global') {
      console.log(`\n⏰ Note: Global commands may take up to 1 hour to appear in all servers.`);
      console.log(`💡 For testing, use: node deploy-commands.js guild YOUR_GUILD_ID`);
    }
    
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    process.exit(1);
  }
})();
