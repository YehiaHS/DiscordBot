/**
 * MessageCreate event — awards XP on messages for the leveling system.
 */
const { addXp, getXp, getRoleRewards } = require("../utils/database");
const { levelFromXp, getRankForLevel, xpForLevel } = require("../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../utils/embedBuilder");
const { handleMention } = require("../features/mossadAgent");
const { runAutoMod } = require("../features/autoMod");

const XP_COOLDOWN_MS = 60_000; // 1 minute cooldown
const XP_MIN = 15;
const XP_MAX = 40;

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message) {
        // Ignore bots and DMs
        if (message.author.bot || !message.guild) return;

        // Run Auto-Mod
        const handledByAutoMod = await runAutoMod(message);
        if (handledByAutoMod) return;

        // Respond to bot mention
        if (message.mentions.has(message.client.user) && !message.content.includes('@everyone') && !message.content.includes('@here')) {
            return handleMention(message);
        }

        const userId = message.author.id;
        const guildId = message.guild.id;

        // Check cooldown
        const current = getXp(userId, guildId);
        if (Date.now() - current.last_xp_at < XP_COOLDOWN_MS) return;

        // Calculate level before XP gain
        const levelBefore = levelFromXp(current.xp);

        // Award random XP
        const xpGain = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
        const updated = addXp(userId, guildId, xpGain);

        // Check for level up
        const levelAfter = levelFromXp(updated.xp);
        if (levelAfter > levelBefore) {
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
                    levelAfter >= 30
                        ? "The Sanhedrin acknowledges your dedication. 🙏"
                        : "Keep chatting to climb the ranks of the chosen! ✡️",
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

            message.channel.send({ embeds: [embed] }).catch(() => { });
        }
    },
};
