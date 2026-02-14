/**
 * Iron Dome V3 — Jewbot Command Center
 * Client-side application for the dashboard SPA.
 */

// -- State --
let token = new URLSearchParams(window.location.search).get('token');
let schema = {};
let settings = {};
let guildData = {};
let stats = {};
let sessionExpiry = 0;

// -- DOM Refs --
const $app = document.getElementById('app');
const $loading = document.getElementById('loading-screen');
const $expired = document.getElementById('expired-overlay');
const $pageContainer = document.getElementById('page-container');
const $sessionTimer = document.getElementById('session-timer');
const $pingValue = document.getElementById('ping-value');
const $guildName = document.getElementById('guild-name');
const $guildMeta = document.getElementById('guild-meta');
const $guildIcon = document.getElementById('guild-icon');
const $toasts = document.getElementById('toast-container');

// ============================================================================
// API LAYER
// ============================================================================
async function api(endpoint, opts = {}) {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const res = await fetch(`/api${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${token}`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        ...opts,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 401) {
        showExpired();
        throw new Error('Session expired');
    }
    return res.json();
}

// ============================================================================
// TOAST SYSTEM
// ============================================================================
function toast(message, type = 'success') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    $toasts.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ============================================================================
// SESSION TIMER
// ============================================================================
function updateSessionTimer() {
    const remaining = sessionExpiry - Date.now();
    if (remaining <= 0) {
        showExpired();
        return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    $sessionTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (remaining < 120000) {
        $sessionTimer.style.color = '#ff3d5a';
    } else if (remaining < 300000) {
        $sessionTimer.style.color = '#ffab40';
    }
}

function showExpired() {
    $expired.classList.remove('hidden');
}

// ============================================================================
// NAVIGATION
// ============================================================================
let currentPage = 'overview';

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (!page) return;
        currentPage = page;

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        renderPage(page);
    });
});

// ============================================================================
// PAGE RENDERERS
// ============================================================================
function renderPage(page) {
    const renderers = {
        overview: renderOverview,
        modules: () => renderCategorySettings('modules', 'Module Control', 'Toggle features on and off. Disabled modules will not respond to commands or process events.'),
        automod: () => renderCategorySettings('automod', 'Auto-Moderation', 'Configure automated message filtering. Auto-mod protects your server 24/7.'),
        mossad: () => renderCategorySettings('mossad', 'Mossad Agent Configuration', 'Control Agent Aleph\'s behavior, dispatch frequency, and personality mode.'),
        economy: () => renderCategorySettings('economy', 'Shekel Economy', 'Tune the entire economy system — daily rewards, work payouts, robbery odds.'),
        leveling: () => renderCategorySettings('leveling', 'Leveling System', 'Configure XP rates, cooldowns, and level-up announcements.'),
        channels: () => renderCategorySettings('general', 'Channel Configuration', 'Assign channels for each bot feature.'),
        starboard: () => renderCategorySettings('starboard', 'Starboard Settings', 'Configure the starboard — pin the best messages.'),
        autorole: () => renderCategorySettings('autorole', 'Auto-Role', 'Automatically assign roles to new members when they join.'),
        commands: renderCustomCommands,
        rolerewards: renderRoleRewards,
        leaderboard: renderLeaderboard,
        logs: renderAuditLogs,
    };

    const renderer = renderers[page];
    if (renderer) renderer();
}

