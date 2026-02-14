/**
 * /work — Earn shekels by doing Jewish-themed jobs.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getEconomy, addBalance, updateLastWork } = require("../../utils/database");
const { getWorkJob } = require("../../utils/jewishFlavor");
const { createEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

const WORK_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

module.exports = {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Hit the shuk and earn some shekels! 💼"),

    async execute(interaction) {
        const eco = getEconomy(interaction.user.id, interaction.guild.id);
        const timeLeft = WORK_COOLDOWN_MS - (Date.now() - eco.last_work);

        if (timeLeft > 0 && eco.last_work > 0) {
            const minutes = Math.floor(timeLeft / 60_000);
            return interaction.reply({
                embeds: [errorEmbed(
                    "Still On Break! ☕",
                    `Even in the Startup Nation, you need a break.\n\n**Try again in:** ${minutes} minutes\n\n*Grab some Bamba and chill.*`
                )],
                ephemeral: true,
            });
        }

        const { job, earned } = getWorkJob();
        addBalance(interaction.user.id, interaction.guild.id, earned);
        updateLastWork(interaction.user.id, interaction.guild.id);

        return interaction.reply({
            embeds: [createEmbed({
                title: "Work Complete! 💼",
                description: [
                    `You **${job}** and earned **₪${earned}**!`,
                    "",
                    earned >= 300 ? "What a hustle! You'd make it big in Tel Aviv! 🏙️" :
                        earned >= 150 ? "Solid work. Your parents would almost be proud. 👨‍👩‍👦" :
                            "Eh, it's honest work. Not everything can be a tech exit. 🤷",
                ].join("\n"),
                color: COLORS.ECONOMY,
            })],
        });
    },
};
