/**
 * Embedded Dashboard Server — generates temporary authenticated sessions.
 * Runs inside the bot process so it has direct access to the Discord client.
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const {
    getDb, getSetting, setSetting, saveDatabase,
    getLeaderboard, getEconomyLeaderboard, getLogs,
    getWarnings, getRoleRewards, addRoleReward, removeRoleReward
} = require('../utils/database');

// Session store: token -> { guildId, userId, createdAt, expiresAt }
const sessions = new Map();

// Cleanup expired sessions every 60s
setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions) {
        if (now > session.expiresAt) {
            sessions.delete(token);
        }
    }
}, 60_000);

let app, server, io;
let dashboardClient = null; // Discord client reference
const PORT = parseInt(process.env.DASHBOARD_PORT || '3847');

/**
 * All configurable settings with defaults, types, and descriptions.
 * THIS is the single source of truth for every parameter Jewbot exposes.
 */
const CONFIG_SCHEMA = {
    // — General —
    general: {
        label: '⚙️ General',
        icon: '⚙️',
        settings: {
            welcome_channel: { type: 'channel', label: 'Welcome Channel', description: 'Channel for welcome/goodbye messages', default: '' },
            mod_log_channel: { type: 'channel', label: 'Mod Log Channel', description: 'Channel for moderation logs', default: '' },
            mossad_channel: { type: 'channel', label: 'Mossad Channel', description: 'Channel for Agent Aleph dispatches', default: '' },
            starboard_channel: { type: 'channel', label: 'Starboard Channel', description: 'Channel for starred messages', default: '' },
            ticket_category: { type: 'channel', label: 'Ticket Category', description: 'Category channel for support tickets', default: '' },
        }
    },
    // — Modules —
    modules: {
        label: '📦 Modules',
        icon: '📦',
        settings: {
            module_moderation: { type: 'toggle', label: 'Moderation', description: 'Enable moderation commands and logging', default: 'true' },
            module_leveling: { type: 'toggle', label: 'Leveling System', description: 'Enable XP and level-up tracking', default: 'true' },
            module_economy: { type: 'toggle', label: 'Economy System', description: 'Enable shekel economy', default: 'true' },
            module_automod: { type: 'toggle', label: 'Auto-Moderation', description: 'Enable automatic message filtering', default: 'true' },
            module_mossad: { type: 'toggle', label: 'Mossad Agent', description: 'Enable Agent Aleph autonomous dispatches', default: 'true' },
            module_starboard: { type: 'toggle', label: 'Starboard', description: 'Pin popular messages to starboard', default: 'true' },
            module_tickets: { type: 'toggle', label: 'Ticket System', description: 'Enable support ticket system', default: 'true' },
            module_autorole: { type: 'toggle', label: 'Auto-Role', description: 'Auto-assign roles on join', default: 'false' },
        }
    },
    // — Auto-Mod Options —
    automod: {
        label: '🛡️ Auto-Mod',
        icon: '🛡️',
        settings: {
            automod_anti_invite: { type: 'toggle', label: 'Anti-Invite Links', description: 'Delete Discord invite links', default: 'false' },
            automod_anti_spam: { type: 'toggle', label: 'Anti-Spam', description: 'Delete spam (6+ msgs in 5s)', default: 'false' },
            automod_anti_massmention: { type: 'toggle', label: 'Anti-Mass Mention', description: 'Delete messages with 5+ mentions', default: 'true' },
            automod_anti_caps: { type: 'toggle', label: 'Anti-Caps', description: 'Delete excessive caps (70%+)', default: 'false' },
            automod_warn_threshold: { type: 'number', label: 'Auto-Mute Threshold', description: 'Warnings before auto-timeout', default: '5', min: 1, max: 20 },
            automod_mute_duration: { type: 'select', label: 'Timeout Duration', description: 'Duration when auto-muted', default: '1h', options: ['1m', '5m', '10m', '30m', '1h', '6h', '1d', '1w'] },
        }
    },
    // — Mossad Agent —
    mossad: {
        label: '🕵️ Mossad Agent',
        icon: '🕵️',
        settings: {
            mossad_min_interval: { type: 'number', label: 'Min Interval (minutes)', description: 'Minimum minutes between dispatches', default: '25', min: 5, max: 120 },
            mossad_max_interval: { type: 'number', label: 'Max Interval (minutes)', description: 'Maximum minutes between dispatches', default: '55', min: 10, max: 240 },
            mossad_mention_chance: { type: 'number', label: 'Mention Chance (%)', description: 'Chance to mention a random user', default: '60', min: 0, max: 100 },
            mossad_personality: { type: 'select', label: 'Personality Mode', description: 'Agent Aleph\'s mood', default: 'balanced', options: ['aggressive', 'paranoid', 'balanced', 'cynical', 'unhinged'] },
        }
    },
    // — Leveling —
    leveling: {
        label: '📊 Leveling',
        icon: '📊',
        settings: {
            xp_min: { type: 'number', label: 'Min XP per Message', description: 'Minimum XP awarded per message', default: '15', min: 1, max: 100 },
            xp_max: { type: 'number', label: 'Max XP per Message', description: 'Maximum XP awarded per message', default: '40', min: 5, max: 200 },
            xp_cooldown: { type: 'number', label: 'XP Cooldown (seconds)', description: 'Cooldown between XP gains', default: '60', min: 10, max: 300 },
            levelup_announce: { type: 'toggle', label: 'Level-Up Announcements', description: 'Announce when users level up', default: 'true' },
            levelup_channel: { type: 'channel', label: 'Level-Up Channel', description: 'Where to send announcements (empty = same channel)', default: '' },
        }
    },
    // — Economy —
    economy: {
        label: '💰 Economy',
        icon: '💰',
        settings: {
            daily_amount_min: { type: 'number', label: 'Daily Min Shekels', description: 'Minimum daily reward', default: '100', min: 10, max: 10000 },
            daily_amount_max: { type: 'number', label: 'Daily Max Shekels', description: 'Maximum daily reward', default: '500', min: 50, max: 50000 },
            daily_streak_bonus: { type: 'number', label: 'Streak Bonus', description: 'Extra shekels per consecutive day', default: '50', min: 0, max: 1000 },
            work_cooldown: { type: 'number', label: 'Work Cooldown (minutes)', description: 'Minutes between /work uses', default: '30', min: 5, max: 120 },
            work_pay_min: { type: 'number', label: 'Work Min Pay', description: 'Minimum work earnings', default: '50', min: 10, max: 5000 },
            work_pay_max: { type: 'number', label: 'Work Max Pay', description: 'Maximum work earnings', default: '200', min: 50, max: 10000 },
            rob_cooldown: { type: 'number', label: 'Rob Cooldown (minutes)', description: 'Minutes between /rob uses', default: '60', min: 10, max: 360 },
            rob_success_chance: { type: 'number', label: 'Rob Success (%)', description: 'Chance of successful robbery', default: '40', min: 10, max: 90 },
            rob_max_percent: { type: 'number', label: 'Rob Max % Stolen', description: 'Max percentage of target wallet stolen', default: '30', min: 5, max: 50 },
            gamble_max: { type: 'number', label: 'Gamble Max Bet', description: 'Maximum gambling bet', default: '10000', min: 100, max: 1000000 },
        }
    },
    // — Starboard —
    starboard: {
        label: '⭐ Starboard',
        icon: '⭐',
        settings: {
            starboard_emoji: { type: 'text', label: 'Star Emoji', description: 'Emoji that triggers starboard', default: '⭐' },
            starboard_threshold: { type: 'number', label: 'Reaction Threshold', description: 'Stars needed to post to starboard', default: '3', min: 1, max: 20 },
            starboard_self_star: { type: 'toggle', label: 'Allow Self-Stars', description: 'Can users star their own messages?', default: 'false' },
        }
    },
    // — Auto-Role —
    autorole: {
        label: '🎭 Auto-Role',
        icon: '🎭',
        settings: {
            autorole_id: { type: 'role', label: 'Auto-Assign Role', description: 'Role given to new members on join', default: '' },
            autorole_delay: { type: 'number', label: 'Delay (seconds)', description: 'Wait before assigning role', default: '0', min: 0, max: 300 },
        }
    },
};

