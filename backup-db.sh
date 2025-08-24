#!/bin/bash

# Kyra Bot Database Backup Script
# This script creates automated backups of the MariaDB database

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/kyra-bot/backups"
DB_NAME="kyra"
DB_USER="kyra_user"
LOG_FILE="/opt/kyra-bot/logs/backup.log"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR
mkdir -p /opt/kyra-bot/logs

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Check if MariaDB is running
if ! systemctl is-active --quiet mariadb; then
    log_message "ERROR: MariaDB is not running"
    exit 1
fi

# Create backup
log_message "Starting database backup..."

# Create backup with timestamp
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/kyra_backup_$DATE.sql 2>> $LOG_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Compress backup
    gzip $BACKUP_DIR/kyra_backup_$DATE.sql
    
    # Get backup size
    BACKUP_SIZE=$(du -h $BACKUP_DIR/kyra_backup_$DATE.sql.gz | cut -f1)
    
    log_message "SUCCESS: Database backup completed: kyra_backup_$DATE.sql.gz (Size: $BACKUP_SIZE)"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "kyra_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null
    
    # Count remaining backups
    BACKUP_COUNT=$(ls -1 $BACKUP_DIR/kyra_backup_*.sql.gz 2>/dev/null | wc -l)
    log_message "INFO: $BACKUP_COUNT backup files remaining"
    
else
    log_message "ERROR: Database backup failed"
    exit 1
fi

# Optional: Send notification (you can add Discord webhook here)
# curl -H "Content-Type: application/json" -X POST -d '{"content":"Database backup completed successfully"}' YOUR_DISCORD_WEBHOOK_URL

log_message "Backup process completed"
