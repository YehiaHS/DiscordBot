/**
 * JSON-based database initialization and access layer.
 * Purely JavaScript solution for maximum portability (Termux-friendly).
 */
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "..", "jewbot.json");

let data = {
  xp: {},
  economy: {},
  inventory: {},
  warnings: [],
  settings: {},
  reaction_roles: [],
  logs: [],
  role_rewards: {}
};

/**
 * Initialize the database and load data from JSON if it exists.
 */
function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const savedData = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      data = { ...data, ...savedData };
      console.log("✡️ Database loaded from jewbot.json");
    } catch (error) {
      console.error("❌ Failed to parse jewbot.json, starting with fresh data.");
    }
  } else {
    saveDatabase();
    console.log("✡️ Created new database: jewbot.json");
  }
}

/**
 * Save current data to the JSON file.
 */
function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("❌ Failed to save database:", error);
  }
}

/** Get the database instance (not needed for JSON, but kept for compatibility) */
function getDb() {
  return data;
}

// ----- XP Operations -----

function getXp(userId, guildId) {
  const key = `${userId}-${guildId}`;
  return data.xp[key] || { user_id: userId, guild_id: guildId, xp: 0, total_messages: 0, last_xp_at: 0 };
}

function addXp(userId, guildId, amount) {
  const key = `${userId}-${guildId}`;
  if (!data.xp[key]) {
    data.xp[key] = { user_id: userId, guild_id: guildId, xp: 0, total_messages: 0, last_xp_at: 0 };
  }
  data.xp[key].xp += amount;
  data.xp[key].total_messages += 1;
  data.xp[key].last_xp_at = Date.now();
  saveDatabase();
  return data.xp[key];
}

function getLeaderboard(guildId, limit = 10) {
  return Object.values(data.xp)
    .filter(x => x.guild_id === guildId)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

// ----- Economy Operations -----

function getEconomy(userId, guildId) {
  const key = `${userId}-${guildId}`;
  return data.economy[key] || { user_id: userId, guild_id: guildId, balance: 0, bank: 0, last_daily: 0, last_work: 0, last_rob: 0 };
}

function ensureEconomy(userId, guildId) {
  const key = `${userId}-${guildId}`;
  if (!data.economy[key]) {
    data.economy[key] = { user_id: userId, guild_id: guildId, balance: 0, bank: 0, last_daily: 0, last_work: 0, last_rob: 0 };
    saveDatabase();
  }
}

function addBalance(userId, guildId, amount) {
  ensureEconomy(userId, guildId);
  const key = `${userId}-${guildId}`;
  data.economy[key].balance += amount;
  saveDatabase();
  return data.economy[key];
}

function setBalance(userId, guildId, amount) {
  ensureEconomy(userId, guildId);
  const key = `${userId}-${guildId}`;
  data.economy[key].balance = amount;
  saveDatabase();
}

function updateLastDaily(userId, guildId) {
  ensureEconomy(userId, guildId);
  const key = `${userId}-${guildId}`;
  data.economy[key].last_daily = Date.now();
  saveDatabase();
}

function updateLastWork(userId, guildId) {
  ensureEconomy(userId, guildId);
  const key = `${userId}-${guildId}`;
  data.economy[key].last_work = Date.now();
  saveDatabase();
}

function updateLastRob(userId, guildId) {
  ensureEconomy(userId, guildId);
  const key = `${userId}-${guildId}`;
  data.economy[key].last_rob = Date.now();
  saveDatabase();
}

function getEconomyLeaderboard(guildId, limit = 10) {
  return Object.values(data.economy)
    .filter(e => e.guild_id === guildId)
    .sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank))
    .slice(0, limit);
}

// ----- Inventory Operations -----

function getInventory(userId, guildId) {
  const key = `${userId}-${guildId}`;
  return data.inventory[key] ? Object.values(data.inventory[key]) : [];
}

function hasItem(userId, guildId, itemId) {
  const key = `${userId}-${guildId}`;
  return data.inventory[key] && data.inventory[key][itemId] && data.inventory[key][itemId].quantity > 0;
}

function addItem(userId, guildId, itemId) {
  const key = `${userId}-${guildId}`;
  if (!data.inventory[key]) data.inventory[key] = {};
  if (!data.inventory[key][itemId]) {
    data.inventory[key][itemId] = { user_id: userId, guild_id: guildId, item_id: itemId, quantity: 0 };
  }
  data.inventory[key][itemId].quantity += 1;
  saveDatabase();
}

// ----- Warning Operations -----

function addWarning(userId, guildId, moderatorId, reason) {
  data.warnings.push({
    id: data.warnings.length + 1,
    user_id: userId,
    guild_id: guildId,
    moderator_id: moderatorId,
    reason,
    created_at: Math.floor(Date.now() / 1000)
  });
  saveDatabase();
}

function getWarnings(userId, guildId) {
  return data.warnings
    .filter(w => w.user_id === userId && w.guild_id === guildId)
    .sort((a, b) => b.created_at - a.created_at);
}

// ----- Settings Operations -----

function getSetting(guildId, key) {
  const sKey = `${guildId}-${key}`;
  return data.settings[sKey] || null;
}

function setSetting(guildId, key, value) {
  const sKey = `${guildId}-${key}`;
  data.settings[sKey] = value;
  saveDatabase();
}

// ----- Reaction Role Operations -----

function addReactionRole(guildId, channelId, messageId, emoji, roleId) {
  const existing = data.reaction_roles.findIndex(r => r.message_id === messageId && r.emoji === emoji);
  const rr = { id: Date.now(), guild_id: guildId, channel_id: channelId, message_id: messageId, emoji, role_id: roleId };
  if (existing > -1) {
    data.reaction_roles[existing] = rr;
  } else {
    data.reaction_roles.push(rr);
  }
  saveDatabase();
}

function getReactionRole(messageId, emoji) {
  return data.reaction_roles.find(r => r.message_id === messageId && r.emoji === emoji);
}

function removeReactionRole(messageId, emoji) {
  data.reaction_roles = data.reaction_roles.filter(r => !(r.message_id === messageId && r.emoji === emoji));
  saveDatabase();
}

// ----- Log Operations -----

function addLog(guildId, type, content, userId = null) {
  data.logs.push({
    id: Date.now(),
    guild_id: guildId,
    type,
    content,
    user_id: userId,
    created_at: Math.floor(Date.now() / 1000)
  });
  // Keep logs at reasonable size
  if (data.logs.length > 1000) data.logs.shift();
  saveDatabase();
}

function getLogs(guildId, limit = 50) {
  return data.logs
    .filter(l => l.guild_id === guildId)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
}

// ----- Role Reward Operations -----

function addRoleReward(guildId, level, roleId) {
  if (!data.role_rewards[guildId]) data.role_rewards[guildId] = {};
  data.role_rewards[guildId][level] = roleId;
  saveDatabase();
}

function getRoleRewards(guildId) {
  if (!data.role_rewards[guildId]) return [];
  return Object.entries(data.role_rewards[guildId])
    .map(([level, role_id]) => ({ level: parseInt(level), role_id }))
    .sort((a, b) => a.level - b.level);
}

function removeRoleReward(guildId, level) {
  if (data.role_rewards[guildId]) {
    delete data.role_rewards[guildId][level];
    saveDatabase();
  }
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

