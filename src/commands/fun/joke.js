/**
 * /joke — Get a random Jewish joke.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getJoke } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("joke")
        .setDescription("Get a random Jewish joke 😂"),

    async execute(interaction) {
        const joke = getJoke();

        return interaction.reply({
            embeds: [createEmbed({
                title: "Jewish Joke Time! 😂",
                description: `**${joke.setup}**\n\n||${joke.punchline}||`,
                color: COLORS.FUN,
            })],
        });
    },
};
