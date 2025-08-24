@echo off
echo 🚀 Starting Kyra Bot locally...

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your Discord bot credentials before starting!
    echo    You can find your credentials at: https://discord.com/developers/applications
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Deploy Discord commands
echo 🤖 Deploying Discord commands...
npm run deploy:commands

REM Start the bot
echo 🚀 Starting bot...
npm run dev:bot

pause
