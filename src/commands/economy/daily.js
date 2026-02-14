/**
 * /daily — Collect daily shekels.
 */
const { SlashCommandBuilder } = require("discord.js");
const { getEconomy, addBalance, updateLastDaily } = require("../../utils/database");
const { createEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

const DAILY_AMOUNT = 250;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const DAILY_MESSAGES = [
    "Your daily manna from heaven has arrived! ☁️",
    "The Almighty has blessed you with your daily shekels! ✡️",
    "Another day, another shekel. That's the kibbutz life! 🌾",
    "HaShem provides! Here are today's shekels. 🙏",
    "Your daily tribute from the Temple treasury. 🏛️",
    "Mazel tov! You remembered to collect today! 🎉",
    "The Jewish Santa (who doesn't exist) left you some shekels. 🎅❌",
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Collect your daily shekels from HaShem"),

    async execute(interaction) {
        const eco = getEconomy(interaction.user.id, interaction.guild.id);
        const now = Date.now();
        const timeLeft = DAILY_COOLDOWN_MS - (now - eco.last_daily);

        if (timeLeft > 0 && eco.last_daily > 0) {
            const hours = Math.floor(timeLeft / 3_600_000);
            const minutes = Math.floor((timeLeft % 3_600_000) / 60_000);
            return interaction.reply({
                embeds: [errorEmbed(
                    "Already Collected! ⏰",
                    `You already collected today's manna!\n\n**Come back in:** ${hours}h ${minutes}m\n\n*Patience is a virtue. Even Moses waited 40 years.*`
                )],
                ephemeral: true,
            });
        }

        // Streak bonus: if collected within 48h of last daily, bonus
        const isStreak = eco.last_daily > 0 && (now - eco.last_daily) < (DAILY_COOLDOWN_MS * 2);
        const bonus = isStreak ? Math.floor(DAILY_AMOUNT * 0.2) : 0;
        const total = DAILY_AMOUNT + bonus;

        addBalance(interaction.user.id, interaction.guild.id, total);
        updateLastDaily(interaction.user.id, interaction.guild.id);

        const msg = DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)];

        return interaction.reply({
            embeds: [createEmbed({
                title: "Daily Shekels Collected! 💰",
                description: [
                    msg,
                    "",
                    `**Received:** ₪${DAILY_AMOUNT}`,
                    bonus > 0 ? `**Streak Bonus:** ₪${bonus} 🔥` : "",
                    `**Total:** ₪${total}`,
                    "",
                    "*Come back tomorrow for more! Consistency is key, like keeping Shabbat.*",
                ].filter(Boolean).join("\n"),
                color: COLORS.ECONOMY,
            })],
        });
    },
};
