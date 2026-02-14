/**
 * /give — Give shekels to another member. Tzedakah!
 */
const { SlashCommandBuilder } = require("discord.js");
const { getEconomy, addBalance } = require("../../utils/database");
const { successEmbed, errorEmbed } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("give")
        .setDescription("Give shekels to another member — Tzedakah is a mitzvah! 💝")
        .addUserOption((o) => o.setName("user").setDescription("Who to give to").setRequired(true))
        .addIntegerOption((o) => o.setName("amount").setDescription("How many shekels").setRequired(true).setMinValue(1)),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed("Error", "You can't give shekels to yourself. That's not how tzedakah works! 🤦")], ephemeral: true });
        }

        if (target.bot) {
            return interaction.reply({ embeds: [errorEmbed("Error", "Bots don't need shekels. We run on electricity and chutzpah. ⚡")], ephemeral: true });
        }

        const eco = getEconomy(interaction.user.id, interaction.guild.id);
        if (eco.balance < amount) {
            return interaction.reply({ embeds: [errorEmbed("Insufficient Funds", `You only have ₪${eco.balance}. Can't give what you don't have! 💸`)], ephemeral: true });
        }

        addBalance(interaction.user.id, interaction.guild.id, -amount);
        addBalance(target.id, interaction.guild.id, amount);

        return interaction.reply({
            embeds: [successEmbed(
                "Tzedakah! 💝",
                `${interaction.user} gave **₪${amount.toLocaleString()}** to ${target}!\n\n*Tzedakah is one of the greatest mitzvot. The Rambam would be proud! 🙏*`
            )],
        });
    },
};
