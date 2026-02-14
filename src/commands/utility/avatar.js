/**
 * /avatar — Show a user's avatar.
 */
const { SlashCommandBuilder } = require("discord.js");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Behold a member's face on the Western Wall 🧱")
        .addUserOption((o) => o.setName("user").setDescription("The member to view")),

    async execute(interaction) {
        const target = interaction.options.getUser("user") || interaction.user;
        const avatar = target.displayAvatarURL({ size: 1024, dynamic: true });

        return interaction.reply({
            embeds: [createEmbed({
                title: `${target.username}'s Avatar 🧱`,
                description: `*Behold! Their face projected onto the Western Wall.*\n\n[Full Size](${avatar})`,
                color: COLORS.INFO,
            }).setImage(avatar)],
        });
    },
};
