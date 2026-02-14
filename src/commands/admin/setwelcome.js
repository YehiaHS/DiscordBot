/**
 * /setwelcome — Set the welcome/goodbye channel.
 */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { setSetting } = require("../../utils/database");
const { successEmbed } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setwelcome")
        .setDescription("Set the channel for welcome and goodbye messages 🕎")
        .addChannelOption((o) =>
            o.setName("channel").setDescription("The welcome channel").setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel("channel");
        setSetting(interaction.guild.id, "welcome_channel", channel.id);

        return interaction.reply({
            embeds: [successEmbed(
                "Welcome Channel Set! 🕎",
                `New members making Aliyah will be welcomed in ${channel}.\n\nGoodbye messages will also be sent there.\n\n*Shalom and welcome to all future tribe members!*`
            )],
        });
    },
};
