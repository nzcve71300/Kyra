# 🗄️ Database Setup Guide for Kyra Bot

This guide will help you set up MariaDB/MySQL database for your Kyra Discord bot.

## 📋 Prerequisites

- A Google Cloud VM instance (where your bot is running)
- SSH access to your VM
- Basic knowledge of Linux commands

## 🔧 Step 1: Install MariaDB

### 1.1 Install MariaDB Server

```bash
# SSH into your VM
ssh YOUR_USERNAME@YOUR_VM_IP

# Update package list
sudo apt-get update

# Install MariaDB server and client
sudo apt-get install -y mariadb-server mariadb-client

# Start MariaDB service
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### 1.2 Secure MariaDB Installation

```bash
# Run the secure installation script
sudo mysql_secure_installation
```

Follow the prompts:
- **Enter current password for root**: Press Enter (no password set initially)
- **Switch to unix_socket authentication**: Answer `n` (No)
- **Change the root password**: Answer `Y` (Yes) and set a strong password
- **Remove anonymous users**: Answer `Y` (Yes)
- **Disallow root login remotely**: Answer `Y` (Yes)
- **Remove test database**: Answer `Y` (Yes)
- **Reload privilege tables**: Answer `Y` (Yes)

## 🔧 Step 2: Create Database and User

### 2.1 Access MariaDB

```bash
# Access MariaDB as root
sudo mysql -u root -p
```

### 2.2 Create Database and User

```sql
-- Create the database
CREATE DATABASE kyra;

-- Create a user for the bot
CREATE USER 'kyra_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON kyra.* TO 'kyra_user'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;

-- Verify the user was created
SELECT User, Host FROM mysql.user WHERE User = 'kyra_user';

-- Exit MariaDB
EXIT;
```

### 2.3 Test Database Connection

```bash
# Test connection with the new user
mysql -u kyra_user -p kyra
```

If successful, you should see the MariaDB prompt. Type `EXIT;` to leave.

## 🔧 Step 3: Configure Your Bot

### 3.1 Update Environment Variables

Edit your bot's `.env` file:

```bash
# Navigate to your bot directory
cd /opt/kyra-bot

# Edit the .env file
nano .env
```

### 3.2 Add Database Configuration

Uncomment and configure the database settings in your `.env` file:

```env
# ========================================
# KYRA DISCORD BOT - PRODUCTION CONFIG
# ========================================

# DISCORD BOT CONFIGURATION (REQUIRED)
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# ========================================
# DATABASE CONFIGURATION (REQUIRED for full features)
# ========================================
NODE_ENV=production
PORT=8081
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=kyra
DB_USER=kyra_user
DB_PASS=your_secure_password_here
```

**Important**: Replace `your_secure_password_here` with the password you set when creating the database user.

## 🔧 Step 4: Run Database Migrations

### 4.1 Run the Migration Script

```bash
# Navigate to your bot directory
cd /opt/kyra-bot

# Run database migrations
npm run migrate
```

This will create all the necessary tables for:
- Guild settings
- Giveaways
- Tickets
- User data

### 4.2 Verify Tables Created

```bash
# Access the database
mysql -u kyra_user -p kyra

# Show all tables
SHOW TABLES;

# You should see tables like:
# - guilds
# - settings
# - giveaways
# - tickets
# - users

# Exit MariaDB
EXIT;
```

## 🔧 Step 5: Test Database Connection

### 5.1 Test from Bot

```bash
# Restart your bot to load the new database configuration
pm2 restart kyra-bot

# Check the logs for any database connection errors
pm2 logs kyra-bot
```

### 5.2 Verify Database Features

Once your bot is running with the database:

1. **Test giveaways**: Create a giveaway to see if it's stored in the database
2. **Test tickets**: Create a ticket to verify database storage
3. **Test settings**: Change bot settings to see if they persist

## 🔧 Step 6: Database Maintenance

### 6.1 Backup Database

Create a backup script:

```bash
# Create backup directory
mkdir -p /opt/kyra-bot/backups

# Create backup script
nano /opt/kyra-bot/backup-db.sh
```

Add this content:

```bash
#!/bin/bash
# Database backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/kyra-bot/backups"
DB_NAME="kyra"
DB_USER="kyra_user"

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/kyra_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/kyra_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "kyra_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: kyra_backup_$DATE.sql.gz"
```

Make it executable:

```bash
chmod +x /opt/kyra-bot/backup-db.sh
```

### 6.2 Set Up Automated Backups

```bash
# Add to crontab to run daily at 2 AM
crontab -e

# Add this line:
0 2 * * * /opt/kyra-bot/backup-db.sh
```

## 🔧 Step 7: Troubleshooting

### 7.1 Common Issues

**Connection Refused**:
```bash
# Check if MariaDB is running
sudo systemctl status mariadb

# Start if not running
sudo systemctl start mariadb
```

**Access Denied**:
```bash
# Reset user password
sudo mysql -u root -p
ALTER USER 'kyra_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

**Database Not Found**:
```bash
# Check if database exists
mysql -u root -p
SHOW DATABASES;
CREATE DATABASE kyra;  # if missing
EXIT;
```

### 7.2 Check Database Logs

```bash
# View MariaDB logs
sudo tail -f /var/log/mysql/error.log

# Check bot logs for database errors
pm2 logs kyra-bot
```

## 🔧 Step 8: Performance Optimization

### 8.1 MariaDB Configuration

Edit MariaDB configuration for better performance:

```bash
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Add these optimizations:

```ini
[mysqld]
# InnoDB settings
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2

# Connection settings
max_connections = 100
max_allowed_packet = 16M

# Query cache
query_cache_type = 1
query_cache_size = 32M
```

Restart MariaDB:

```bash
sudo systemctl restart mariadb
```

## 🔧 Step 9: Security Best Practices

### 9.1 Firewall Configuration

```bash
# Only allow local connections to MariaDB
sudo ufw deny 3306
```

### 9.2 Regular Updates

```bash
# Update MariaDB regularly
sudo apt-get update
sudo apt-get upgrade mariadb-server
```

### 9.3 Monitor Database Size

```bash
# Check database size
mysql -u kyra_user -p kyra -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'kyra' GROUP BY table_schema;"
```

## ✅ Verification Checklist

- [ ] MariaDB installed and secured
- [ ] Database 'kyra' created
- [ ] User 'kyra_user' created with proper privileges
- [ ] Environment variables configured in `.env`
- [ ] Database migrations run successfully
- [ ] Bot restarted and connected to database
- [ ] Database features tested (giveaways, tickets, settings)
- [ ] Backup script created and tested
- [ ] Automated backups scheduled

Your Kyra bot is now fully connected to MariaDB and ready to use all database features! 🎉
