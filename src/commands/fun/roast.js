/**
 * /roast — Roast a member with Jewish-themed burns.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getRoast } = require("../../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roast")
        .setDescription("Roast someone with Jewish-grade burns 🔥")
        .addUserOption((o) => o.setName("user").setDescription("Who to roast").setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const roast = getRoast(target.toString());

        return interaction.reply({
            embeds: [createEmbed({
                title: "ROASTED! 🔥",
                description: roast,
                color: COLORS.FUN,
                thumbnail: target.displayAvatarURL({ size: 128 }),
            })],
        });
    },
};
