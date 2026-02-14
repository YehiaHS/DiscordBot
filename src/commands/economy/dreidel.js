const { SlashCommandBuilder } = require('discord.js');
const { getEconomy, addBalance } = require('../../utils/database');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dreidel')
        .setDescription('Spin the dreidel for shekels!')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount of shekels to bet')
                .setRequired(true)
                .setMinValue(10)),
    async execute(interaction) {
        const bet = interaction.options.getInteger('bet');
        const economy = getEconomy(interaction.user.id, interaction.guild.id);

        if (economy.balance < bet) {
            return interaction.reply({ content: `✡️ You don't have enough shekels! You need ${bet - economy.balance} more.`, ephemeral: true });
        }

        const outcomes = [
            { letter: 'נ (Nun)', meaning: 'Nisht (Nothing)', multiplier: 0, text: "Nothing happens. You keep your shekels." },
            { letter: 'ג (Gimmel)', meaning: 'Gantz (Whole)', multiplier: 2, text: "MAZEL TOV! You win the whole pot!" },
            { letter: 'ה (Hey)', meaning: 'Halb (Half)', multiplier: 1.5, text: "Not bad! You win half the pot!" },
            { letter: 'ש (Shin)', meaning: 'Shtel (Put in)', multiplier: -1, text: "OY VEY! You must put in. You lost your bet." }
        ];

        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

        // Calculate profit/loss
        let change = 0;
        if (outcome.multiplier === -1) {
            change = -bet;
        } else if (outcome.multiplier > 0) {
            change = Math.floor(bet * (outcome.multiplier - 1));
        }

        addBalance(interaction.user.id, interaction.guild.id, change);
        const updated = getEconomy(interaction.user.id, interaction.guild.id);

        const embed = createEmbed({
            title: `Spinning the Dreidel... 🎶`,
            description: [
                `You spun the dreidel and it landed on... **${outcome.letter}**!`,
                `*(${outcome.meaning})*`,
                "",
                outcome.text,
                "",
                change > 0 ? `💰 **Profit:** +${change} shekels` : change < 0 ? `💸 **Loss:** ${change} shekels` : `😐 **Result:** Break even`,
                `✨ **New Balance:** ${updated.balance.toLocaleString()} shekels`
            ].join('\n'),
            color: change > 0 ? COLORS.SUCCESS : change < 0 ? COLORS.ERROR : COLORS.INFO,
            footer: "✡️ Nes Gadol Haya Sham! (A great miracle happened there!)"
        });

        await interaction.reply({ embeds: [embed] });
    },
};
