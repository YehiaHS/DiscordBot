/**
 * /gamble — Spin the dreidel! Gimel, Hei, Nun, or Shin.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getEconomy, addBalance } = require("../../utils/database");
const { createEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

const DREIDEL_OUTCOMES = [
    { letter: "נ (Nun)", result: "nothing", emoji: "😐", description: "Nun — Nothing happens. Nes Gadol Haya Sham... but not for you." },
    { letter: "נ (Nun)", result: "nothing", emoji: "😐", description: "Nun — Zilch. Nada. Efes. Better luck next spin." },
    { letter: "ג (Gimel)", result: "win_all", emoji: "🤑", description: "GIMEL! You take the ENTIRE pot! Mazel tov, you greedy genius!" },
    { letter: "ה (Hei)", result: "win_half", emoji: "😊", description: "Hei — You win half! Not bad, not bad at all." },
    { letter: "ש (Shin)", result: "lose_all", emoji: "💀", description: "SHIN! You lose EVERYTHING! Oy vey iz mir!" },
    { letter: "ה (Hei)", result: "win_half", emoji: "😊", description: "Hei — Half the pot is yours! L'chaim!" },
    { letter: "נ (Nun)", result: "nothing", emoji: "😐", description: "Nun — The dreidel mocks you with nothingness." },
    { letter: "ש (Shin)", result: "lose_all", emoji: "💀", description: "SHIN! Your shekels have been sacrificed! The dreidel is merciless!" },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gamble")
        .setDescription("Spin the dreidel and test your mazel! 🎰")
        .addIntegerOption((o) => o.setName("amount").setDescription("Shekels to gamble").setRequired(true).setMinValue(10)),

    async execute(interaction) {
        const amount = interaction.options.getInteger("amount");
        const eco = getEconomy(interaction.user.id, interaction.guild.id);

        if (eco.balance < amount) {
            return interaction.reply({
                embeds: [errorEmbed("Broke!", `You only have ₪${eco.balance}. Can't gamble with shekels you don't have! 💸`)],
                ephemeral: true,
            });
        }

        const outcome = DREIDEL_OUTCOMES[Math.floor(Math.random() * DREIDEL_OUTCOMES.length)];
        let winnings = 0;
        let color = COLORS.WARNING;

        switch (outcome.result) {
            case "win_all":
                winnings = amount * 2;
                color = COLORS.SUCCESS;
                break;
            case "win_half":
                winnings = Math.floor(amount * 0.5);
                color = COLORS.SUCCESS;
                break;
            case "nothing":
                winnings = 0;
                color = COLORS.WARNING;
                break;
            case "lose_all":
                winnings = -amount;
                color = COLORS.ERROR;
                break;
        }

        addBalance(interaction.user.id, interaction.guild.id, winnings);
        const newBal = getEconomy(interaction.user.id, interaction.guild.id);

        return interaction.reply({
            embeds: [createEmbed({
                title: `Dreidel Spin! ${outcome.emoji}`,
                description: [
                    `**${outcome.letter}**`,
                    "",
                    outcome.description,
                    "",
                    `**Bet:** ₪${amount.toLocaleString()}`,
                    winnings > 0 ? `**Won:** ₪${winnings.toLocaleString()} 🎉` :
                        winnings < 0 ? `**Lost:** ₪${Math.abs(winnings).toLocaleString()} 😭` :
                            "**Result:** No change",
                    `**New Balance:** ₪${newBal.balance.toLocaleString()}`,
                ].join("\n"),
                color,
            })],
        });
    },
};
