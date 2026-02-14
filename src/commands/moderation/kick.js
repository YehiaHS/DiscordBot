/**
 * /kick — Kick a member from the server.
 * "You've been exiled from the Promised Land!"
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { successEmbed, errorEmbed } = require("../../utils/embedBuilder");
const { addLog } = require("../../utils/database");
const { LOG_TYPES, sendToLogChannel } = require("../../features/moderationLogs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Exile a member from the Promised Land")
        .addUserOption((o) => o.setName("user").setDescription("The member to kick").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for the exile"))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const target = interaction.options.getMember("user");
        const reason = interaction.options.getString("reason") || "No reason provided (just vibes)";

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed("Error", "That user isn't in this server. They already fled!")], ephemeral: true });
        }

        if (!target.kickable) {
            return interaction.reply({ embeds: [errorEmbed("Error", "I can't kick this person. They have more power than Moses! 🏔️")], ephemeral: true });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed("Error", "You can't exile yourself! That's not how this works. 😤")], ephemeral: true });
        }

        await target.kick(reason);
        addLog(interaction.guild.id, LOG_TYPES.KICK, JSON.stringify({ targetId: target.id, targetTag: target.user.tag, reason, moderatorId: interaction.user.id }), target.id);
        await sendToLogChannel(interaction.guild, 'User Exiled (Kick)', `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`, 0xff4d4d);

        return interaction.reply({
            embeds: [successEmbed(
                "Member Exiled! 🏜️",
                `**${target.user.username}** has been exiled from the Promised Land!\n\n**Reason:** ${reason}\n**Exiled by:** ${interaction.user}\n\n*May they wander the desert until they learn their lesson.*`
            )],
        });
    },
};
