const { addLog, getSetting, addWarning, getWarnings } = require('../utils/database');
const { LOG_TYPES, sendToLogChannel } = require('./moderationLogs');

const INVITE_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
const spamMap = new Map();

/**
 * Main Auto-Mod filter.
 * @param {import('discord.js').Message} message 
 * @returns {Promise<boolean>} True if message was deleted/handled by auto-mod.
 */
async function runAutoMod(message) {
    if (message.author.bot || !message.guild || message.member?.permissions.has('ModerateMembers')) return false;

    // 1. Anti-Invite
    if (getSetting(message.guild.id, 'automod_anti_invite') === 'true') {
        if (INVITE_REGEX.test(message.content)) {
            await handleAutoModTrigger(message, 'Anti-Invite', 'Sent a Discord invite link.');
            return true;
        }
    }

    // 2. Anti-Spam
    if (getSetting(message.guild.id, 'automod_anti_spam') === 'true') {
        const isSpamming = checkSpam(message);
        if (isSpamming) {
            await handleAutoModTrigger(message, 'Anti-Spam', 'Sending messages too fast.');
            return true;
        }
    }

    return false;
}

/**
 * Checks for message spamming.
 */
function checkSpam(message) {
    const userId = message.author.id;
    const now = Date.now();

    if (!spamMap.has(userId)) {
        spamMap.set(userId, []);
    }

    const timestamps = spamMap.get(userId);
    timestamps.push(now);

    // Filter for last 5 seconds
    const recent = timestamps.filter(t => now - t < 5000);
    spamMap.set(userId, recent);

    return recent.length > 5; // 6 messages in 5 seconds
}

/**
 * Handles an auto-mod trigger (deletion, warning, logging).
 */
async function handleAutoModTrigger(message, type, reason) {
    try {
        await message.delete();

        const feedback = await message.channel.send(`✡️ ${message.author}, watch your chutzpah! ${reason} (Auto-Mod: ${type})`);
        setTimeout(() => feedback.delete().catch(() => { }), 5000);

        // Auto-warn
        addWarning(message.author.id, message.guild.id, message.client.user.id, `[Auto-Mod] ${reason}`);

        // Log
        addLog(message.guild.id, 'automod', JSON.stringify({ type, userId: message.author.id, reason }), message.author.id);

        await sendToLogChannel(message.guild, `Auto-Mod Triggered: ${type}`, `**User:** ${message.author.tag} (${message.author.id})\n**Reason:** ${reason}\n**Action Taken:** Message deleted and user warned.`, 0xff4d4d);
    } catch (e) {
        console.error('Error in Auto-Mod handler:', e);
    }
}

module.exports = { runAutoMod };
