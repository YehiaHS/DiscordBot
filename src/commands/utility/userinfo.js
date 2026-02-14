/**
 * /userinfo — User profile styled as a "Tribal Dossier."
 */
const { SlashCommandBuilder } = require("discord.js");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("View a member's Tribal Dossier 📋")
        .addUserOption((o) => o.setName("user").setDescription("The member to inspect")),

    async execute(interaction) {
        const target = interaction.options.getMember("user") || interaction.member;
        const user = target.user;

        const roles = target.roles.cache
            .filter((r) => r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map((r) => r.toString())
            .slice(0, 15);

        return interaction.reply({
            embeds: [createEmbed({
                title: `Tribal Dossier — ${user.username}`,
                color: target.displayColor || COLORS.INFO,
                thumbnail: user.displayAvatarURL({ size: 256 }),
                fields: [
                    { name: "🏷️ Display Name", value: target.displayName, inline: true },
                    { name: "🆔 ID", value: user.id, inline: true },
                    { name: "🤖 Bot?", value: user.bot ? "Yes (Iron Dome operative)" : "No (Human)", inline: true },
                    { name: "📅 Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: "📥 Joined Server", value: target.joinedTimestamp ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true },
                    { name: "🎨 Top Color", value: target.displayHexColor, inline: true },
                    { name: `🏷️ Roles (${roles.length})`, value: roles.length > 0 ? roles.join(", ") : "No roles (a wanderer in the desert)", inline: false },
                ],
            })],
        });
    },
};
