/**
 * /giveaway — Create and manage giveaways.
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createEmbed, successEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");
const { getDb, saveDatabase } = require("../../utils/database");

const DURATION_MAP = {
    '30m': 30 * 60_000,
    '1h': 60 * 60_000,
    '2h': 2 * 60 * 60_000,
    '6h': 6 * 60 * 60_000,
    '12h': 12 * 60 * 60_000,
    '1d': 24 * 60 * 60_000,
    '3d': 3 * 24 * 60 * 60_000,
    '1w': 7 * 24 * 60 * 60_000,
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Create and manage giveaways 🎁")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub
            .setName("start")
            .setDescription("Start a new giveaway")
            .addStringOption(o => o.setName("prize").setDescription("What's the prize?").setRequired(true))
            .addStringOption(o => o
                .setName("duration")
                .setDescription("How long")
                .setRequired(true)
                .addChoices(
                    { name: '30 minutes', value: '30m' },
                    { name: '1 hour', value: '1h' },
                    { name: '2 hours', value: '2h' },
                    { name: '6 hours', value: '6h' },
                    { name: '12 hours', value: '12h' },
                    { name: '1 day', value: '1d' },
                    { name: '3 days', value: '3d' },
                    { name: '1 week', value: '1w' },
                )
            )
            .addIntegerOption(o => o.setName("winners").setDescription("Number of winners (default: 1)").setMinValue(1).setMaxValue(10))
        )
        .addSubcommand(sub => sub
            .setName("end")
            .setDescription("End a giveaway early")
            .addStringOption(o => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName("reroll")
            .setDescription("Reroll a finished giveaway")
            .addStringOption(o => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const db = getDb();
        if (!db.giveaways) db.giveaways = {};
        if (!db.giveaways[guildId]) db.giveaways[guildId] = {};

        if (sub === "start") {
            const prize = interaction.options.getString("prize");
            const durationKey = interaction.options.getString("duration");
            const winnerCount = interaction.options.getInteger("winners") || 1;
            const durationMs = DURATION_MAP[durationKey];
            const endsAt = Date.now() + durationMs;
            const endsTimestamp = Math.floor(endsAt / 1000);

            const embed = createEmbed({
                title: "🎁 GIVEAWAY 🎁",
                description: [
                    `**Prize:** ${prize}`,
                    `**Winners:** ${winnerCount}`,
                    `**Ends:** <t:${endsTimestamp}:R>`,
                    "",
                    `React with 🎉 to enter!`,
                    "",
                    `*Hosted by ${interaction.user}*`,
                ].join("\n"),
                color: 0xf5c842,
            });

            const msg = await interaction.channel.send({ embeds: [embed] });
            await msg.react('🎉');

            db.giveaways[guildId][msg.id] = {
                prize,
                winnersCount: winnerCount,
                channelId: interaction.channel.id,
                hostId: interaction.user.id,
                endsAt,
                ended: false,
            };
            saveDatabase();

            // Schedule end
            const timeoutMs = Math.min(durationMs, 2147483647); // Max setTimeout
            setTimeout(() => endGiveaway(interaction.client, guildId, msg.id), timeoutMs);

            return interaction.reply({
                embeds: [successEmbed("Giveaway Started!", `The giveaway for **${prize}** is live! It ends <t:${endsTimestamp}:R>.`)],
                ephemeral: true,
            });
        }

        if (sub === "end") {
            const messageId = interaction.options.getString("message_id");
            await endGiveaway(interaction.client, guildId, messageId);
            return interaction.reply({ embeds: [successEmbed("Giveaway Ended", "The giveaway has been force-ended.")], ephemeral: true });
        }

        if (sub === "reroll") {
            const messageId = interaction.options.getString("message_id");
            const giveaway = db.giveaways[guildId]?.[messageId];
            if (!giveaway) {
                return interaction.reply({ embeds: [errorEmbed("Not Found", "No giveaway found with that message ID.")], ephemeral: true });
            }

            try {
                const channel = interaction.guild.channels.cache.get(giveaway.channelId);
                const msg = await channel.messages.fetch(messageId);
                const reaction = msg.reactions.cache.get('🎉');
                if (!reaction) {
                    return interaction.reply({ embeds: [errorEmbed("No Entries", "No one entered the giveaway.")], ephemeral: true });
                }

                const users = await reaction.users.fetch();
                const participants = users.filter(u => !u.bot);

                if (participants.size === 0) {
                    return interaction.reply({ embeds: [errorEmbed("No Entries", "No valid participants found.")], ephemeral: true });
                }

                const winner = participants.random();
                await channel.send({
                    embeds: [createEmbed({
                        title: "🎉 Giveaway Rerolled!",
                        description: `New winner: ${winner}\n**Prize:** ${giveaway.prize}`,
                        color: 0xf5c842,
                    })]
                });

                return interaction.reply({ embeds: [successEmbed("Rerolled", `New winner: ${winner.tag}`)], ephemeral: true });
            } catch (e) {
                return interaction.reply({ embeds: [errorEmbed("Error", "Failed to reroll. The original message may have been deleted.")], ephemeral: true });
            }
        }
    },
};

/**
 * End a giveaway and pick winners.
 */
async function endGiveaway(client, guildId, messageId) {
    const db = getDb();
    const giveaway = db.giveaways?.[guildId]?.[messageId];
    if (!giveaway || giveaway.ended) return;

    giveaway.ended = true;
    saveDatabase();

    try {
        const guild = client.guilds.cache.get(guildId);
        const channel = guild?.channels.cache.get(giveaway.channelId);
        if (!channel) return;

        const msg = await channel.messages.fetch(messageId);
        const reaction = msg.reactions.cache.get('🎉');

        if (!reaction) {
            await channel.send({ embeds: [createEmbed({ title: "Giveaway Ended", description: `No one entered the giveaway for **${giveaway.prize}**. 😢`, color: 0xff4d4d })] });
            return;
        }

        const users = await reaction.users.fetch();
        const participants = users.filter(u => !u.bot);

        if (participants.size === 0) {
            await channel.send({ embeds: [createEmbed({ title: "Giveaway Ended", description: `No valid entries for **${giveaway.prize}**. 😢`, color: 0xff4d4d })] });
            return;
        }

        const winners = [];
        const pool = [...participants.values()];
        for (let i = 0; i < Math.min(giveaway.winnersCount, pool.length); i++) {
            const idx = Math.floor(Math.random() * pool.length);
            winners.push(pool.splice(idx, 1)[0]);
        }

        const winnerMentions = winners.map(w => w.toString()).join(', ');

        await channel.send({
            embeds: [createEmbed({
                title: "🎉 Giveaway Ended! 🎉",
                description: [
                    `**Prize:** ${giveaway.prize}`,
                    `**Winner${winners.length > 1 ? 's' : ''}:** ${winnerMentions}`,
                    "",
                    `*Congratulations! May your winnings multiply like Abraham's descendants.*`,
                ].join("\n"),
                color: 0xf5c842,
            })]
        });

        // Update original embed
        const { EmbedBuilder } = require('discord.js');
        const updatedEmbed = EmbedBuilder.from(msg.embeds[0])
            .setDescription(`**Prize:** ${giveaway.prize}\n**Winner${winners.length > 1 ? 's' : ''}:** ${winnerMentions}\n\n*Giveaway ended*`)
            .setFooter({ text: 'Giveaway ended' });

        await msg.edit({ embeds: [updatedEmbed] });

    } catch (e) {
        console.error('Error ending giveaway:', e);
    }
}
