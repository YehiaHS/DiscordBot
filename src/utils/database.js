/**
 * SQLite database initialization and access layer.
 * Uses better-sqlite3 for synchronous, fast operations.
 */
const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "..", "jewbot.db");

let db;

/**
 * Initialize the database and create tables if they don't exist.
 * @returns {Database} The database instance
 */
function initDatabase() {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS xp (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      last_xp_at INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS economy (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      balance INTEGER DEFAULT 0,
      bank INTEGER DEFAULT 0,
      last_daily INTEGER DEFAULT 0,
      last_work INTEGER DEFAULT 0,
      last_rob INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      PRIMARY KEY (user_id, guild_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      guild_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (guild_id, key)
    );

    CREATE TABLE IF NOT EXISTS reaction_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      role_id TEXT NOT NULL,
      UNIQUE(message_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      user_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS role_rewards (
      guild_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, level)
    );
  `);

  return db;
}

/** Get the database instance */
function getDb() {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}

// ----- XP Operations -----

function getXp(userId, guildId) {
  const row = getDb().prepare("SELECT * FROM xp WHERE user_id = ? AND guild_id = ?").get(userId, guildId);
  return row || { user_id: userId, guild_id: guildId, xp: 0, total_messages: 0, last_xp_at: 0 };
}

function addXp(userId, guildId, amount) {
  getDb().prepare(`
    INSERT INTO xp (user_id, guild_id, xp, total_messages, last_xp_at)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(user_id, guild_id)
    DO UPDATE SET xp = xp + ?, total_messages = total_messages + 1, last_xp_at = ?
  `).run(userId, guildId, amount, Date.now(), amount, Date.now());
  return getXp(userId, guildId);
}

function getLeaderboard(guildId, limit = 10) {
  return getDb().prepare("SELECT * FROM xp WHERE guild_id = ? ORDER BY xp DESC LIMIT ?").all(guildId, limit);
}

// ----- Economy Operations -----

function getEconomy(userId, guildId) {
  const row = getDb().prepare("SELECT * FROM economy WHERE user_id = ? AND guild_id = ?").get(userId, guildId);
  return row || { user_id: userId, guild_id: guildId, balance: 0, bank: 0, last_daily: 0, last_work: 0, last_rob: 0 };
}

function ensureEconomy(userId, guildId) {
  getDb().prepare(`
    INSERT OR IGNORE INTO economy (user_id, guild_id) VALUES (?, ?)
  `).run(userId, guildId);
}

function addBalance(userId, guildId, amount) {
  ensureEconomy(userId, guildId);
  getDb().prepare("UPDATE economy SET balance = balance + ? WHERE user_id = ? AND guild_id = ?").run(amount, userId, guildId);
  return getEconomy(userId, guildId);
}

function setBalance(userId, guildId, amount) {
  ensureEconomy(userId, guildId);
  getDb().prepare("UPDATE economy SET balance = ? WHERE user_id = ? AND guild_id = ?").run(amount, userId, guildId);
}

function updateLastDaily(userId, guildId) {
  ensureEconomy(userId, guildId);
  getDb().prepare("UPDATE economy SET last_daily = ? WHERE user_id = ? AND guild_id = ?").run(Date.now(), userId, guildId);
}

function updateLastWork(userId, guildId) {
  ensureEconomy(userId, guildId);
  getDb().prepare("UPDATE economy SET last_work = ? WHERE user_id = ? AND guild_id = ?").run(Date.now(), userId, guildId);
}

function updateLastRob(userId, guildId) {
  ensureEconomy(userId, guildId);
  getDb().prepare("UPDATE economy SET last_rob = ? WHERE user_id = ? AND guild_id = ?").run(Date.now(), userId, guildId);
}

function getEconomyLeaderboard(guildId, limit = 10) {
  return getDb().prepare("SELECT * FROM economy WHERE guild_id = ? ORDER BY (balance + bank) DESC LIMIT ?").all(guildId, limit);
}

// ----- Inventory Operations -----

function getInventory(userId, guildId) {
  return getDb().prepare("SELECT * FROM inventory WHERE user_id = ? AND guild_id = ?").all(userId, guildId);
}

function hasItem(userId, guildId, itemId) {
  const row = getDb().prepare("SELECT quantity FROM inventory WHERE user_id = ? AND guild_id = ? AND item_id = ?").get(userId, guildId, itemId);
  return row && row.quantity > 0;
}

function addItem(userId, guildId, itemId) {
  getDb().prepare(`
    INSERT INTO inventory (user_id, guild_id, item_id, quantity)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(user_id, guild_id, item_id)
    DO UPDATE SET quantity = quantity + 1
  `).run(userId, guildId, itemId);
}

// ----- Warning Operations -----

function addWarning(userId, guildId, moderatorId, reason) {
  getDb().prepare("INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)").run(userId, guildId, moderatorId, reason);
}

function getWarnings(userId, guildId) {
  return getDb().prepare("SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC").all(userId, guildId);
}

// ----- Settings Operations -----

function getSetting(guildId, key) {
  const row = getDb().prepare("SELECT value FROM settings WHERE guild_id = ? AND key = ?").get(guildId, key);
  return row ? row.value : null;
}

function setSetting(guildId, key, value) {
  getDb().prepare(`
    INSERT INTO settings (guild_id, key, value) VALUES (?, ?, ?)
    ON CONFLICT(guild_id, key) DO UPDATE SET value = ?
  `).run(guildId, key, value, value);
}

// ----- Reaction Role Operations -----

function addReactionRole(guildId, channelId, messageId, emoji, roleId) {
  getDb().prepare(`
    INSERT INTO reaction_roles (guild_id, channel_id, message_id, emoji, role_id)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(message_id, emoji) DO UPDATE SET role_id = ?
  `).run(guildId, channelId, messageId, emoji, roleId, roleId);
}

function getReactionRole(messageId, emoji) {
  return getDb().prepare("SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?").get(messageId, emoji);
}

function removeReactionRole(messageId, emoji) {
  getDb().prepare("DELETE FROM reaction_roles WHERE message_id = ? AND emoji = ?").run(messageId, emoji);
}

// ----- Log Operations -----

function addLog(guildId, type, content, userId = null) {
  getDb().prepare("INSERT INTO logs (guild_id, type, content, user_id) VALUES (?, ?, ?, ?)").run(guildId, type, content, userId);
}

function getLogs(guildId, limit = 50) {
  return getDb().prepare("SELECT * FROM logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?").all(guildId, limit);
}

// ----- Role Reward Operations -----

function addRoleReward(guildId, level, roleId) {
  getDb().prepare("INSERT INTO role_rewards (guild_id, level, role_id) VALUES (?, ?, ?) ON CONFLICT(guild_id, level) DO UPDATE SET role_id = ?").run(guildId, level, roleId, roleId);
}

function getRoleRewards(guildId) {
  return getDb().prepare("SELECT * FROM role_rewards WHERE guild_id = ? ORDER BY level ASC").all(guildId);
}

function removeRoleReward(guildId, level) {
  getDb().prepare("DELETE FROM role_rewards WHERE guild_id = ? AND level = ?").run(guildId, level);
}

module.exports = {
  initDatabase, getDb,
  getXp, addXp, getLeaderboard,
  getEconomy, ensureEconomy, addBalance, setBalance,
  updateLastDaily, updateLastWork, updateLastRob, getEconomyLeaderboard,
  getInventory, hasItem, addItem,
  addWarning, getWarnings,
  getSetting, setSetting,
  addReactionRole, getReactionRole, removeReactionRole,
  addLog, getLogs,
  addRoleReward, getRoleRewards, removeRoleReward,
};
