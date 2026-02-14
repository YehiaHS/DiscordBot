/**
 * /purge — Bulk delete messages.
 * "Cleaning house like it's Pesach!"
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { successEmbed, errorEmbed } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Clean the channel like it's Pesach! 🧹")
        .addIntegerOption((o) =>
            o.setName("count").setDescription("Number of messages to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)
        )
        .addUserOption((o) => o.setName("user").setDescription("Only delete messages from this user"))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const count = interaction.options.getInteger("count");
        const targetUser = interaction.options.getUser("user");

        await interaction.deferReply({ ephemeral: true });

        try {
            let messages = await interaction.channel.messages.fetch({ limit: count });

            if (targetUser) {
                messages = messages.filter((m) => m.author.id === targetUser.id);
            }

            const deleted = await interaction.channel.bulkDelete(messages, true);

            await interaction.editReply({
                embeds: [successEmbed(
                    "Pesach Cleaning Complete! 🧹",
                    `Swept away **${deleted.size}** messages like chametz before Passover!\n\n${targetUser ? `**Filtered by:** ${targetUser}\n` : ""}*Not a crumb of spam remains. The channel is now kosher. ✡️*`
                )],
            });
        } catch (error) {
            await interaction.editReply({
                embeds: [errorEmbed("Cleaning Failed!", "Couldn't delete messages. They might be older than 14 days (older than the exodus itself).")],
            });
        }
    },
};
