/**
 * /serverinfo — Server stats styled as a "Census of the Tribes."
 */
const { SlashCommandBuilder } = require("discord.js");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("View the Census of the Tribes 📋"),

    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();
        const channels = guild.channels.cache;
        const roles = guild.roles.cache;

        return interaction.reply({
            embeds: [createEmbed({
                title: `Census of the Tribes — ${guild.name}`,
                description: `*A full accounting of the ${guild.name} settlement.*`,
                color: COLORS.INFO,
                thumbnail: guild.iconURL({ size: 256 }),
                fields: [
                    { name: "👑 High Priest (Owner)", value: owner.user.toString(), inline: true },
                    { name: "👥 Population", value: `${guild.memberCount.toLocaleString()} souls`, inline: true },
                    { name: "📺 Channels", value: `${channels.filter((c) => c.isTextBased()).size} text · ${channels.filter((c) => c.isVoiceBased()).size} voice`, inline: true },
                    { name: "🏷️ Roles", value: `${roles.size} tribes`, inline: true },
                    { name: "🆔 Server ID", value: guild.id, inline: true },
                    { name: "📅 Founded", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: "🔒 Verification", value: guild.verificationLevel.toString(), inline: true },
                    { name: "🎉 Boosts", value: `${guild.premiumSubscriptionCount || 0} (Level ${guild.premiumTier})`, inline: true },
                ],
            })],
        });
    },
};
