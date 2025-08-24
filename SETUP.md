# Kyra Bot - Quick Setup Guide

## Prerequisites

- Node.js (LTS version)
- MariaDB/MySQL server
- Discord Developer Account

## Step 1: Database Setup

1. **Install MariaDB** (if not already installed)
2. **Create database and user:**
   ```sql
   CREATE DATABASE kyra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'kyra_user'@'%' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON kyra.* TO 'kyra_user'@'%';
   FLUSH PRIVILEGES;
   ```

## Step 2: Discord Bot Setup

1. **Go to [Discord Developer Portal](https://discord.com/developers/applications)**
2. **Create New Application:**
   - Click "New Application"
   - Name it "Kyra" (or your preferred name)
   - Go to "Bot" section
   - Click "Add Bot"
   - Copy the bot token
   - Copy the Application ID (Client ID)

3. **Configure Bot Permissions:**
   - In the Bot section, enable these permissions:
     - Send Messages
     - Use Slash Commands
     - Embed Links
     - Manage Messages (for giveaways)
     - Manage Channels (for tickets)

4. **Invite Bot to Your Server:**
   - Go to OAuth2 > URL Generator
   - Select "bot" scope
   - Select the permissions above
   - Use the generated URL to invite the bot

## Step 3: Environment Configuration

1. **Copy environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` with your credentials:**
   ```env
   NODE_ENV=development
   PORT=8080

   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=kyra
   DB_USER=kyra_user
   DB_PASS=your_secure_password

   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   ```

## Step 4: Install and Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run database migrations:**
   ```bash
   npm run migrate
   ```

3. **Deploy Discord commands:**
   ```bash
   npm run deploy:commands
   ```

## Step 5: Start the Bot

```bash
npm run dev:bot
```

You should see:
```
[INFO] Logged in as Kyra#1234
[INFO] Serving 1 guilds
```

## Testing the Bot

1. **Test ping command:**
   ```
   /ping
   ```

2. **Test settings:**
   ```
   /settings set theme {"primary": "#8a2be2", "mode": "dark"}
   /settings view
   ```

3. **Test ticket system:**
   ```
   /ticket create rust_help "Need help with Rust programming"
   ```

4. **Test giveaway system:**
   ```
   /giveaway-create 1h 1 "Discord Nitro" "An amazing giveaway for Discord Nitro!"
   ```

## Troubleshooting

### Bot not responding to commands?
- Make sure you ran `npm run deploy:commands`
- Check that the bot has the correct permissions
- Verify the bot token is correct

### Database connection errors?
- Check MariaDB is running
- Verify database credentials in `.env`
- Ensure the database and user exist

### Commands not showing up?
- Wait a few minutes for Discord to sync
- Try redeploying commands: `npm run deploy:commands`
- Check the bot has "Use Slash Commands" permission

## Next Steps

Once the bot is running locally, you can:
- Add more commands
- Customize the database schema
- Add more features like moderation, logging, etc.
- Deploy to a hosting platform when ready

## Development Tips

- Use `console.log()` for debugging
- Check the bot logs for errors
- Test commands in a private Discord server first
- Use the database repositories for data operations
