#!/bin/bash

# Multi-Bot Health Check Script
# This script monitors multiple bots and restarts them if they're down

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

# Array of bot names to monitor
BOTS=("kyra-bot" "your-other-bot-name")

# Check each bot
for bot_name in "${BOTS[@]}"; do
    if ! pm2 list | grep -q "$bot_name.*online"; then
        log_message "WARNING: $bot_name is not running, attempting to restart..."
        
        # Try to restart the bot
        pm2 restart "$bot_name" 2>&1 >> "$LOG_FILE"
        
        # Wait a moment and check again
        sleep 5
        
        if pm2 list | grep -q "$bot_name.*online"; then
            log_message "SUCCESS: $bot_name restarted successfully"
        else
            log_message "ERROR: Failed to restart $bot_name"
            
            # Try to start fresh
            pm2 delete "$bot_name" 2>&1 >> "$LOG_FILE"
            
            # Start based on bot name
            if [ "$bot_name" = "kyra-bot" ]; then
                cd /opt/kyra-bot
                pm2 start ecosystem.config.js --env production 2>&1 >> "$LOG_FILE"
            else
                # Add your other bot start command here
                cd /path/to/your/other/bot
                pm2 start your-other-bot-ecosystem.config.js --env production 2>&1 >> "$LOG_FILE"
            fi
            
            sleep 5
            
            if pm2 list | grep -q "$bot_name.*online"; then
                log_message "SUCCESS: $bot_name started fresh successfully"
            else
                log_message "CRITICAL: $bot_name failed to start even after fresh attempt"
            fi
        fi
    else
        log_message "INFO: $bot_name is running normally"
    fi
done

# Clean up old log files (keep last 7 days)
find /opt/kyra-bot/logs -name "*.log" -mtime +7 -delete 2>/dev/null
