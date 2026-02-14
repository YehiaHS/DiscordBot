/**
 * /warnings — View all warnings for a member.
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getWarnings } = require("../../utils/database");
const { createEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription("View a member's rap sheet from the Sanhedrin")
        .addUserOption((o) => o.setName("user").setDescription("The member to inspect").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const warnings = getWarnings(target.id, interaction.guild.id);

        if (warnings.length === 0) {
            return interaction.reply({
                embeds: [createEmbed({
                    title: "Clean Record ✨",
                    description: `**${target.username}** has zero warnings. A true tzadik! 🙏`,
                    color: COLORS.SUCCESS,
                })],
            });
        }

        const warningList = warnings.slice(0, 10).map((w, i) =>
            `**${i + 1}.** ${w.reason}\n   ↳ By <@${w.moderator_id}> • <t:${w.created_at}:R>`
        ).join("\n\n");

        return interaction.reply({
            embeds: [createEmbed({
                title: `Rap Sheet — ${target.username} 📜`,
                description: `**Total Warnings:** ${warnings.length}\n\n${warningList}${warnings.length > 10 ? `\n\n*...and ${warnings.length - 10} more. Oy vey.*` : ""}`,
                color: warnings.length >= 5 ? COLORS.ERROR : COLORS.WARNING,
                thumbnail: target.displayAvatarURL({ size: 128 }),
            })],
        });
    },
};
