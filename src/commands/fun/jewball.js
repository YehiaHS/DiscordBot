/**
 * /jewball — Jewish Magic 8-Ball.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getJewballResponse } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("jewball")
        .setDescription("Ask the Jewish Magic 8-Ball a question 🔮✡️")
        .addStringOption((o) => o.setName("question").setDescription("Your burning question").setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString("question");
        const response = getJewballResponse();
        const color = response.positive ? COLORS.SUCCESS : response.negative ? COLORS.ERROR : COLORS.WARNING;

        return interaction.reply({
            embeds: [createEmbed({
                title: "The Jewball Has Spoken 🔮✡️",
                description: [
                    `**Question:** ${question}`,
                    "",
                    `**Answer:** *${response.text}*`,
                ].join("\n"),
                color,
            })],
        });
    },
};
