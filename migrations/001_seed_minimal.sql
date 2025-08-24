INSERT IGNORE INTO guilds(guild_id, name) VALUES
('000000000000000001', 'Example Guild');

INSERT INTO guild_settings(guild_id, `key`, value_json)
VALUES ('000000000000000001', 'theme', JSON_OBJECT('primary', '#8a2be2', 'mode', 'dark'))
ON DUPLICATE KEY UPDATE value_json = VALUES(value_json);

INSERT INTO schema_version(version) VALUES ('001_seed_minimal');
