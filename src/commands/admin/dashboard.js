/**
 * /dashboard — Generates a temporary, authenticated link to the Jewbot Command Center.
 * Admin-only. Ephemeral. Session expires after 15 minutes.
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createSession, PORT } = require("../../features/dashboardServer");
const { createEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dashboard")
        .setDescription("Open the Jewbot Command Center — admin eyes only 🕵️")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const { url, expiresAt } = createSession(
                interaction.guild.id,
                interaction.user.id,
                15 // 15-minute session
            );

            const expiresTimestamp = Math.floor(expiresAt / 1000);

            const embed = createEmbed({
                title: "Command Center Access Granted 🔐",
                description: [
                    "Your temporary dashboard link has been generated.",
                    "",
                    `**🔗 [Open Command Center](${url})**`,
                    "",
                    `⏰ **Expires:** <t:${expiresTimestamp}:R>`,
                    "",
                    "⚠️ **Security Notes:**",
                    "• This link is single-use and time-limited",
                    "• Do NOT share this link with anyone",
                    "• The session will auto-expire after 15 minutes",
                    "• All changes are applied in real-time",
                    "",
                    "*The Iron Dome dashboard gives you full control over every aspect of Jewbot. Handle with care, Commander.*",
                ].join("\n"),
                color: 0x2c52ed,
            });

            return interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
        } catch (error) {
            console.error("Dashboard session error:", error);
            return interaction.reply({
                embeds: [errorEmbed("Dashboard Unavailable", "The Command Center is currently offline. Try again later.")],
                ephemeral: true,
            });
        }
    },
};
