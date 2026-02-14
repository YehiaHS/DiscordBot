/**
 * /confess — Anonymous confessions posted by the bot.
 * The user's identity is never revealed.
 */
const { SlashCommandBuilder } = require("discord.js");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

const CONFESSION_HEADERS = [
    "An anonymous soul has something to share...",
    "Someone in the tribe has a confession...",
    "The following message was slipped under the synagogue door...",
    "A member of the congregation wishes to confess...",
    "From the depths of someone's soul...",
    "An unsigned note was found at the Western Wall...",
    "Someone left this in the confession box...",
    "A voice from the shadows speaks...",
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("confess")
        .setDescription("Post an anonymous confession — your identity stays hidden 🤫")
        .addStringOption((o) =>
            o.setName("confession").setDescription("What's on your mind?").setRequired(true)
        ),

    async execute(interaction) {
        const confession = interaction.options.getString("confession");
        const header = CONFESSION_HEADERS[Math.floor(Math.random() * CONFESSION_HEADERS.length)];

        // Reply ephemeral first so the user's identity is hidden
        await interaction.reply({
            content: "✡️ Your confession has been posted anonymously. Your secret is safe with the Mossad. 🤫",
            ephemeral: true,
        });

        // Post the confession as the bot
        const embed = createEmbed({
            title: "Anonymous Confession 🕯️",
            description: `*${header}*\n\n>>> ${confession}`,
            color: 0x2c2f33,
            footer: "✡️ Confessions are anonymous. The Mossad knows, but the Mossad doesn't snitch.",
            timestamp: true,
        });

        await interaction.channel.send({ embeds: [embed] });
    },
};
