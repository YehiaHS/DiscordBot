/**
 * /poll — Create a poll. The Sanhedrin demands your vote!
 */
const { SlashCommandBuilder } = require("discord.js");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

const POLL_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("The Sanhedrin demands your vote! 🗳️")
        .addStringOption((o) => o.setName("question").setDescription("The question to vote on").setRequired(true))
        .addStringOption((o) => o.setName("option1").setDescription("Option 1").setRequired(true))
        .addStringOption((o) => o.setName("option2").setDescription("Option 2").setRequired(true))
        .addStringOption((o) => o.setName("option3").setDescription("Option 3"))
        .addStringOption((o) => o.setName("option4").setDescription("Option 4"))
        .addStringOption((o) => o.setName("option5").setDescription("Option 5")),

    async execute(interaction) {
        const question = interaction.options.getString("question");
        const options = [];
        for (let i = 1; i <= 5; i++) {
            const opt = interaction.options.getString(`option${i}`);
            if (opt) options.push(opt);
        }

        const description = options.map((opt, i) => `${POLL_EMOJIS[i]} ${opt}`).join("\n\n");

        const embed = createEmbed({
            title: `🗳️ The Sanhedrin Asks: ${question}`,
            description: `${description}\n\n*Cast your vote by reacting below. Every vote counts — this is a democracy, not a kibbutz... wait.*`,
            color: COLORS.INFO,
            fields: [
                { name: "Asked by", value: interaction.user.toString(), inline: true },
                { name: "Options", value: `${options.length}`, inline: true },
            ],
        });

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

        for (let i = 0; i < options.length; i++) {
            await msg.react(POLL_EMOJIS[i]);
        }
    },
};
