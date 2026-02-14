/**
 * /warn — Warn a member. Stored in database.
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { addWarning, getWarnings } = require("../../utils/database");
const { warningEmbed, errorEmbed } = require("../../utils/embedBuilder");
const { addLog } = require("../../utils/database");
const { LOG_TYPES, sendToLogChannel } = require("../../features/moderationLogs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Issue a warning from the Sanhedrin")
        .addUserOption((o) => o.setName("user").setDescription("The member to warn").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for the warning").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");

        if (target.bot) {
            return interaction.reply({ embeds: [errorEmbed("Error", "You can't warn a bot. We're above the law. 🤖")], ephemeral: true });
        }

        addWarning(target.id, interaction.guild.id, interaction.user.id, reason);
        addLog(interaction.guild.id, LOG_TYPES.WARN, JSON.stringify({ targetId: target.id, targetTag: target.tag, reason, moderatorId: interaction.user.id }), target.id);
        await sendToLogChannel(interaction.guild, 'User Warned', `**User:** ${target.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`, 0xffbb00);

        const allWarnings = getWarnings(target.id, interaction.guild.id);

        const severity = allWarnings.length >= 5 ? "🚨 CRITICAL" : allWarnings.length >= 3 ? "⚠️ SERIOUS" : "📋 NOTED";

        return interaction.reply({
            embeds: [warningEmbed(
                `Warning Issued — ${severity}`,
                `**${target.username}** has received a warning from the Sanhedrin.\n\n**Reason:** ${reason}\n**Issued by:** ${interaction.user}\n**Total Warnings:** ${allWarnings.length}\n\n${allWarnings.length >= 5 ? "*This member has accumulated FIVE warnings. Consider stronger action! ⚖️*" : allWarnings.length >= 3 ? "*Three strikes... the Sanhedrin is watching closely. 👁️*" : "*Let this be a lesson. The Torah recommends repentance. 📖*"}`
            )],
        });
    },
};
