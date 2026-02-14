/**
 * /setmossad — Set the channel where Agent Aleph posts dispatches.
 */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { setSetting } = require("../../utils/database");
const { successEmbed } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setmossad")
        .setDescription("Set the channel for Mossad Agent dispatches 🕵️")
        .addChannelOption((o) =>
            o.setName("channel").setDescription("The channel for Agent Aleph").setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel("channel");
        setSetting(interaction.guild.id, "mossad_channel", channel.id);

        return interaction.reply({
            embeds: [successEmbed(
                "Mossad Channel Configured 🕵️",
                `Agent Aleph will now post dispatches in ${channel}.\n\n*The operative has been reassigned. All future surveillance reports will route through this channel.*`
            )],
        });
    },
};
