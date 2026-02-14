/**
 * /rob — Attempt to steal shekels from another member.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getEconomy, addBalance, updateLastRob, hasItem } = require("../../utils/database");
const { createEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

const ROB_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const SUCCESS_CHANCE = 0.4; // 40% base chance

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rob")
        .setDescription("Attempt to steal shekels from someone (risky business!) 🕵️")
        .addUserOption((o) => o.setName("user").setDescription("Who to rob").setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser("user");

        if (target.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed("Error", "You can't rob yourself. That's just moving shekels between pockets. 🤦")], ephemeral: true });
        }

        if (target.bot) {
            return interaction.reply({ embeds: [errorEmbed("Error", "You can't rob a bot. We're protected by the Iron Dome of code. 🛡️")], ephemeral: true });
        }

        const robberEco = getEconomy(interaction.user.id, interaction.guild.id);
        const timeLeft = ROB_COOLDOWN_MS - (Date.now() - robberEco.last_rob);

        if (timeLeft > 0 && robberEco.last_rob > 0) {
            const minutes = Math.floor(timeLeft / 60_000);
            return interaction.reply({
                embeds: [errorEmbed("On Cooldown!", `The Mossad is watching you. Wait **${minutes} minutes** before another heist. 👁️`)],
                ephemeral: true,
            });
        }

        const victimEco = getEconomy(target.id, interaction.guild.id);
        if (victimEco.balance < 100) {
            return interaction.reply({ embeds: [errorEmbed("Not Worth It", "They have less than ₪100. Even thieves have standards. 😤")], ephemeral: true });
        }

        // Check if victim has Iron Dome
        if (hasItem(target.id, interaction.guild.id, "iron_dome")) {
            updateLastRob(interaction.user.id, interaction.guild.id);
            const fine = Math.floor(robberEco.balance * 0.15);
            addBalance(interaction.user.id, interaction.guild.id, -fine);
            return interaction.reply({
                embeds: [createEmbed({
                    title: "INTERCEPTED! 🛡️",
                    description: `${target}'s **Iron Dome** intercepted the robbery!\n\nYou've been fined **₪${fine}** for attempted theft.\n\n*The Iron Dome protects against all threats — including you.*`,
                    color: COLORS.ERROR,
                })],
            });
        }

        updateLastRob(interaction.user.id, interaction.guild.id);

        // Roll the dice
        if (Math.random() < SUCCESS_CHANCE) {
            const stolen = Math.floor(Math.random() * Math.min(victimEco.balance, 500)) + 50;
            addBalance(interaction.user.id, interaction.guild.id, stolen);
            addBalance(target.id, interaction.guild.id, -stolen);

            return interaction.reply({
                embeds: [createEmbed({
                    title: "Heist Successful! 🕵️",
                    description: `${interaction.user} pulled off a daring heist on ${target} and stole **₪${stolen}**!\n\n*Not exactly ethical, but hey, it's the shuk. 🤷*`,
                    color: COLORS.SUCCESS,
                })],
            });
        }

        // Failed — pay a fine
        const fine = Math.floor(Math.random() * 200) + 50;
        addBalance(interaction.user.id, interaction.guild.id, -Math.min(fine, robberEco.balance));

        return interaction.reply({
            embeds: [createEmbed({
                title: "Busted! 🚨",
                description: `${interaction.user} tried to rob ${target} but got caught!\n\n**Fine:** ₪${fine}\n\n*The Shin Bet doesn't mess around. Crime doesn't pay! 👮*`,
                color: COLORS.ERROR,
            })],
        });
    },
};
