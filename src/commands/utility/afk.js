/**
 * /afk — Set yourself as AFK with a custom message.
 * When someone mentions an AFK user, the bot notifies them.
 * AFK is automatically cleared when the user sends a message.
 */
const { SlashCommandBuilder } = require("discord.js");
const { setAfk } = require("../../utils/database");
const { successEmbed } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("afk")
        .setDescription("Set yourself as AFK — the tribe will be notified 🏜️")
        .addStringOption((o) =>
            o.setName("message").setDescription("Your AFK message (optional)")
        ),

    async execute(interaction) {
        const message = interaction.options.getString("message") || "AFK — wandering the desert.";

        setAfk(interaction.user.id, interaction.guild.id, message);

        return interaction.reply({
            embeds: [successEmbed(
                "Gone AFK 🏜️",
                `**${interaction.user.displayName}** has gone AFK.\n\n**Message:** *${message}*\n\n*Your AFK status will be cleared when you send a message.*`
            )],
        });
    },
};
