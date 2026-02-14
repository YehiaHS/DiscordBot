/**
 * /sticky — Pin a message that always stays at the bottom of a channel.
 * Every N messages, the bot re-posts the sticky to keep it visible.
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getDb, saveDatabase } = require("../../utils/database");
const { createEmbed, successEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sticky")
        .setDescription("Set a sticky message that stays at the bottom of a channel 📌")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(sub => sub
            .setName("set")
            .setDescription("Set a sticky message in this channel")
            .addStringOption(o => o.setName("message").setDescription("The sticky message text").setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName("remove")
            .setDescription("Remove the sticky message from this channel")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const channelId = interaction.channel.id;
        const db = getDb();

        if (!db.stickies) db.stickies = {};
        if (!db.stickies[guildId]) db.stickies[guildId] = {};

        if (sub === "set") {
            const content = interaction.options.getString("message");

            // Delete old sticky message if it exists
            const existing = db.stickies[guildId][channelId];
            if (existing?.messageId) {
                try {
                    const oldMsg = await interaction.channel.messages.fetch(existing.messageId);
                    await oldMsg.delete();
                } catch { /* message already deleted */ }
            }

            // Send new sticky
            const stickyEmbed = createEmbed({
                title: "📌 Sticky Message",
                description: content,
                color: COLORS.WARNING,
                footer: "This message is pinned to the bottom of this channel.",
                timestamp: false,
            });

            const stickyMsg = await interaction.channel.send({ embeds: [stickyEmbed] });

            db.stickies[guildId][channelId] = {
                content,
                messageId: stickyMsg.id,
                msgCount: 0,
                threshold: 5, // Re-post after every 5 messages
            };
            saveDatabase();

            return interaction.reply({
                embeds: [successEmbed("Sticky Set 📌", "The sticky message has been set. It will be re-posted after every 5 messages to stay visible.")],
                ephemeral: true,
            });
        }

        if (sub === "remove") {
            const existing = db.stickies[guildId]?.[channelId];
            if (!existing) {
                return interaction.reply({ embeds: [errorEmbed("No Sticky", "There's no sticky message in this channel.")], ephemeral: true });
            }

            // Delete the sticky message
            if (existing.messageId) {
                try {
                    const msg = await interaction.channel.messages.fetch(existing.messageId);
                    await msg.delete();
                } catch { /* already gone */ }
            }

            delete db.stickies[guildId][channelId];
            saveDatabase();

            return interaction.reply({
                embeds: [successEmbed("Sticky Removed 📌", "The sticky message has been removed from this channel.")],
                ephemeral: true,
            });
        }
    },
};
