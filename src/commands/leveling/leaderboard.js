/**
 * /leaderboard — Top members by XP or shekels.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getLeaderboard, getEconomyLeaderboard } = require("../../utils/database");
const { levelFromXp, getRankForLevel } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View the Torah Honor Roll 📜")
        .addStringOption((o) =>
            o.setName("type").setDescription("Leaderboard type")
                .addChoices(
                    { name: "XP / Levels", value: "xp" },
                    { name: "Shekels (Economy)", value: "economy" },
                )
        ),

    async execute(interaction) {
        const type = interaction.options.getString("type") || "xp";

        if (type === "economy") {
            return showEconomyLeaderboard(interaction);
        }

        return showXpLeaderboard(interaction);
    },
};

async function showXpLeaderboard(interaction) {
    const leaders = getLeaderboard(interaction.guild.id);

    if (leaders.length === 0) {
        return interaction.reply({
            embeds: [createEmbed({
                title: "Torah Honor Roll 📜",
                description: "No one has earned XP yet! Start chatting to claim the #1 spot! ✡️",
                color: COLORS.LEVELING,
            })],
        });
    }

    const entries = leaders.map((entry, i) => {
        const level = levelFromXp(entry.xp);
        const rank = getRankForLevel(level);
        return `${MEDALS[i] || `${i + 1}.`} <@${entry.user_id}>\n   ${rank.emoji} ${rank.name} • Level ${level} • ${entry.xp.toLocaleString()} XP`;
    }).join("\n\n");

    return interaction.reply({
        embeds: [createEmbed({
            title: "Torah Honor Roll 📜",
            description: `The most active members of the tribe:\n\n${entries}`,
            color: COLORS.LEVELING,
        })],
    });
}

async function showEconomyLeaderboard(interaction) {
    const leaders = getEconomyLeaderboard(interaction.guild.id);

    if (leaders.length === 0) {
        return interaction.reply({
            embeds: [createEmbed({
                title: "Richest in the Tribe 💰",
                description: "No one has any shekels yet! Try `/daily` or `/work` to get started!",
                color: COLORS.ECONOMY,
            })],
        });
    }

    const entries = leaders.map((entry, i) => {
        const total = entry.balance + entry.bank;
        return `${MEDALS[i] || `${i + 1}.`} <@${entry.user_id}> — ₪${total.toLocaleString()}`;
    }).join("\n");

    return interaction.reply({
        embeds: [createEmbed({
            title: "Richest in the Tribe 💰",
            description: `The wealthiest members (King Solomon would be jealous):\n\n${entries}`,
            color: COLORS.ECONOMY,
        })],
    });
}