// -- OVERVIEW PAGE --
function renderOverview() {
    $pageContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h2 class="page-title">Command Center Overview</h2>
                <p class="page-description">Real-time intelligence on Jewbot operations.</p>
            </div>

            <div class="grid-4" id="stats-grid">
                <div class="stat-card">
                    <span class="stat-icon">🏠</span>
                    <span class="stat-label">Servers</span>
                    <span class="stat-value" id="s-guilds">${stats.guilds || '--'}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">👥</span>
                    <span class="stat-label">Total Users</span>
                    <span class="stat-value" id="s-users">${(stats.users || 0).toLocaleString()}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">⚡</span>
                    <span class="stat-label">Commands</span>
                    <span class="stat-value" id="s-commands">${stats.commands || '--'}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">📡</span>
                    <span class="stat-label">Latency</span>
                    <span class="stat-value" id="s-ping">${stats.ping || '--'}ms</span>
                </div>
            </div>

            <div class="grid-2" style="margin-top: 20px;">
                <div class="stat-card">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-label">Uptime</span>
                    <span class="stat-value" id="s-uptime">${formatUptime(stats.uptime)}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">💾</span>
                    <span class="stat-label">Memory</span>
                    <span class="stat-value" id="s-memory">${stats.memoryMB || '--'} MB</span>
                </div>
            </div>

            <div class="grid-2" style="margin-top: 20px;">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">🔧 Quick Toggles</span>
                    </div>
                    ${renderQuickToggles()}
                </div>
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">📋 Recent Activity</span>
                        <button class="btn btn-ghost btn-sm" onclick="renderPage('logs')">View All</button>
                    </div>
                    <div id="recent-logs">
                        <div class="empty-state">
                            <div class="empty-icon">📜</div>
                            <div class="empty-text">Loading logs...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadRecentLogs();
}

function renderQuickToggles() {
    const toggleKeys = ['module_moderation', 'module_leveling', 'module_economy', 'module_automod', 'module_mossad', 'module_starboard'];
    return toggleKeys.map(key => {
        const s = findSchema(key);
        if (!s) return '';
        const val = getSettingValue(key);
        return `
            <div class="toggle-row">
                <div class="toggle-info">
                    <span class="toggle-label">${s.label}</span>
                    <span class="toggle-desc">${s.description}</span>
                </div>
                <label class="toggle">
                    <input type="checkbox" ${val === 'true' ? 'checked' : ''} onchange="updateSetting('${key}', this.checked ? 'true' : 'false')">
                    <span class="toggle-track"></span>
                    <span class="toggle-thumb"></span>
                </label>
            </div>
        `;
    }).join('');
}

async function loadRecentLogs() {
    try {
        const logs = await api('/logs?limit=5');
        const container = document.getElementById('recent-logs');
        if (!logs.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-text">No logs yet</div></div>';
            return;
        }
        container.innerHTML = logs.map(formatLogItem).join('');
    } catch (e) {
        console.error('Failed to load logs:', e);
    }
}

// -- CATEGORY SETTINGS PAGE --
function renderCategorySettings(categoryKey, title, description) {
    const category = schema[categoryKey];
    if (!category) {
        $pageContainer.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Category not found.</div></div></div>';
        return;
    }

    const settingsHtml = Object.entries(category.settings).map(([key, s]) => {
        const value = getSettingValue(key);
        return renderSettingControl(key, s, value);
    }).join('');

    $pageContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h2 class="page-title">${category.icon || ''} ${title}</h2>
                <p class="page-description">${description}</p>
            </div>
            <div class="card">
                ${settingsHtml}
            </div>
        </div>
    `;
}

function renderSettingControl(key, s, value) {
    if (s.type === 'toggle') {
        return `
            <div class="toggle-row">
                <div class="toggle-info">
                    <span class="toggle-label">${s.label}</span>
                    <span class="toggle-desc">${s.description}</span>
                </div>
                <label class="toggle">
                    <input type="checkbox" ${value === 'true' ? 'checked' : ''} onchange="updateSetting('${key}', this.checked ? 'true' : 'false')">
                    <span class="toggle-track"></span>
                    <span class="toggle-thumb"></span>
                </label>
            </div>
        `;
    }

    if (s.type === 'number') {
        return `
            <div class="toggle-row">
                <div class="toggle-info">
                    <span class="toggle-label">${s.label}</span>
                    <span class="toggle-desc">${s.description}${s.min !== undefined ? ` (${s.min}–${s.max})` : ''}</span>
                </div>
                <input type="number" class="form-input" value="${value}" min="${s.min || ''}" max="${s.max || ''}"
                    onchange="updateSetting('${key}', this.value)">
            </div>
        `;
    }

    if (s.type === 'select') {
        const options = (s.options || []).map(o =>
            `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`
        ).join('');
        return `
            <div class="toggle-row">
                <div class="toggle-info">
                    <span class="toggle-label">${s.label}</span>
                    <span class="toggle-desc">${s.description}</span>
                </div>
                <select class="form-select" onchange="updateSetting('${key}', this.value)">${options}</select>
            </div>
        `;
    }

    if (s.type === 'channel') {
        const channelOptions = (guildData.channels || []).map(c =>
            `<option value="${c.id}" ${value === c.id ? 'selected' : ''}>#${c.name}</option>`
        ).join('');
        return `
            <div class="toggle-row">
                <div class="toggle-info">
                    <span class="toggle-label">${s.label}</span>
                    <span class="toggle-desc">${s.description}</span>
                </div>
                <select class="form-select" onchange="updateSetting('${key}', this.value)">
                    <option value="">Not set</option>
                    ${channelOptions}
                </select>
            </div>
        `;
    }

    if (s.type === 'role') {
        const roleOptions = (guildData.roles || []).map(r =>
            `<option value="${r.id}" ${value === r.id ? 'selected' : ''}>${r.name}</option>`
        ).join('');
        return `
            <div class="toggle-row">
                <div class="toggle-info">
                    <span class="toggle-label">${s.label}</span>
                    <span class="toggle-desc">${s.description}</span>
                </div>
                <select class="form-select" onchange="updateSetting('${key}', this.value)">
                    <option value="">Not set</option>
                    ${roleOptions}
                </select>
            </div>
        `;
    }

    // Default: text input
    return `
        <div class="toggle-row">
            <div class="toggle-info">
                <span class="toggle-label">${s.label}</span>
                <span class="toggle-desc">${s.description}</span>
            </div>
            <input type="text" class="form-input" value="${escapeHtml(value || '')}" style="width: 200px;"
                onchange="updateSetting('${key}', this.value)">
        </div>
    `;
}

