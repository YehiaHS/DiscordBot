/**
 * /hebrew — Learn a random Hebrew word or slang.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getHebrewWord } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hebrew")
        .setDescription("Learn a Hebrew/Israeli slang word! 🇮🇱"),

    async execute(interaction) {
        const word = getHebrewWord();

        return interaction.reply({
            embeds: [createEmbed({
                title: "Hebrew Word of the Day 🇮🇱",
                description: [
                    `# ${word.word}`,
                    "",
                    `**Transliteration:** ${word.transliteration}`,
                    `**Meaning:** ${word.meaning}`,
                    "",
                    `*Now go use it in conversation and confuse your gentile friends!*`,
                ].join("\n"),
                color: COLORS.INFO,
            })],
        });
    },
};
