require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { initDatabase, getLeaderboard, getLogs, getSetting, setSetting } = require('../utils/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Initialize DB for dashboard
initDatabase();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const GUILD_ID = process.env.GUILD_ID;
let botProcess = null;

// Dashboard State & Settings
const getStatus = () => ({
    online: botProcess !== null,
    minInterval: getSetting(GUILD_ID, 'mossad_min_interval') || 30,
    maxInterval: getSetting(GUILD_ID, 'mossad_max_interval') || 60,
    modules: {
        moderation: getSetting(GUILD_ID, 'module_moderation') !== 'false',
        leveling: getSetting(GUILD_ID, 'module_leveling') !== 'false',
        economy: getSetting(GUILD_ID, 'module_economy') !== 'false',
        automod: getSetting(GUILD_ID, 'module_automod') !== 'false'
    }
});

io.on('connection', (socket) => {
    console.log('Dashboard connected');
    socket.emit('status', getStatus());

    // Initial data load
    socket.emit('leaderboard', getLeaderboard(GUILD_ID, 10));
    socket.emit('auditLogs', getLogs(GUILD_ID, 20));

    socket.on('startBot', () => {
        if (botProcess) return;

        console.log('Starting bot...');
        botProcess = spawn('node', ['src/index.js'], {
            cwd: path.join(__dirname, '..', '..'),
            env: { ...process.env, FORCE_COLOR: true }
        });

        botProcess.stdout.on('data', (data) => {
            io.emit('log', data.toString());
        });

        botProcess.stderr.on('data', (data) => {
            io.emit('log', `ERROR: ${data.toString()}`);
        });

        botProcess.on('close', (code) => {
            console.log(`Bot process exited with code ${code}`);
            botProcess = null;
            io.emit('status', getStatus());
        });

        io.emit('status', getStatus());
    });

    socket.on('stopBot', () => {
        if (!botProcess) return;
        console.log('Stopping bot...');
        botProcess.kill();
    });

    socket.on('updateSettings', (settings) => {
        setSetting(GUILD_ID, 'mossad_min_interval', settings.minInterval.toString());
        setSetting(GUILD_ID, 'mossad_max_interval', settings.maxInterval.toString());
        io.emit('status', getStatus());
    });

    socket.on('toggleModule', ({ module, enabled }) => {
        setSetting(GUILD_ID, `module_${module}`, enabled.toString());
        io.emit('status', getStatus());
    });

    socket.on('requestData', (type) => {
        if (type === 'leaderboard') socket.emit('leaderboard', getLeaderboard(GUILD_ID, 20));
        if (type === 'auditLogs') socket.emit('auditLogs', getLogs(GUILD_ID, 50));
    });
});

// Update periodically
setInterval(() => {
    io.emit('leaderboard', getLeaderboard(GUILD_ID, 10));
    io.emit('auditLogs', getLogs(GUILD_ID, 10));
}, 10000);

const PORT = process.env.DASHBOARD_PORT || 3000;
server.listen(PORT, () => {
    console.log(`\x1b[36m✡️ Iron Dome Dashboard V2 Operational\x1b[0m`);
    console.log(`\x1b[33m✡️ Command Center: http://localhost:${PORT}\x1b[0m`);
    console.log(`✡️ System Link: Guild ID ${GUILD_ID}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is busy. The dashboard might already be running!`);
        process.exit(1);
    } else {
        console.error('❌ Server startup error:', err);
    }
});
