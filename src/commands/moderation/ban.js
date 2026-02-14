/**
 * /ban — Ban a member from the server.
 * "Sent to Babylon. Permanently."
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { successEmbed, errorEmbed } = require("../../utils/embedBuilder");
const { addLog } = require("../../utils/database");
const { LOG_TYPES, sendToLogChannel } = require("../../features/moderationLogs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Send a member to Babylon. Permanently.")
        .addUserOption((o) => o.setName("user").setDescription("The member to ban").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for the banishment"))
        .addIntegerOption((o) => o.setName("days").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "The Sanhedrin has spoken";
        const days = interaction.options.getInteger("days") || 0;

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed("Error", "You can't banish yourself to Babylon! 🤦")], ephemeral: true });
        }

        const member = interaction.guild.members.cache.get(target.id);
        if (member && !member.bannable) {
            return interaction.reply({ embeds: [errorEmbed("Error", "I can't ban this person. They're protected by the Ark of the Covenant! ⚡")], ephemeral: true });
        }

        await interaction.guild.members.ban(target, { reason, deleteMessageDays: days });
        addLog(interaction.guild.id, LOG_TYPES.BAN, JSON.stringify({ targetId: target.id, targetTag: target.tag, reason, moderatorId: interaction.user.id, messagesDeleted: days }), target.id);
        await sendToLogChannel(interaction.guild, 'User Banished (Ban)', `**User:** ${target.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Messages Purged:** ${days} days`, 0x000000);

        return interaction.reply({
            embeds: [successEmbed(
                "BANISHED TO BABYLON! ⛓️",
                `**${target.username}** has been sent to Babylon. Permanently.\n\n**Reason:** ${reason}\n**Banished by:** ${interaction.user}\n**Messages purged:** ${days} days\n\n*Their name shall be stricken from the Book of Life. 📜*`
            )],
        });
    },
};
