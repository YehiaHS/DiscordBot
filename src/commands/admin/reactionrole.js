/**
 * /reactionrole — Set up reaction roles on a message.
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { addReactionRole } = require("../../utils/database");
const { successEmbed, errorEmbed } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reactionrole")
        .setDescription("Add a reaction role to a message ✡️")
        .addStringOption((o) => o.setName("message_id").setDescription("The message ID to add reaction role to").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("The emoji to react with").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("The role to grant").setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const messageId = interaction.options.getString("message_id");
        const emoji = interaction.options.getString("emoji");
        const role = interaction.options.getRole("role");

        // Try to find the message in the current channel
        let message;
        try {
            message = await interaction.channel.messages.fetch(messageId);
        } catch {
            return interaction.reply({
                embeds: [errorEmbed("Message Not Found", "Couldn't find that message in this channel. Make sure the ID is correct and you're in the right channel!")],
                ephemeral: true,
            });
        }

        // Check bot can manage the role
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [errorEmbed("Role Too High", "That role is above my highest role. I can't assign it! Move my role higher in the hierarchy.")],
                ephemeral: true,
            });
        }

        // Save to DB
        addReactionRole(interaction.guild.id, interaction.channel.id, messageId, emoji, role.id);

        // Add the reaction to the message
        try {
            await message.react(emoji);
        } catch {
            return interaction.reply({
                embeds: [errorEmbed("Invalid Emoji", "Couldn't react with that emoji. Make sure it's a valid emoji I can use!")],
                ephemeral: true,
            });
        }

        return interaction.reply({
            embeds: [successEmbed(
                "Reaction Role Added! ✡️",
                `React with ${emoji} on [this message](${message.url}) to get the ${role} role!\n\n*The tribes are organizing themselves. Beautiful. 🕎*`
            )],
            ephemeral: true,
        });
    },
};
