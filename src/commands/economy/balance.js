/**
 * /balance — Check your shekel stash.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getEconomy } = require("../../utils/database");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Check your shekel stash 💰")
        .addUserOption((o) => o.setName("user").setDescription("Check someone else's balance")),

    async execute(interaction) {
        const target = interaction.options.getUser("user") || interaction.user;
        const eco = getEconomy(target.id, interaction.guild.id);
        const total = eco.balance + eco.bank;

        return interaction.reply({
            embeds: [createEmbed({
                title: `${target.username}'s Shekel Stash 💰`,
                description: [
                    `**Wallet:** ₪${eco.balance.toLocaleString()}`,
                    `**Bank:** ₪${eco.bank.toLocaleString()}`,
                    `**Net Worth:** ₪${total.toLocaleString()}`,
                    "",
                    total >= 10000 ? "You're richer than King Solomon! 👑" :
                        total >= 1000 ? "A respectable fortune. Your bubbe would be proud. 👵" :
                            total > 0 ? "Every shekel counts. Keep grinding! 💪" :
                                "Broke as the Israelites in the desert. Try `/daily` or `/work`! 🏜️",
                ].join("\n"),
                color: COLORS.ECONOMY,
                thumbnail: target.displayAvatarURL({ size: 128 }),
            })],
        });
    },
};
