/**
 * /bank — Deposit and withdraw shekels from the Bank of Israel.
 * Protected storage — robberies can't touch bank balance.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getEconomy, addBalance, addBank, subtractBank } = require("../../utils/database");
const { successEmbed, errorEmbed } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bank")
        .setDescription("Deposit or withdraw shekels from the Bank of Israel 🏦")
        .addStringOption((o) =>
            o.setName("action").setDescription("What to do")
                .setRequired(true)
                .addChoices(
                    { name: "Deposit", value: "deposit" },
                    { name: "Withdraw", value: "withdraw" },
                )
        )
        .addIntegerOption((o) =>
            o.setName("amount").setDescription("How many shekels (0 = all)")
                .setRequired(true)
                .setMinValue(0)
        ),

    async execute(interaction) {
        const action = interaction.options.getString("action");
        const rawAmount = interaction.options.getInteger("amount");
        const eco = getEconomy(interaction.user.id, interaction.guild.id);

        if (action === "deposit") {
            const amount = rawAmount === 0 ? eco.balance : rawAmount;

            if (amount <= 0 || eco.balance <= 0) {
                return interaction.reply({
                    embeds: [errorEmbed("Empty Pockets", "You have no shekels to deposit. Your wallet is drier than the Negev. 🏜️")],
                    ephemeral: true,
                });
            }

            if (eco.balance < amount) {
                return interaction.reply({
                    embeds: [errorEmbed("Insufficient Funds", `You only have ₪${eco.balance.toLocaleString()} in your wallet. Can't deposit what you don't have.`)],
                    ephemeral: true,
                });
            }

            addBalance(interaction.user.id, interaction.guild.id, -amount);
            addBank(interaction.user.id, interaction.guild.id, amount);
            const updated = getEconomy(interaction.user.id, interaction.guild.id);

            return interaction.reply({
                embeds: [successEmbed(
                    "Deposited! 🏦",
                    `**₪${amount.toLocaleString()}** safely stored in the Bank of Israel.\n\n**Wallet:** ₪${updated.balance.toLocaleString()}\n**Bank:** ₪${updated.bank.toLocaleString()}\n\n*Your shekels are now protected by Iron Dome-grade encryption. No thief can touch them here.*`
                )],
            });
        }

        if (action === "withdraw") {
            const amount = rawAmount === 0 ? eco.bank : rawAmount;

            if (amount <= 0 || eco.bank <= 0) {
                return interaction.reply({
                    embeds: [errorEmbed("Nothing to Withdraw", "Your bank account is empty. Like the Bamba jar after Shabbat. 🥜")],
                    ephemeral: true,
                });
            }

            if (eco.bank < amount) {
                return interaction.reply({
                    embeds: [errorEmbed("Insufficient Bank Funds", `You only have ₪${eco.bank.toLocaleString()} in the bank. Check your balance with \`/balance\`.`)],
                    ephemeral: true,
                });
            }

            subtractBank(interaction.user.id, interaction.guild.id, amount);
            addBalance(interaction.user.id, interaction.guild.id, amount);
            const updated = getEconomy(interaction.user.id, interaction.guild.id);

            return interaction.reply({
                embeds: [successEmbed(
                    "Withdrawn! 💵",
                    `**₪${amount.toLocaleString()}** withdrawn from the Bank of Israel.\n\n**Wallet:** ₪${updated.balance.toLocaleString()}\n**Bank:** ₪${updated.bank.toLocaleString()}\n\n*Be careful — shekels in your wallet can be stolen by \`/rob\`. The bank is safer.*`
                )],
            });
        }
    },
};
