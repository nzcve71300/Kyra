#!/bin/bash

# Kyra Bot Quick Start Script for Local Development

echo "🚀 Starting Kyra Bot locally..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your Discord bot credentials before starting!"
    echo "   You can find your credentials at: https://discord.com/developers/applications"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Deploy Discord commands
echo "🤖 Deploying Discord commands..."
npm run deploy:commands

# Start the bot
echo "🚀 Starting bot..."
npm run dev:bot
