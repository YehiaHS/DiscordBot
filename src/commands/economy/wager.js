/**
 * /wager — Challenge another user to a shekel bet.
 * Both users lose or win based on a coin flip.
 */
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getEconomy, addBalance } = require("../../utils/database");
const { createEmbed, errorEmbed, successEmbed, COLORS } = require("../../utils/embedBuilder");

// Track active wagers to prevent duplicates
const activeWagers = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wager")
        .setDescription("Challenge someone to a shekel bet — winner takes all! ⚔️")
        .addUserOption((o) => o.setName("opponent").setDescription("Who to challenge").setRequired(true))
        .addIntegerOption((o) => o.setName("amount").setDescription("Shekels to bet").setRequired(true).setMinValue(10)),

    async execute(interaction) {
        const opponent = interaction.options.getUser("opponent");
        const amount = interaction.options.getInteger("amount");

        if (opponent.id === interaction.user.id) {
            return interaction.reply({ embeds: [errorEmbed("Error", "You can't wager against yourself. That's just... sad. 😢")], ephemeral: true });
        }

        if (opponent.bot) {
            return interaction.reply({ embeds: [errorEmbed("Error", "Bots don't gamble. We have algorithmic certainty on our side. 🤖")], ephemeral: true });
        }

        const challengerEco = getEconomy(interaction.user.id, interaction.guild.id);
        if (challengerEco.balance < amount) {
            return interaction.reply({
                embeds: [errorEmbed("Broke!", `You only have ₪${challengerEco.balance.toLocaleString()}. Can't bet what you don't have!`)],
                ephemeral: true,
            });
        }

        const opponentEco = getEconomy(opponent.id, interaction.guild.id);
        if (opponentEco.balance < amount) {
            return interaction.reply({
                embeds: [errorEmbed("They're Broke!", `${opponent.username} only has ₪${opponentEco.balance.toLocaleString()}. They can't cover the bet.`)],
                ephemeral: true,
            });
        }

        // Check for existing wager
        const wagerKey = `${interaction.user.id}-${opponent.id}-${interaction.guild.id}`;
        if (activeWagers.has(wagerKey)) {
            return interaction.reply({ embeds: [errorEmbed("Active Wager!", "You already have a pending wager with this person. Wait for it to resolve.")], ephemeral: true });
        }

        const acceptBtn = new ButtonBuilder()
            .setCustomId(`wager_accept_${interaction.user.id}_${opponent.id}_${amount}`)
            .setLabel("Accept the Challenge ⚔️")
            .setStyle(ButtonStyle.Success);

        const declineBtn = new ButtonBuilder()
            .setCustomId(`wager_decline_${interaction.user.id}_${opponent.id}`)
            .setLabel("Decline 🏳️")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(acceptBtn, declineBtn);

        const embed = createEmbed({
            title: "⚔️ Wager Challenge!",
            description: `${interaction.user} challenges ${opponent} to a **₪${amount.toLocaleString()}** wager!\n\nA coin will be flipped. Winner takes all.\n\n${opponent}, do you accept?`,
            color: COLORS.WARNING,
        });

        const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        activeWagers.set(wagerKey, true);

        // Collect response
        const filter = (i) => i.user.id === opponent.id;

        try {
            const response = await reply.awaitMessageComponent({ filter, time: 60_000 });

            activeWagers.delete(wagerKey);

            if (response.customId.startsWith("wager_decline")) {
                return response.update({
                    embeds: [createEmbed({
                        title: "Wager Declined 🏳️",
                        description: `${opponent} backed down from ${interaction.user}'s challenge.\n\n*No shekels were exchanged. Cowardice, however, has been noted.*`,
                        color: COLORS.ERROR,
                    })],
                    components: [],
                });
            }

            // Accept — flip the coin
            const challengerWins = Math.random() < 0.5;
            const winner = challengerWins ? interaction.user : opponent;
            const loser = challengerWins ? opponent : interaction.user;

            addBalance(winner.id, interaction.guild.id, amount);
            addBalance(loser.id, interaction.guild.id, -amount);

            return response.update({
                embeds: [createEmbed({
                    title: `${challengerWins ? "🪙 Heads!" : "🪙 Tails!"}`,
                    description: [
                        `**${winner.username}** wins **₪${amount.toLocaleString()}** from **${loser.username}**!`,
                        "",
                        challengerWins
                            ? "The challenger claims victory! A decisive strike. 🎯"
                            : "The defender holds firm and takes the pot! L'chaim! 🥂",
                        "",
                        `*₪${(amount * 2).toLocaleString()} was at stake. Only the bold prosper in the shuk.*`,
                    ].join("\n"),
                    color: COLORS.ECONOMY,
                })],
                components: [],
            });
        } catch (e) {
            activeWagers.delete(wagerKey);
            await reply.edit({
                embeds: [createEmbed({
                    title: "Wager Expired ⏰",
                    description: `${opponent} didn't respond in time. The challenge has been withdrawn.\n\n*Silence is the refuge of the undecided. And the afraid.*`,
                    color: COLORS.WARNING,
                })],
                components: [],
            }).catch(() => { });
        }
    },
};
