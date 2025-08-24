#!/bin/bash

# Kyra Bot Deployment Script for Google Cloud
# This script sets up the bot on a fresh Google Cloud instance

echo "🚀 Starting Kyra Bot deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/kyra-bot
sudo chown $USER:$USER /opt/kyra-bot

# Clone the repository
echo "📥 Cloning repository..."
cd /opt/kyra-bot
git clone https://github.com/nzcve71300/Kyra.git .

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Create .env file (you'll need to fill this in manually)
echo "⚙️ Creating .env file..."
cp env.example .env
echo "⚠️  IMPORTANT: Please edit /opt/kyra-bot/.env with your Discord bot credentials!"

# Deploy Discord commands
echo "🤖 Deploying Discord commands..."
npm run deploy:commands

# Start the bot with PM2
echo "🚀 Starting bot with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on boot
echo "🔧 Setting up PM2 startup script..."
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit /opt/kyra-bot/.env with your Discord bot credentials"
echo "2. Restart the bot: pm2 restart kyra-bot"
echo "3. Check logs: pm2 logs kyra-bot"
echo "4. Monitor status: pm2 status"
echo ""
echo "🔗 Useful commands:"
echo "- View logs: pm2 logs kyra-bot"
echo "- Restart bot: pm2 restart kyra-bot"
echo "- Stop bot: pm2 stop kyra-bot"
echo "- View status: pm2 status"
echo "- Monitor: pm2 monit"