// -- CUSTOM COMMANDS PAGE --
async function renderCustomCommands() {
    $pageContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h2 class="page-title">⚡ Custom Commands</h2>
                <p class="page-description">Create custom text commands that respond to triggers. Type the trigger in chat and the bot responds.</p>
            </div>

            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header">
                    <span class="card-title">Add New Command</span>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Trigger</label>
                        <input type="text" id="cmd-trigger" class="form-input" placeholder="!hello" style="width: 100%;">
                    </div>
                    <div class="form-group" style="flex: 3;">
                        <label class="form-label">Response</label>
                        <input type="text" id="cmd-response" class="form-input" placeholder="Shalom! Welcome to the server!" style="width: 100%;">
                    </div>
                    <button class="btn btn-primary" onclick="addCustomCommand()">Add</button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">Active Commands</span>
                </div>
                <div id="cmd-list">
                    <div class="empty-state"><div class="empty-icon">⚡</div><div class="empty-text">Loading...</div></div>
                </div>
            </div>
        </div>
    `;

    try {
        const commands = await api('/custom-commands');
        const container = document.getElementById('cmd-list');
        if (!commands.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚡</div><div class="empty-text">No custom commands yet. Add one above!</div></div>';
            return;
        }
        container.innerHTML = commands.map(cmd => `
            <div class="cmd-item">
                <div>
                    <div class="cmd-trigger">${escapeHtml(cmd.trigger)}</div>
                    <div class="cmd-response">${escapeHtml(cmd.response)}</div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="deleteCustomCommand('${escapeHtml(cmd.trigger)}')">Delete</button>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

window.addCustomCommand = async function () {
    const trigger = document.getElementById('cmd-trigger').value.trim();
    const response = document.getElementById('cmd-response').value.trim();
    if (!trigger || !response) {
        toast('Both trigger and response are required.', 'error');
        return;
    }
    await api('/custom-commands', { method: 'POST', body: { trigger, response } });
    toast(`Command "${trigger}" created!`);
    renderCustomCommands();
};

window.deleteCustomCommand = async function (trigger) {
    await api(`/custom-commands/${encodeURIComponent(trigger)}`, { method: 'DELETE' });
    toast(`Command "${trigger}" deleted.`, 'info');
    renderCustomCommands();
};

// -- ROLE REWARDS PAGE --
async function renderRoleRewards() {
    $pageContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h2 class="page-title">🏅 Level Role Rewards</h2>
                <p class="page-description">Automatically assign roles when members reach a certain level.</p>
            </div>

            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header">
                    <span class="card-title">Add Reward</span>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Level</label>
                        <input type="number" id="rr-level" class="form-input" placeholder="10" min="1" max="100">
                    </div>
                    <div class="form-group" style="flex: 2;">
                        <label class="form-label">Role</label>
                        <select id="rr-role" class="form-select">
                            ${(guildData.roles || []).map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="addRoleReward()">Add</button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">Active Rewards</span>
                </div>
                <div id="rr-list">
                    <div class="empty-state"><div class="empty-icon">🏅</div><div class="empty-text">Loading...</div></div>
                </div>
            </div>
        </div>
    `;

    try {
        const rewards = await api('/role-rewards');
        const container = document.getElementById('rr-list');
        if (!rewards.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏅</div><div class="empty-text">No role rewards configured.</div></div>';
            return;
        }
        container.innerHTML = rewards.sort((a, b) => a.level - b.level).map(r => {
            const roleName = (guildData.roles || []).find(role => role.id === r.role_id)?.name || r.role_id;
            return `
                <div class="reward-item">
                    <span class="reward-level">Level ${r.level}</span>
                    <span class="reward-role">${escapeHtml(roleName)}</span>
                    <button class="btn btn-danger btn-sm" onclick="deleteRoleReward(${r.level})">Remove</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
    }
}

window.addRoleReward = async function () {
    const level = parseInt(document.getElementById('rr-level').value);
    const roleId = document.getElementById('rr-role').value;
    if (!level || !roleId) {
        toast('Level and role are required.', 'error');
        return;
    }
    await api('/role-rewards', { method: 'POST', body: { level, roleId } });
    toast(`Role reward set for level ${level}!`);
    renderRoleRewards();
};

window.deleteRoleReward = async function (level) {
    await api(`/role-rewards/${level}`, { method: 'DELETE' });
    toast(`Level ${level} reward removed.`, 'info');
    renderRoleRewards();
};

// -- LEADERBOARD PAGE --
async function renderLeaderboard() {
    $pageContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h2 class="page-title">🏆 Leaderboard</h2>
                <p class="page-description">Top performers across the server.</p>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">📊 XP Rankings</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Rank</th><th>User</th><th>XP</th><th>Level</th></tr></thead>
                            <tbody id="lb-xp"><tr><td colspan="4" class="empty-text">Loading...</td></tr></tbody>
                        </table>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">💰 Shekel Rankings</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Rank</th><th>User</th><th>Wallet</th><th>Bank</th></tr></thead>
                            <tbody id="lb-economy"><tr><td colspan="4" class="empty-text">Loading...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        const [xpData, econData] = await Promise.all([
            api('/leaderboard/xp'),
            api('/leaderboard/economy').catch(() => []),
        ]);

        document.getElementById('lb-xp').innerHTML = xpData.length
            ? xpData.map((u, i) => `
                <tr>
                    <td class="${i < 3 ? 'rank-' + (i + 1) : ''}">#${i + 1}</td>
                    <td>${u.user_id}</td>
                    <td>${(u.xp || 0).toLocaleString()}</td>
                    <td>Lvl ${Math.floor(Math.sqrt((u.xp || 0) / 100))}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="empty-text">No data yet</td></tr>';

        document.getElementById('lb-economy').innerHTML = econData.length
            ? econData.map((u, i) => `
                <tr>
                    <td class="${i < 3 ? 'rank-' + (i + 1) : ''}">#${i + 1}</td>
                    <td>${u.user_id}</td>
                    <td>₪${(u.balance || 0).toLocaleString()}</td>
                    <td>₪${(u.bank || 0).toLocaleString()}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="empty-text">No data yet</td></tr>';
    } catch (e) {
        console.error(e);
    }
}

// -- AUDIT LOGS PAGE --
async function renderAuditLogs() {
    $pageContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h2 class="page-title">📜 Audit Logs</h2>
                <p class="page-description">Complete moderation and system activity log.</p>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Activity Feed</span>
                    <button class="btn btn-ghost btn-sm" onclick="renderAuditLogs()">Refresh</button>
                </div>
                <div id="logs-list">
                    <div class="empty-state"><div class="empty-icon">📜</div><div class="empty-text">Loading...</div></div>
                </div>
            </div>
        </div>
    `;

    try {
        const logs = await api('/logs?limit=100');
        const container = document.getElementById('logs-list');
        if (!logs.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><div class="empty-text">No audit logs yet.</div></div>';
            return;
        }
        container.innerHTML = logs.map(formatLogItem).join('');
    } catch (e) {
        console.error(e);
    }
}

// ============================================================================
// SETTINGS UPDATE
// ============================================================================
window.updateSetting = async function (key, value) {
    try {
        await api('/settings', { method: 'POST', body: { key, value } });
        // Update local cache
        for (const cat of Object.values(settings)) {
            if (key in cat) {
                cat[key] = value;
                break;
            }
        }
        toast(`Updated: ${findSchema(key)?.label || key}`, 'success');
    } catch (e) {
        toast('Failed to update setting.', 'error');
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function findSchema(key) {
    for (const cat of Object.values(schema)) {
        if (cat.settings && cat.settings[key]) return cat.settings[key];
    }
    return null;
}

function getSettingValue(key) {
    for (const cat of Object.values(settings)) {
        if (key in cat) return cat[key];
    }
    const s = findSchema(key);
    return s ? s.default : '';
}

function formatUptime(ms) {
    if (!ms) return '--';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ${hrs % 24}h`;
    if (hrs > 0) return `${hrs}h ${min % 60}m`;
    return `${min}m ${sec % 60}s`;
}

function formatLogItem(log) {
    let content;
    try { content = JSON.parse(log.content); } catch { content = log.content; }
    const typeClass = (log.type || '').split('_')[0].toLowerCase();
    const timeStr = log.created_at ? new Date(log.created_at * 1000).toLocaleString() : '';
    return `
        <div class="log-item ${typeClass}">
            <span class="log-type">${(log.type || 'unknown').toUpperCase()}</span>
            <span class="log-time">${timeStr}</span>
            <div class="log-content">${typeof content === 'string' ? escapeHtml(content) : escapeHtml(JSON.stringify(content, null, 2))}</div>
        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================================
// INITIALIZATION
// ============================================================================
async function init() {
    if (!token) {
        showExpired();
        $loading.classList.add('done');
        return;
    }

    try {
        // Load all data in parallel
        const [schemaData, settingsData, guildInfo, sessionInfo, statsData] = await Promise.all([
            api('/schema'),
            api('/settings'),
            api('/guild'),
            api('/session'),
            api('/stats'),
        ]);

        schema = schemaData;
        settings = settingsData;
        guildData = guildInfo;
        stats = statsData;
        sessionExpiry = sessionInfo.expiresAt;

        // Populate header
        $guildName.textContent = guildInfo.name;
        $guildMeta.textContent = `${guildInfo.memberCount.toLocaleString()} members • Boost Tier ${guildInfo.boostTier}`;
        if (guildInfo.icon) {
            $guildIcon.src = guildInfo.icon;
            $guildIcon.style.display = 'block';
        } else {
            $guildIcon.style.display = 'none';
        }

        $pingValue.textContent = `${statsData.ping}ms`;

        // Show app
        setTimeout(() => {
            $loading.classList.add('done');
            setTimeout(() => {
                $app.classList.remove('hidden');
                renderPage('overview');
            }, 400);
        }, 1800);

        // Start timers
        setInterval(updateSessionTimer, 1000);
        updateSessionTimer();

        // Refresh stats every 30s
        setInterval(async () => {
            try {
                const newStats = await api('/stats');
                stats = newStats;
                $pingValue.textContent = `${newStats.ping}ms`;
                if (currentPage === 'overview') {
                    const el = (id) => document.getElementById(id);
                    if (el('s-guilds')) el('s-guilds').textContent = newStats.guilds;
                    if (el('s-users')) el('s-users').textContent = (newStats.users || 0).toLocaleString();
                    if (el('s-ping')) el('s-ping').textContent = `${newStats.ping}ms`;
                    if (el('s-uptime')) el('s-uptime').textContent = formatUptime(newStats.uptime);
                    if (el('s-memory')) el('s-memory').textContent = `${newStats.memoryMB} MB`;
                }
            } catch {
                // Session might have expired
            }
        }, 30000);

    } catch (e) {
        console.error('Init failed:', e);
        if (e.message === 'Session expired') return;
        $loading.classList.add('done');
        showExpired();
    }
}

init();
