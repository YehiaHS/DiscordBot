/**
 * /rank — View your XP rank and level.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getXp } = require("../../utils/database");
const { levelFromXp, getRankForLevel, xpForLevel } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("View your rank in the Tribe 📊")
        .addUserOption((o) => o.setName("user").setDescription("Check someone else's rank")),

    async execute(interaction) {
        const target = interaction.options.getUser("user") || interaction.user;
        const xpData = getXp(target.id, interaction.guild.id);
        const level = levelFromXp(xpData.xp);
        const rank = getRankForLevel(level);
        const currentLevelXp = xpForLevel(level);
        const nextLevelXp = xpForLevel(level + 1);
        const progress = nextLevelXp > currentLevelXp
            ? Math.floor(((xpData.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
            : 100;

        // Create a text progress bar
        const barLength = 20;
        const filled = Math.floor((progress / 100) * barLength);
        const bar = "✡".repeat(filled) + "☆".repeat(barLength - filled);

        return interaction.reply({
            embeds: [createEmbed({
                title: `${target.username}'s Rank`,
                description: [
                    `**Rank:** ${rank.emoji} ${rank.name}`,
                    `**Level:** ${level}`,
                    `**XP:** ${xpData.xp.toLocaleString()} / ${nextLevelXp.toLocaleString()}`,
                    `**Messages:** ${xpData.total_messages.toLocaleString()}`,
                    "",
                    `\`[${bar}]\` ${progress}%`,
                    "",
                    level >= 50 ? "You have ascended to legendary status. The Torah sings your name. 📜✨" :
                        level >= 25 ? "A respected scholar of the server. Keep climbing! 📚" :
                            level >= 10 ? "You're making a name for yourself in the tribe! 💪" :
                                "Keep chatting to climb the ranks of the chosen! ✡️",
                ].join("\n"),
                color: COLORS.LEVELING,
                thumbnail: target.displayAvatarURL({ size: 256 }),
            })],
        });
    },
};
