const socket = io();

// UI Elements
const botStatusRing = document.getElementById('bot-status-ring');
const botStatusLabel = document.getElementById('bot-status-label');
const botStatusSub = document.getElementById('bot-status-sub');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const consoleOutput = document.getElementById('console-output');
const clearConsoleBtn = document.getElementById('clear-console');

// Settings Elements
const minIntervalInput = document.getElementById('min-interval');
const maxIntervalInput = document.getElementById('max-interval');
const saveSettingsBtn = document.getElementById('save-settings');
const moduleToggles = document.getElementById('module-toggles');

// Tab Navigation
const navItems = document.querySelectorAll('.nav-item[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (!tab) return; // Ignore items without data-tab (like settings logo or unassigned btns)

        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tab}`);
        });

        // Request data for specific tabs
        if (tab === 'leaderboard') socket.emit('requestData', 'leaderboard');
        if (tab === 'logs') socket.emit('requestData', 'auditLogs');
    });
});

// Bot Controls
startBtn.addEventListener('click', () => socket.emit('startBot'));
stopBtn.addEventListener('click', () => socket.emit('stopBot'));
clearConsoleBtn.addEventListener('click', () => consoleOutput.innerHTML = '');

// Save Mossad Settings
saveSettingsBtn.addEventListener('click', () => {
    socket.emit('updateSettings', {
        minInterval: parseInt(minIntervalInput.value),
        maxInterval: parseInt(maxIntervalInput.value)
    });
    alert('Orders updated for Mossad units! ✡️');
});

// Socket Events
socket.on('status', (status) => {
    if (status.online) {
        botStatusRing.classList.add('active');
        botStatusRing.classList.remove('inactive');
        botStatusLabel.innerText = 'OPERATIONAL';
        botStatusSub.innerText = 'Iron Dome Active';
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        botStatusRing.classList.remove('active');
        botStatusRing.classList.add('inactive');
        botStatusLabel.innerText = 'OFFLINE';
        botStatusSub.innerText = 'Shabbat Mode Active';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }

    minIntervalInput.value = status.minInterval;
    maxIntervalInput.value = status.maxInterval;

    updateModuleList(status.modules);
});

socket.on('log', (msg) => {
    const div = document.createElement('div');
    div.className = 'log-line';
    if (msg.includes('ERROR')) div.style.color = '#ff4d4d';
    div.innerText = msg;
    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
});

socket.on('leaderboard', (data) => {
    const tbody = document.querySelector('#leaderboard-table tbody');
    tbody.innerHTML = data.map((user, i) => `
        <tr>
            <td>#${i + 1}</td>
            <td>User ID: ${user.user_id}</td>
            <td>${user.xp.toLocaleString()}</td>
            <td>Lvl ${Math.floor(Math.sqrt(user.xp / 100))}</td>
        </tr>
    `).join('');
});

socket.on('auditLogs', (logs) => {
    const list = document.getElementById('audit-log-list');
    list.innerHTML = logs.map(log => {
        let content;
        try { content = JSON.parse(log.content); } catch (e) { content = log.content; }

        const typeClass = log.type.split('_')[0] || log.type;
        return `
            <div class="audit-item ${typeClass.toLowerCase()}">
                <strong>[${log.type.toUpperCase()}]</strong> 
                <small>${new Date(log.created_at * 1000).toLocaleString()}</small>
                <div class="audit-content">${typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</div>
            </div>
        `;
    }).join('');
});

function updateModuleList(modules) {
    moduleToggles.innerHTML = Object.entries(modules).map(([name, enabled]) => `
        <div class="module-item">
            <span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>
            <div class="toggle-switch ${enabled ? 'active' : ''}" onclick="toggleModule('${name}', ${!enabled})"></div>
        </div>
    `).join('');
}

window.toggleModule = (name, enabled) => {
    socket.emit('toggleModule', { module: name, enabled });
};
