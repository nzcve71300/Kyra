# 🚀 Kyra Bot Deployment Guide

This guide will help you deploy your Kyra Discord bot to GitHub and run it 24/7 on Google Cloud.

## 📋 Prerequisites

- A Discord bot application (get from [Discord Developer Portal](https://discord.com/developers/applications))
- A GitHub account
- A Google Cloud account with billing enabled
- SSH access to your Google Cloud instance

## 🔧 Step 1: Prepare Your Bot for GitHub

### 1.1 Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `kyra-discord-bot`
3. Make it private if you want to keep your bot code secure

### 1.2 Push Your Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Kyra Discord Bot"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### 1.3 Important Security Notes

- ✅ The `.env` file is already in `.gitignore` - your secrets are safe
- ✅ `node_modules/` is ignored - dependencies will be installed on the server
- ✅ Data files are ignored - they'll be created on the server

## ☁️ Step 2: Set Up Google Cloud

### 2.1 Create a Google Cloud Instance

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Compute Engine API
4. Create a new VM instance:
   - **Machine type**: e2-micro (free tier) or e2-small for better performance
   - **Boot disk**: Ubuntu 20.04 LTS or newer
   - **Firewall**: Allow HTTP/HTTPS traffic
   - **Access scopes**: Allow full access to all Cloud APIs

### 2.2 Connect to Your Instance

```bash
# Connect via SSH (replace with your instance details)
gcloud compute ssh YOUR_INSTANCE_NAME --zone=YOUR_ZONE

# Or use regular SSH if you have SSH keys set up
ssh YOUR_USERNAME@YOUR_INSTANCE_IP
```

## 🚀 Step 3: Deploy Your Bot

### 3.1 Run the Deployment Script

```bash
# Download the deployment script
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO_NAME/main/deploy.sh

# Make it executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### 3.2 Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git

# Clone your repository
cd /opt
sudo mkdir kyra-bot
sudo chown $USER:$USER kyra-bot
cd kyra-bot
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .

# Install dependencies
npm install

# Create logs directory
mkdir logs

# Copy environment file
cp env.example .env
```

### 3.3 Configure Your Bot

1. Edit the `.env` file with your Discord credentials:
```bash
nano /opt/kyra-bot/.env
```

2. Add your Discord bot token and client ID:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
```

### 3.4 Deploy Discord Commands

```bash
cd /opt/kyra-bot
npm run deploy:commands
```

### 3.5 Start the Bot

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 🔍 Step 4: Monitor Your Bot

### 4.1 Check Bot Status

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs kyra-bot

# Monitor in real-time
pm2 monit
```

### 4.2 Useful PM2 Commands

```bash
# Restart bot
pm2 restart kyra-bot

# Stop bot
pm2 stop kyra-bot

# Delete bot from PM2
pm2 delete kyra-bot

# View detailed info
pm2 show kyra-bot
```

## 🔄 Step 5: Update Your Bot

When you make changes to your bot:

### 5.1 Push Changes to GitHub

```bash
# On your local machine
git add .
git commit -m "Update bot features"
git push origin main
```

### 5.2 Update on Google Cloud

```bash
# SSH into your Google Cloud instance
ssh YOUR_USERNAME@YOUR_INSTANCE_IP

# Navigate to bot directory
cd /opt/kyra-bot

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Deploy updated commands (if changed)
npm run deploy:commands

# Restart the bot
pm2 restart kyra-bot
```

## 🛠️ Troubleshooting

### Bot Not Starting

1. Check logs: `pm2 logs kyra-bot`
2. Verify `.env` file has correct credentials
3. Check Discord bot token is valid
4. Ensure bot has proper permissions in Discord

### Bot Disconnects

1. Check internet connection on Google Cloud instance
2. Verify Discord API is accessible
3. Check if bot token is still valid
4. Review PM2 logs for errors

### Commands Not Working

1. Deploy commands: `npm run deploy:commands`
2. Check if bot has proper permissions in Discord server
3. Verify command files are properly structured

## 📊 Monitoring and Maintenance

### Set Up Log Rotation

```bash
# Install logrotate
sudo apt-get install logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/kyra-bot
```

Add this content:
```
/opt/kyra-bot/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 $USER $USER
}
```

### Set Up Health Checks

You can create a simple health check script:

```bash
# Create health check script
nano /opt/kyra-bot/health-check.sh
```

```bash
#!/bin/bash
if ! pm2 list | grep -q "kyra-bot.*online"; then
    echo "Bot is down, restarting..."
    pm2 restart kyra-bot
    # You could also send a notification here
fi
```

Make it executable and add to crontab:
```bash
chmod +x /opt/kyra-bot/health-check.sh
crontab -e
# Add this line to run every 5 minutes:
# */5 * * * * /opt/kyra-bot/health-check.sh
```

## 🔒 Security Best Practices

1. **Keep your bot token secret** - Never commit it to GitHub
2. **Use private repositories** - Keep your bot code private
3. **Regular updates** - Keep your system and dependencies updated
4. **Firewall rules** - Only allow necessary ports
5. **SSH keys** - Use SSH keys instead of passwords
6. **Regular backups** - Backup your bot configuration

## 📞 Support

If you encounter issues:

1. Check the logs: `pm2 logs kyra-bot`
2. Verify your Discord bot configuration
3. Check Google Cloud instance status
4. Review this deployment guide

Your bot should now be running 24/7 on Google Cloud! 🎉
