/**
 * /fact — Random Israel/Judaism fact.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getFact } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fact")
        .setDescription("Learn a random fact about Israel or Judaism 🧠"),

    async execute(interaction) {
        return interaction.reply({
            embeds: [createEmbed({
                title: "Did You Know? 🧠",
                description: getFact(),
                color: COLORS.INFO,
            })],
        });
    },
};
