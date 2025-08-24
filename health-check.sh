#!/bin/bash

# Kyra Bot Health Check Script
# This script monitors the bot and restarts it if it's down

BOT_NAME="kyra-bot"
LOG_FILE="/opt/kyra-bot/logs/health-check.log"

# Create log directory if it doesn't exist
mkdir -p /opt/kyra-bot/logs

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Check if PM2 is running
if ! command -v pm2 &> /dev/null; then
    log_message "ERROR: PM2 is not installed"
    exit 1
fi

# Check if bot is running
if ! pm2 list | grep -q "$BOT_NAME.*online"; then
    log_message "WARNING: Bot is not running, attempting to restart..."
    
    # Try to restart the bot
    cd /opt/kyra-bot
    pm2 restart "$BOT_NAME" 2>&1 >> "$LOG_FILE"
    
    # Wait a moment and check again
    sleep 5
    
    if pm2 list | grep -q "$BOT_NAME.*online"; then
        log_message "SUCCESS: Bot restarted successfully"
    else
        log_message "ERROR: Failed to restart bot"
        
        # Try to start fresh
        pm2 delete "$BOT_NAME" 2>&1 >> "$LOG_FILE"
        pm2 start ecosystem.config.js --env production 2>&1 >> "$LOG_FILE"
        
        sleep 5
        
        if pm2 list | grep -q "$BOT_NAME.*online"; then
            log_message "SUCCESS: Bot started fresh successfully"
        else
            log_message "CRITICAL: Bot failed to start even after fresh attempt"
        fi
    fi
else
    log_message "INFO: Bot is running normally"
fi

# Clean up old log files (keep last 7 days)
find /opt/kyra-bot/logs -name "*.log" -mtime +7 -delete 2>/dev/null