/**
 * Creates a temporary dashboard session.
 * @param {string} guildId
 * @param {string} userId
 * @param {number} ttlMinutes - Session lifetime in minutes
 * @returns {{ token: string, url: string, expiresAt: number }}
 */
function createSession(guildId, userId, ttlMinutes = 15) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + ttlMinutes * 60_000;
    sessions.set(token, { guildId, userId, createdAt: Date.now(), expiresAt });
    const url = `http://localhost:${PORT}/panel?token=${token}`;
    return { token, url, expiresAt };
}

/**
 * Validate a session token.
 * @param {string} token
 * @returns {object|null} Session data or null if invalid/expired
 */
function validateSession(token) {
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return null;
    }
    return session;
}

/**
 * Start the embedded dashboard server.
 * @param {import('discord.js').Client} client
 */
function startDashboard(client) {
    dashboardClient = client;

    app = express();
    server = http.createServer(app);
    io = new Server(server, {
        cors: { origin: '*' }
    });

    app.use(express.json());
    app.use(express.static(path.join(__dirname, '..', 'dashboard', 'public')));

    // Auth middleware for API routes
    app.use('/api', (req, res, next) => {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
        const session = validateSession(token);
        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid. Generate a new link with /dashboard.' });
        }
        req.session = session;
        next();
    });

    // ---- REST API ----

    // Get config schema
    app.get('/api/schema', (req, res) => {
        res.json(CONFIG_SCHEMA);
    });

    // Get all settings for guild
    app.get('/api/settings', (req, res) => {
        const guildId = req.session.guildId;
        const result = {};
        for (const [category, catData] of Object.entries(CONFIG_SCHEMA)) {
            result[category] = {};
            for (const [key, schema] of Object.entries(catData.settings)) {
                result[category][key] = getSetting(guildId, key) ?? schema.default;
            }
        }
        res.json(result);
    });

    // Update a setting
    app.post('/api/settings', (req, res) => {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'Missing key' });
        setSetting(req.session.guildId, key, String(value));
        res.json({ ok: true, key, value: String(value) });
    });

    // Bulk update settings
    app.post('/api/settings/bulk', (req, res) => {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Invalid settings object' });
        }
        for (const [key, value] of Object.entries(settings)) {
            setSetting(req.session.guildId, key, String(value));
        }
        res.json({ ok: true, count: Object.keys(settings).length });
    });

    // Get guild info
    app.get('/api/guild', (req, res) => {
        const guild = dashboardClient.guilds.cache.get(req.session.guildId);
        if (!guild) return res.status(404).json({ error: 'Guild not found' });

        const channels = guild.channels.cache
            .filter(c => c.isTextBased())
            .map(c => ({ id: c.id, name: c.name, type: c.type }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const roles = guild.roles.cache
            .filter(r => r.id !== guild.id)
            .map(r => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position }))
            .sort((a, b) => b.position - a.position);

        const categories = guild.channels.cache
            .filter(c => c.type === 4) // CategoryChannel
            .map(c => ({ id: c.id, name: c.name }));

        res.json({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ size: 128 }),
            memberCount: guild.memberCount,
            channels,
            roles,
            categories,
            boosts: guild.premiumSubscriptionCount || 0,
            boostTier: guild.premiumTier,
        });
    });

    // Get leaderboard
    app.get('/api/leaderboard/:type', (req, res) => {
        const guildId = req.session.guildId;
        const type = req.params.type;
        if (type === 'xp') {
            res.json(getLeaderboard(guildId, 25));
        } else if (type === 'economy') {
            res.json(getEconomyLeaderboard(guildId, 25));
        } else {
            res.status(400).json({ error: 'Invalid type. Use xp or economy.' });
        }
    });

    // Get audit logs
    app.get('/api/logs', (req, res) => {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        res.json(getLogs(req.session.guildId, limit));
    });

    // Get role rewards
    app.get('/api/role-rewards', (req, res) => {
        res.json(getRoleRewards(req.session.guildId));
    });

    // Add role reward
    app.post('/api/role-rewards', (req, res) => {
        const { level, roleId } = req.body;
        if (!level || !roleId) return res.status(400).json({ error: 'Missing level or roleId' });
        addRoleReward(req.session.guildId, parseInt(level), roleId);
        res.json({ ok: true });
    });

    // Remove role reward
    app.delete('/api/role-rewards/:level', (req, res) => {
        removeRoleReward(req.session.guildId, parseInt(req.params.level));
        res.json({ ok: true });
    });

    // Get custom commands
    app.get('/api/custom-commands', (req, res) => {
        const db = getDb();
        const key = req.session.guildId;
        res.json(db.custom_commands?.[key] || []);
    });

    // Add custom command
    app.post('/api/custom-commands', (req, res) => {
        const { trigger, response, description } = req.body;
        if (!trigger || !response) return res.status(400).json({ error: 'Missing trigger or response' });
        const db = getDb();
        if (!db.custom_commands) db.custom_commands = {};
        if (!db.custom_commands[req.session.guildId]) db.custom_commands[req.session.guildId] = [];
        db.custom_commands[req.session.guildId].push({ trigger: trigger.toLowerCase(), response, description: description || '', createdAt: Date.now() });
        saveDatabase();
        res.json({ ok: true });
    });

    // Delete custom command
    app.delete('/api/custom-commands/:trigger', (req, res) => {
        const db = getDb();
        const key = req.session.guildId;
        if (db.custom_commands?.[key]) {
            db.custom_commands[key] = db.custom_commands[key].filter(c => c.trigger !== req.params.trigger);
            saveDatabase();
        }
        res.json({ ok: true });
    });

    // Bot stats
    app.get('/api/stats', (req, res) => {
        const mem = process.memoryUsage();
        res.json({
            uptime: dashboardClient.uptime,
            guilds: dashboardClient.guilds.cache.size,
            users: dashboardClient.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
            commands: dashboardClient.commands?.size || 0,
            memoryMB: (mem.heapUsed / 1024 / 1024).toFixed(1),
            ping: dashboardClient.ws.ping,
        });
    });

    // Session info
    app.get('/api/session', (req, res) => {
        res.json({
            guildId: req.session.guildId,
            userId: req.session.userId,
            expiresAt: req.session.expiresAt,
            remainingMs: req.session.expiresAt - Date.now(),
        });
    });

    // ---- Socket.IO for real-time ----
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        const session = validateSession(token);
        if (!session) return next(new Error('Unauthorized'));
        socket.session = session;
        next();
    });

    io.on('connection', (socket) => {
        console.log('📡 Dashboard session connected:', socket.session.userId);

        socket.on('updateSetting', ({ key, value }) => {
            setSetting(socket.session.guildId, key, String(value));
            socket.emit('settingUpdated', { key, value: String(value) });
        });

        socket.on('disconnect', () => {
            console.log('📡 Dashboard session disconnected');
        });
    });

    // ---- Panel route (serves the SPA) ----
    app.get('/panel', (req, res) => {
        const token = req.query.token;
        const session = validateSession(token);
        if (!session) {
            return res.status(401).send(`
                <html>
                <head><title>Session Expired</title>
                <style>
                    body { background: #0a0e1a; color: #e0e0e0; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; }
                    h1 { color: #ff4d4d; font-size: 32px; }
                    p { color: #a0a0a0; margin-top: 10px; }
                </style>
                </head>
                <body>
                    <h1>✡️ Session Expired</h1>
                    <p>This dashboard link has expired. Run <code>/dashboard</code> in Discord to generate a new one.</p>
                </body>
                </html>
            `);
        }
        res.sendFile(path.join(__dirname, '..', 'dashboard', 'public', 'index.html'));
    });

    server.listen(PORT, () => {
        console.log(`📡 Dashboard server running on port ${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ Dashboard port ${PORT} busy. Dashboard will be unavailable.`);
        } else {
            console.error('❌ Dashboard server error:', err);
        }
    });
}

module.exports = { startDashboard, createSession, validateSession, CONFIG_SCHEMA, PORT };
