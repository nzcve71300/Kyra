# Kyra — Discord Bot Infrastructure

Production-grade foundation for a public, multitenant Discord bot using MariaDB with a clean, safe schema and a JS data layer.

## Tech Stack

- **Node.js (LTS)** + JavaScript
- **mysql2/promise** (MariaDB driver)
- **Express** (tiny API for health checks only)
- **dotenv** for environment configuration
- **Migrations** via raw SQL files + simple migrator script (JS)
- **InnoDB, utf8mb4, strict SQL mode**

## Project Structure

```
/src
  /api
    server.js
    routes/
      health.js
  /bot
    index.js
    deploy-commands.js
    commands/
      ping.js
      settings.js
      ticket.js
      giveaway.js
  /db
    pool.js
    migrator.js
    repositories/
      guilds.repo.js
      settings.repo.js
      tickets.repo.js
      giveaways.repo.js
  /utils
    logger.js
/migrations
  000_init.sql
  001_seed_minimal.sql
env.example
README.md
package.json
```

## Quick Start

### 1. Database Setup

Create the database and user in MariaDB:

```sql
CREATE DATABASE kyra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kyra_user'@'%' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL PRIVILEGES ON kyra.* TO 'kyra_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Environment Configuration

Copy the environment example and configure:

```bash
cp env.example .env
```

Edit `.env` with your database credentials:

```env
NODE_ENV=development
PORT=8080

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=kyra
DB_USER=kyra_user
DB_PASS=CHANGE_ME
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Start API Server

```bash
npm run dev:api
```

### 6. Test Endpoints

- **Health Check**: `GET http://localhost:8080/api/health`
- **Database Check**: `GET http://localhost:8080/api/db-check`

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Kyra")
3. Go to the "Bot" section and click "Add Bot"
4. Copy the bot token and client ID

### 2. Configure Bot Token

Add your Discord credentials to `.env`:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
```

### 3. Deploy Commands

```bash
npm run deploy:commands
```

### 4. Start the Bot

```bash
npm run dev:bot
```

### 5. Available Commands

- `/ping` - Test bot latency
- `/settings view` - View guild settings (in-memory storage)
- `/settings set <key> <value>` - Set a guild setting (JSON format, in-memory storage)
- `/ticket create <type> <reason>` - Create a support ticket (in-memory storage)
- `/ticket info <id>` - View ticket information
- `/ticket close <id> [reason]` - Close a ticket (Admin only)
- `/giveaway-create <duration> <winners> <prize> <description>` - Create an interactive giveaway with buttons (Admin only, in-memory storage)
- `/giveaway-end <id>` - Manually end a giveaway (Admin only, for testing)
- `/ticket-setup` - Configure ticket panel with interactive builder (Admin only, JSON storage)
- `/setup-ticket-system` - Complete ticket system setup with channel selection (Admin only, JSON storage)
- `/ticket-list` - List all tickets in the server (Admin only, JSON storage)
- `/ticket-info <id>` - View detailed ticket information (Admin only, JSON storage)
- `/ticket-close <id> [reason]` - Close a ticket (Admin only, JSON storage)

**Giveaway Features:**
- Interactive Enter/Leave buttons
- Automatic timer-based ending
- Winner selection and announcement
- DM notifications for winners
- Rich embeds with vertical layout

**Ticket Panel Features:**
- Interactive builder with modals and select menus
- Embed or text style panels
- Customizable buttons with colors and questions
- Color emojis and better descriptions
- Channel selection and preview
- Complete setup wizard (`/setup-ticket-system`)
- JSON-based persistent storage for testing
- Full ticket lifecycle management (create, view, close)

## Database Schema

### Core Tables

- **`guilds`** - Discord server information
- **`guild_settings`** - Key-value settings per guild (JSON)
- **`tickets`** - Support ticket system (infra only)
- **`giveaways`** - Giveaway management (infra only)
- **`giveaway_entries`** - User entries for giveaways

### Data Integrity Features

- **InnoDB** engine with foreign key constraints
- **utf8mb4_unicode_ci** for full emoji/Unicode support
- **CASCADE** deletes to prevent orphaned records
- **Multitenant design** - all operations scoped to guild_id
- **JSON storage** for flexible settings
- **Proper indexing** for performance

## Repository Pattern

Clean, guild-scoped data access:

```javascript
const { upsertGuild, getGuild } = require('./src/db/repositories/guilds.repo');
const { getAllSettings, setSetting } = require('./src/db/repositories/settings.repo');

// Guild management
await upsertGuild('123456789', 'My Discord Server');
const guild = await getGuild('123456789');

// Settings management
await setSetting('123456789', 'theme', { primary: '#8a2be2', mode: 'dark' });
const settings = await getAllSettings('123456789');
```

## Transaction Support

Use the `withTx` helper for multi-table operations:

```javascript
const { withTx } = require('./src/db/pool');

await withTx(async (conn) => {
  // Multiple operations in a single transaction
  await conn.query('INSERT INTO guilds ...');
  await conn.query('INSERT INTO guild_settings ...');
});
```

## Recommended MariaDB Settings

Add to your MariaDB configuration:

```ini
sql_mode=STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ZERO_DATE,NO_ZERO_IN_DATE
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
```

## Production Considerations

- **Backups**: Enable daily `mysqldump` as soon as this goes live
- **Monitoring**: Add health checks and metrics
- **Security**: Use strong passwords and limit database access
- **Performance**: Monitor query performance and add indexes as needed

## Next Steps

This infrastructure provides the foundation for:
- Discord bot commands and features
- Ticket system implementation
- Giveaway management
- Guild settings and customization
- User management and permissions

The schema is designed to be extensible while maintaining data integrity and performance.
