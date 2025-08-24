-- Schema baseline for Kyra (MariaDB)
-- Engine/charset
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure safe defaults
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS schema_version (
  id INT PRIMARY KEY AUTO_INCREMENT,
  version VARCHAR(64) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GUILDS
CREATE TABLE IF NOT EXISTS guilds (
  guild_id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_guilds_active ON guilds(active);

-- GENERIC SETTINGS (KV per guild)
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id VARCHAR(32) NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  value_json JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (guild_id, `key`),
  CONSTRAINT fk_settings_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TICKETS (infra only; no bot logic yet)
CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  opener_id VARCHAR(32) NOT NULL,
  type ENUM('rust_help','discord_help','purchase_help') NOT NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  channel_id VARCHAR(32),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  closed_reason VARCHAR(512) NULL,
  CONSTRAINT fk_tickets_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_tickets_guild_status (guild_id, status),
  INDEX idx_tickets_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GIVEAWAYS (infra only)
CREATE TABLE IF NOT EXISTS giveaways (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  channel_id VARCHAR(32) NOT NULL,
  message_id VARCHAR(32) NOT NULL,
  prize VARCHAR(255) NOT NULL,
  winners_count INT NOT NULL,
  ends_at DATETIME NOT NULL,
  status ENUM('scheduled','active','ended') NOT NULL DEFAULT 'scheduled',
  CONSTRAINT fk_giveaways_guild FOREIGN KEY (guild_id) REFERENCES guilds(guild_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_giveaways_msg (guild_id, message_id),
  INDEX idx_giveaways_guild (guild_id),
  INDEX idx_giveaways_ends (ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS giveaway_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  giveaway_id BIGINT UNSIGNED NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entry (giveaway_id, user_id),
  CONSTRAINT fk_entries_giveaway FOREIGN KEY (giveaway_id) REFERENCES giveaways(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

INSERT INTO schema_version(version) VALUES ('000_init');
