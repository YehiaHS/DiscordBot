const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setSetting } = require('../../utils/database');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Sets the channel for moderation logs.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send logs to')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: '✡️ Please select a text-based channel.', ephemeral: true });
        }

        setSetting(interaction.guild.id, 'mod_log_channel', channel.id);

        const embed = createEmbed({
            title: 'Audit Logs Configured ✡️',
            description: `Moderation logs will now be sent to ${channel}.`,
            color: COLORS.SUCCESS
        });

        await interaction.reply({ embeds: [embed] });
    },
};
