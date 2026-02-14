/**
 * /meme — Random Jewish/Israel meme caption.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getMemeCaption } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Get a random Jewish meme 😂🇮🇱"),

    async execute(interaction) {
        return interaction.reply({
            embeds: [createEmbed({
                title: "Jewish Meme 😂",
                description: getMemeCaption(),
                color: COLORS.FUN,
            })],
        });
    },
};
