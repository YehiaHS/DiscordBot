/**
 * MessageReactionAdd event — handles reaction roles AND starboard.
 */
const { getReactionRole } = require("../utils/database");
const { handleStarboardReaction } = require("../features/starboard");

module.exports = {
    name: "messageReactionAdd",
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;

        // Handle partial reactions
        if (reaction.partial) {
            try { await reaction.fetch(); } catch { return; }
        }

        // --- Starboard ---
        try {
            await handleStarboardReaction(reaction, user);
        } catch (e) {
            console.error('Starboard reaction error:', e);
        }

        // --- Reaction Roles ---
        const emoji = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
        const messageId = reaction.message.id;
        const guildId = reaction.message.guild?.id;

        if (!guildId) return;

        const config = getReactionRole(guildId, messageId, emoji);
        if (!config) return;

        try {
            const member = await reaction.message.guild.members.fetch(user.id);
            await member.roles.add(config.role_id, 'Reaction role');
        } catch (e) {
            console.error('Failed to add reaction role:', e);
        }
    },
};
