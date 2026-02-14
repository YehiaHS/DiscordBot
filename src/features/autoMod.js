const { addLog, getSetting, addWarning } = require('../utils/database');
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
            await handleAutoModTrigger(message, 'Anti-Invite', 'Posted a Discord invite link.');
            return true;
        }
    }

    // 2. Anti-Spam (6+ messages in 5 seconds)
    if (getSetting(message.guild.id, 'automod_anti_spam') === 'true') {
        if (checkSpam(message)) {
            await handleAutoModTrigger(message, 'Anti-Spam', 'Sending messages too quickly.');
            return true;
        }
    }

    // 3. Mass Mention Detection (5+ unique mentions)
    if (getSetting(message.guild.id, 'automod_anti_massmention') !== 'false') {
        const uniqueMentions = new Set(message.mentions.users.map(u => u.id));
        if (uniqueMentions.size >= 5) {
            await handleAutoModTrigger(message, 'Mass Mention', `Mentioned ${uniqueMentions.size} users at once.`);
            return true;
        }
    }

    // 4. All-caps detection (70%+ uppercase in messages over 10 chars)
    if (getSetting(message.guild.id, 'automod_anti_caps') === 'true') {
        const content = message.content.replace(/[^a-zA-Z]/g, '');
        if (content.length > 10) {
            const uppercaseRatio = (content.replace(/[^A-Z]/g, '').length) / content.length;
            if (uppercaseRatio > 0.7) {
                await handleAutoModTrigger(message, 'Excessive Caps', 'STOP YELLING. Even Moses brought the commandments in lowercase.');
                return true;
            }
        }
    }

    return false;
}

/**
 * Checks for message spamming (6+ messages in 5 seconds).
 */
function checkSpam(message) {
    const userId = message.author.id;
    const now = Date.now();

    if (!spamMap.has(userId)) {
        spamMap.set(userId, []);
    }

    const timestamps = spamMap.get(userId);
    timestamps.push(now);

    // Keep only timestamps from last 5 seconds
    const recent = timestamps.filter(t => now - t < 5000);
    spamMap.set(userId, recent);

    return recent.length > 5;
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
        addWarning(message.author.id, message.guild.id, message.client.user.id, `[Auto-Mod: ${type}] ${reason}`);

        // Log
        addLog(message.guild.id, 'automod', JSON.stringify({ type, userId: message.author.id, reason }), message.author.id);

        await sendToLogChannel(
            message.guild,
            `Auto-Mod: ${type}`,
            `**User:** ${message.author.tag} (${message.author.id})\n**Reason:** ${reason}\n**Action:** Message deleted + user warned.`,
            0xff4d4d
        );
    } catch (e) {
        console.error('Error in Auto-Mod handler:', e);
    }
}

module.exports = { runAutoMod };
