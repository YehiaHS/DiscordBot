/**
 * MessageCreate event — XP awards, AFK handling, auto-mod, custom commands, and bot mentions.
 */
const { addXp, getXp, getRoleRewards, getAfk, removeAfk, getDb, getSetting, saveDatabase } = require("../utils/database");
const { levelFromXp, getRankForLevel, xpForLevel } = require("../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../utils/embedBuilder");
const { handleMention } = require("../features/mossadAgent");
const { runAutoMod } = require("../features/autoMod");

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message) {
        // Ignore bots and DMs
        if (message.author.bot || !message.guild) return;

        // Run Auto-Mod first
        const handledByAutoMod = await runAutoMod(message);
        if (handledByAutoMod) return;

        // ---- AFK System ----
        // Check if the message author was AFK and clear it
        const authorAfk = getAfk(message.author.id, message.guild.id);
        if (authorAfk) {
            removeAfk(message.author.id, message.guild.id);
            const duration = Math.floor((Date.now() - authorAfk.timestamp) / 60_000);
            const timeStr = duration > 60
                ? `${Math.floor(duration / 60)}h ${duration % 60}m`
                : `${duration}m`;

            const notice = await message.channel.send({
                content: `✡️ Welcome back, ${message.author}! You were AFK for **${timeStr}**. Your status has been cleared.`,
            });
            setTimeout(() => notice.delete().catch(() => { }), 8000);
        }

        // Check if anyone mentioned in this message is AFK
        if (message.mentions.users.size > 0) {
            for (const [userId, user] of message.mentions.users) {
                if (userId === message.author.id || user.bot) continue;

                const afk = getAfk(userId, message.guild.id);
                if (afk) {
                    const ago = Math.floor((Date.now() - afk.timestamp) / 60_000);
                    const timeStr = ago > 60
                        ? `${Math.floor(ago / 60)}h ${ago % 60}m ago`
                        : `${ago}m ago`;

                    await message.reply({
                        content: `🏜️ **${user.displayName}** is currently AFK (since ${timeStr}):\n> *${afk.message}*`,
                        allowedMentions: { repliedUser: false },
                    }).catch(() => { });
                }
            }
        }

        // ---- Bot Mention → Mossad Agent ----
        if (message.mentions.has(message.client.user) && !message.content.includes('@everyone') && !message.content.includes('@here')) {
            return handleMention(message);
        }

        // ---- Custom Commands ----
        const db = getDb();
        const customCmds = db.custom_commands?.[message.guild.id];
        if (customCmds && customCmds.length > 0) {
            const content = message.content.toLowerCase().trim();
            const matched = customCmds.find(cmd => content === cmd.trigger || content.startsWith(cmd.trigger + ' '));
            if (matched) {
                return message.channel.send(matched.response).catch(() => { });
            }
        }

        // ---- Leveling System ----
        if (getSetting(message.guild.id, 'module_leveling') === 'false') return;

        const userId = message.author.id;
        const guildId = message.guild.id;

        // Get configurable XP values
        const xpMin = parseInt(getSetting(guildId, 'xp_min') || '15');
        const xpMax = parseInt(getSetting(guildId, 'xp_max') || '40');
        const xpCooldown = parseInt(getSetting(guildId, 'xp_cooldown') || '60') * 1000;

        // Check cooldown
        const current = getXp(userId, guildId);
        if (Date.now() - current.last_xp_at < xpCooldown) return;

        // Calculate level before XP gain
        const levelBefore = levelFromXp(current.xp);

        // Award random XP
        const xpGain = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;
        const updated = addXp(userId, guildId, xpGain);

        // Check for level up
        const levelAfter = levelFromXp(updated.xp);
        if (levelAfter > levelBefore) {
            // Check if announcements are enabled
            if (getSetting(guildId, 'levelup_announce') === 'false') return;

            const rank = getRankForLevel(levelAfter);
            const nextLevelXp = xpForLevel(levelAfter + 1);

            const embed = createEmbed({
                title: "Level Up! 🎉",
                description: [
                    `**${message.author.displayName}** has ascended to **Level ${levelAfter}**!`,
                    "",
                    `**New Rank:** ${rank.emoji} ${rank.name}`,
                    `**Total XP:** ${updated.xp.toLocaleString()} / ${nextLevelXp.toLocaleString()}`,
                    "",
                    levelAfter >= 50 ? "The Torah sings your name. You've reached legendary status. 📜✨" :
                        levelAfter >= 30 ? "The Sanhedrin acknowledges your dedication. 🙏" :
                            levelAfter >= 15 ? "The elders take notice. Keep climbing, chaver. 📚" :
                                "Keep chatting to climb the ranks of the chosen! ✡️",
                ].join("\n"),
                color: COLORS.LEVELING,
            });

            // Assign role rewards if any
            const rewards = getRoleRewards(message.guild.id);
            const rolesToAssign = rewards.filter(r => levelAfter >= r.level).map(r => r.role_id);

            if (rolesToAssign.length > 0) {
                try {
                    await message.member.roles.add(rolesToAssign, `Level Up to ${levelAfter}`);
                } catch (e) {
                    console.error('Failed to assign level-up roles:', e);
                }
            }

            // Send to configured channel or same channel
            const levelupChannel = getSetting(guildId, 'levelup_channel');
            const targetChannel = levelupChannel
                ? message.guild.channels.cache.get(levelupChannel) || message.channel
                : message.channel;

            targetChannel.send({ embeds: [embed] }).catch(() => { });
        }

        // ---- Sticky Messages ----
        handleStickyMessage(message);
    },
};

/**
 * Re-post sticky messages after N messages to keep them at the bottom.
 */
async function handleStickyMessage(message) {
    const db = getDb();
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    const sticky = db.stickies?.[guildId]?.[channelId];
    if (!sticky) return;

    // Don't count bot messages or the sticky itself
    if (message.author.bot) return;
    if (message.id === sticky.messageId) return;

    sticky.msgCount = (sticky.msgCount || 0) + 1;

    if (sticky.msgCount >= (sticky.threshold || 5)) {
        sticky.msgCount = 0;

        try {
            // Delete old sticky
            if (sticky.messageId) {
                const old = await message.channel.messages.fetch(sticky.messageId).catch(() => null);
                if (old) await old.delete().catch(() => { });
            }

            // Re-post
            const stickyEmbed = createEmbed({
                title: "📌 Sticky Message",
                description: sticky.content,
                color: COLORS.WARNING,
                footer: "This message is pinned to the bottom of this channel.",
                timestamp: false,
            });

            const newMsg = await message.channel.send({ embeds: [stickyEmbed] });
            sticky.messageId = newMsg.id;
            saveDatabase();
        } catch (e) {
            console.error('Sticky re-post error:', e);
        }
    }
}
