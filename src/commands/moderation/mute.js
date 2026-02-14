/**
 * /mute — Timeout a member.
 * "Shh! It's Shabbat for you."
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { successEmbed, errorEmbed } = require("../../utils/embedBuilder");

const DURATIONS = {
    "1m": 60_000,
    "5m": 300_000,
    "10m": 600_000,
    "30m": 1_800_000,
    "1h": 3_600_000,
    "6h": 21_600_000,
    "1d": 86_400_000,
    "1w": 604_800_000,
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Enforce Shabbat silence on a member")
        .addUserOption((o) => o.setName("user").setDescription("The member to mute").setRequired(true))
        .addStringOption((o) =>
            o.setName("duration").setDescription("How long").setRequired(true)
                .addChoices(
                    { name: "1 Minute", value: "1m" },
                    { name: "5 Minutes", value: "5m" },
                    { name: "10 Minutes", value: "10m" },
                    { name: "30 Minutes", value: "30m" },
                    { name: "1 Hour", value: "1h" },
                    { name: "6 Hours", value: "6h" },
                    { name: "1 Day", value: "1d" },
                    { name: "1 Week", value: "1w" },
                )
        )
        .addStringOption((o) => o.setName("reason").setDescription("Reason for the silence"))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getMember("user");
        const duration = interaction.options.getString("duration");
        const reason = interaction.options.getString("reason") || "Spoke during the silent Amidah";

        if (!target) {
            return interaction.reply({ embeds: [errorEmbed("Error", "Can't find that member!")], ephemeral: true });
        }

        if (!target.moderatable) {
            return interaction.reply({ embeds: [errorEmbed("Error", "I can't mute this person. They outrank me in the synagogue hierarchy! 🕍")], ephemeral: true });
        }

        const ms = DURATIONS[duration];
        await target.timeout(ms, reason);

        const durationLabel = Object.entries(DURATIONS).find(([, v]) => v === ms)?.[0] || duration;

        return interaction.reply({
            embeds: [successEmbed(
                "SHABBAT SILENCE! 🤫",
                `**${target.user.username}** has been put on Shabbat mode for **${durationLabel}**.\n\n**Reason:** ${reason}\n**Silenced by:** ${interaction.user}\n\n*Shh! No talking, no typing, no kvetching. 🕯️*`
            )],
        });
    },
};
