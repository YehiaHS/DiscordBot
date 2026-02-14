/**
 * /matchmaker — Yenta-style compatibility check.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getMatchmakerResult } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("matchmaker")
        .setDescription("The Yenta checks if two people are bashert (destined) 💘")
        .addUserOption((o) => o.setName("user1").setDescription("First person").setRequired(true))
        .addUserOption((o) => o.setName("user2").setDescription("Second person").setRequired(true)),

    async execute(interaction) {
        const user1 = interaction.options.getUser("user1");
        const user2 = interaction.options.getUser("user2");

        // Deterministic but seemingly random based on user IDs
        const combined = BigInt(user1.id) + BigInt(user2.id);
        const percentage = Number(combined % 101n);

        const result = getMatchmakerResult(percentage);
        const hearts = "❤️".repeat(Math.ceil(percentage / 20));

        return interaction.reply({
            embeds: [createEmbed({
                title: "Yenta's Shidduch Report 💘",
                description: [
                    `${user1} × ${user2}`,
                    "",
                    `**Compatibility:** ${percentage}% ${hearts}`,
                    "",
                    result.desc,
                ].join("\n"),
                color: percentage >= 70 ? COLORS.SUCCESS : percentage >= 40 ? COLORS.WARNING : COLORS.ERROR,
            })],
        });
    },
};
